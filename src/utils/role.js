// Which kind of account this is: ORGANIZER (축제 주최자), OPERATOR (부스 운영자), STAFF (스태프) or ADMIN
// (the 부스럭 team: reviews event-opening applications; an ordinary account the team switches to ADMIN).
// The backend stores it (sign-up `onboardingType`) and returns it as `role` from /api/me.
// Anyone without a known role counts as an organizer.

export const ROLE = {
  ORGANIZER: 'ORGANIZER',
  OPERATOR: 'OPERATOR',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
}

// Where each kind of account lands after login.
export const HOME_PATH_BY_ROLE = {
  [ROLE.ORGANIZER]: '/organizer/dashboard',
  [ROLE.OPERATOR]: '/operator/home',
  [ROLE.STAFF]: '/staff/home',
  [ROLE.ADMIN]: '/admin/applications',
}

// Which role a screen belongs to ('' = open to everyone: invitation links, visitor pages ...).
const AREA_ROLE = [
  ['/organizer', ROLE.ORGANIZER],
  ['/apply', ROLE.ORGANIZER],
  ['/pending', ROLE.ORGANIZER],
  ['/operator', ROLE.OPERATOR],
  ['/staff', ROLE.STAFF],
  ['/admin', ROLE.ADMIN],
]

// Can this account open the page it was heading for before logging in? A page remembered from
// another account (the one that just logged out) must not be used for the next one.
export function canOpen(user, path) {
  const area = AREA_ROLE.find(([prefix]) => path === prefix || path.startsWith(prefix + '/'))
  if (!area) return true
  const role = HOME_PATH_BY_ROLE[user?.role] ? user.role : ROLE.ORGANIZER
  return role === area[1]
}

export const homePathFor = (user) => (user ? (HOME_PATH_BY_ROLE[user.role] ?? HOME_PATH_BY_ROLE[ROLE.ORGANIZER]) : '/login')
