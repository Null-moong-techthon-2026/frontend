// Auth endpoints of the backend (see backend-main/docs/AUTH_START.md). Shapes:
//   signUp  -> { accountId }                 loginId / password / nickname / phoneNumber / email
//   login   -> { id, nickname }
//   getMe   -> { id, nickname, phoneNumber, email }   (no role: the backend does not store it)

import { clearCsrf, get, post } from './client'

// GET /api/auth/login-id-availability?loginId=...  -> { available }
export const checkLoginId = (loginId) =>
  get(`/api/auth/login-id-availability?loginId=${encodeURIComponent(loginId)}`)

// POST /api/auth/sign-up -> 201 { accountId }. onboardingType: 'ORGANIZER' | 'OPERATOR'.
export const signUp = (fields) => post('/api/auth/sign-up', fields)

// POST /api/auth/login -> { id, nickname }. The backend replaces the session and CSRF token.
export async function login(loginId, password) {
  const account = await post('/api/auth/login', { loginId, password })
  clearCsrf() // rotated by the backend; fetch a fresh one on the next write request
  return account
}

// GET /api/me -> account, or throws ApiError(401) when nobody is logged in.
export const getMe = () => get('/api/me')

// POST /api/auth/logout -> 204. Needs a fresh CSRF token, which client.js fetches itself.
export async function logout() {
  try {
    await post('/api/auth/logout')
  } finally {
    clearCsrf()
  }
}
