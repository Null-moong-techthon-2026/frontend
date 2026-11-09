import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { clearAfterLogin, rememberAfterLogin } from '../utils/afterLogin'
import { canOpen, homePathFor } from '../utils/role'

// Wraps routes that need a logged-in user. Logged-out visitors are sent to /login and returned
// to the page they asked for after logging in.
export default function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null // first session check still running
  if (!user) {
    rememberAfterLogin(`${location.pathname}${location.search}`)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  clearAfterLogin()
  // Another kind of account's area (an organizer typing /operator/home ...) leads back to their own home.
  if (!canOpen(user, location.pathname)) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
