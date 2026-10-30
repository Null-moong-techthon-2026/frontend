// Which kind of account this is: ORGANIZER (축제 주최자), OPERATOR (부스 운영자) or STAFF (스태프).
// The backend stores it (sign-up `onboardingType`) and returns it as `role` from /api/me.
// Anyone without a known role counts as an organizer.

export const ROLE = {
  ORGANIZER: 'ORGANIZER',
  OPERATOR: 'OPERATOR',
  STAFF: 'STAFF',
}

// Where each kind of account lands after login.
export const HOME_PATH_BY_ROLE = {
  [ROLE.ORGANIZER]: '/organizer/dashboard',
  [ROLE.OPERATOR]: '/operator/home',
  [ROLE.STAFF]: '/staff/home',
}

export const homePathFor = (user) => (user ? (HOME_PATH_BY_ROLE[user.role] ?? HOME_PATH_BY_ROLE[ROLE.ORGANIZER]) : '/login')
