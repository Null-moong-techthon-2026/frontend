import { Navigate, Outlet } from 'react-router-dom'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import { useEvent } from '../context/useEvent'
import { ROLE, homePathFor } from '../utils/role'
import ScreenShell from './ScreenShell'

// An account without an event: a booth operator / staff account has its own screens; an organizer
// opens an event first (the form at /apply).
function NoEvent() {
  const { user } = useAuth()
  const other = user.role && user.role !== ROLE.ORGANIZER
  return <Navigate to={other ? homePathFor(user) : '/apply'} replace />
}

// Wraps the organizer screens (inside RequireAuth): they all need an event to work on.
// Waits while the event loads, offers a retry when it fails, and handles accounts without one.
export default function RequireEvent() {
  const { status, error, reload } = useEvent()

  if (status === 'idle' || status === 'loading') return null
  if (status === 'none') return <NoEvent />
  if (status === 'error') {
    return (
      <ScreenShell>
        <div className="auth-body placeholder-body">
          <p>{apiErrorMessage(error)}</p>
          <button type="button" className="btn btn-outline" onClick={reload}>
            다시 시도
          </button>
        </div>
      </ScreenShell>
    )
  }
  return <Outlet />
}
