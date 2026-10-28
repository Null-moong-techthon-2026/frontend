// The page a logged-out visitor asked for (an invitation link, a deep link). Signing up sends them
// through /signup and /login, which lose the router state, so it is kept for the browser tab and
// used by the login screen; the first screen shown to a logged-in user clears it.

const KEY = 'boothluck.afterLogin'

export function rememberAfterLogin(path) {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // Storage can be blocked: the login screen then falls back to the router state.
  }
}

export function peekAfterLogin() {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearAfterLogin() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
