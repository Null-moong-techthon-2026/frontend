// Thin fetch wrapper for the backend (auth only so far).
//
// - Calls go to same-origin `/api/...`; the Vite dev server proxies them to the backend
//   (vite.config.js), so the session cookie is first-party and no CORS is needed.
// - Every non-GET request needs the backend's CSRF token. It is fetched lazily, cached, and
//   dropped whenever the backend rotates it (login / logout) or rejects it (403).
// - Errors are thrown as ApiError with the backend's error `code` (e.g. LOGIN_ID_TAKEN).

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

let csrf = null // { headerName, token }
let onUnauthorized = () => {}

// Called when an authenticated request comes back 401 (the session expired or was ended).
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler
}

export const clearCsrf = () => {
  csrf = null
}

async function ensureCsrf(force = false) {
  if (!csrf || force) {
    let res
    try {
      res = await fetch('/api/auth/csrf', { credentials: 'include' })
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server.')
    }
    // Not JSON with a token (e.g. a static host answering with index.html) = no backend here.
    const body = res.ok ? await res.json().catch(() => null) : null
    if (!body?.headerName || !body?.token) {
      throw new ApiError(res.status, 'NETWORK_ERROR', 'CSRF token request failed.')
    }
    csrf = body
  }
  return csrf
}

async function send(path, { method = 'GET', body } = {}, retried = false) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const { headerName, token } = await ensureCsrf()
    headers[headerName] = token
  }

  let res
  try {
    res = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server.')
  }

  // A stale/rotated CSRF token is rejected with 403: fetch a fresh one and retry once.
  if (res.status === 403 && method !== 'GET' && !retried) {
    await ensureCsrf(true)
    return send(path, { method, body }, true)
  }

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    // Non-JSON body (e.g. a bare 401/403/500): fall through with data = null.
  }

  if (!res.ok) {
    // This backend always explains its errors with JSON. A bare 404 / 5xx (no body) therefore
    // means nothing is answering /api: no backend on a static host, or the dev proxy is down.
    const unreachable = data === null && (res.status === 404 || res.status >= 500)
    const error = new ApiError(
      res.status,
      data?.code ??
        (unreachable ? 'NETWORK_ERROR' : res.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN'),
      data?.message ?? res.statusText,
    )
    if (res.status === 401 && path !== '/api/auth/login') onUnauthorized(error)
    throw error
  }
  // Every success response of this backend is JSON (or 204). Anything else, e.g. index.html from
  // a host that rewrites unknown paths, means there is no backend behind /api.
  if (data === null) throw new ApiError(res.status, 'NETWORK_ERROR', 'Unexpected non-JSON response.')
  return data
}

export const get = (path) => send(path)
export const post = (path, body) => send(path, { method: 'POST', body })
