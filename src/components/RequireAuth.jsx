import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Wraps routes that need a logged-in user. Logged-out visitors are sent to /login and returned
// to the page they asked for after logging in.
export default function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null // first session check still running
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
