// Which kind of account this is: ORGANIZER (축제 주최자), OPERATOR (부스 운영자) or STAFF (스태프).
//
// The backend does not store it (its signup takes only ORGANIZER / OPERATOR as a screen hint and
// /api/me does not return it), so the signup screens remember it in this browser.
// Anyone not remembered counts as an organizer.
// TODO(backend): replace with a role from /api/me - see docs/BACKEND_REQUESTS.md.

export const ROLE = {
  ORGANIZER: 'ORGANIZER',
  OPERATOR: 'OPERATOR',
  STAFF: 'STAFF',
}

const KEY = 'boothrock.accountRoles'
const OLD_OPERATOR_KEY = 'boothrock.operatorAccounts' // before staff existed: a list of operator ids

const readMap = () => {
  try {
    const map = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {}
  } catch {
    return {}
  }
}

const readOldOperators = () => {
  try {
    const list = JSON.parse(localStorage.getItem(OLD_OPERATOR_KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function rememberRole(accountId, role) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readMap(), [accountId]: role }))
  } catch {
    // Storage can be blocked; the account then counts as an organizer.
  }
}

export const getRole = (accountId) =>
  readMap()[accountId] ?? (readOldOperators().includes(accountId) ? ROLE.OPERATOR : ROLE.ORGANIZER)

export const isRememberedOperator = (accountId) => getRole(accountId) === ROLE.OPERATOR

// Where each kind of account lands after login.
export const HOME_PATH_BY_ROLE = {
  [ROLE.ORGANIZER]: '/organizer/dashboard',
  [ROLE.OPERATOR]: '/operator/home',
  [ROLE.STAFF]: '/staff/home',
}

export const homePathFor = (user) => (user ? HOME_PATH_BY_ROLE[getRole(user.id)] : '/login')
