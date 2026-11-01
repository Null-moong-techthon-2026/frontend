import { Navigate, Outlet } from 'react-router-dom'
import { useMyOpenings } from '../utils/useMyOpenings'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import { useEvent } from '../context/useEvent'
import { ROLE, homePathFor } from '../utils/role'
import ScreenShell from './ScreenShell'

// An account without an event: a booth operator / staff / admin account has its own screens. An organizer
// who already applied (waiting, rejected or just approved) goes to the waiting page; one who never applied
// goes to the application form (/apply).
function NoEvent() {
  const { user } = useAuth()
  const other = user.role && user.role !== ROLE.ORGANIZER
  const { openings, error } = useMyOpenings(other ? null : user.id)
  if (other) return <Navigate to={homePathFor(user)} replace />
  if (error) return <Navigate to="/apply" replace />
  if (!openings) return null
  return <Navigate to={openings.length > 0 ? '/pending' : '/apply'} replace />
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
