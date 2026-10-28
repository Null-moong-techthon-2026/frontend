import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { listMyEventApplications } from '../api/eventApplicationApi'
import { listMyApplications, listMyBooths } from '../api/boothApi'
import { APPLICATION_STATUS } from '../constants/eventApplication'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import { useEvent } from '../context/useEvent'
import EventPendingPage from '../pages/EventPendingPage'
import OperatorPreparingPage from '../pages/OperatorPreparingPage'
import { isRememberedOperator } from '../utils/role'
import ScreenShell from './ScreenShell'

// An account without an event is either a booth operator (their screens are not built yet) or an
// organizer whose event has not been opened yet. The signup screen remembers operator accounts in
// this browser; otherwise an account that already has booth applications or booths counts as an
// operator. For an organizer it depends on the event-opening application (from the backend):
//   never applied, or the last one was rejected -> the application form (/apply)
//   waiting for the review, or approved but the event not visible yet -> the waiting page
// (An organizer WITH an event never gets here: RequireEvent lets them into the dashboard. An
// administrator approving an application opens the event for the applicant right away.)
function NoEvent() {
  const { user } = useAuth()
  const [kind, setKind] = useState(() => (isRememberedOperator(user.id) ? 'operator' : 'checking'))

  useEffect(() => {
    if (kind !== 'checking') return
    let alive = true
    Promise.all([listMyApplications(), listMyBooths(), listMyEventApplications()])
      .then(([boothApplications, booths, eventApplications]) => {
        if (!alive) return
        const latest = eventApplications.content[0]
        if (!latest && (boothApplications.totalElements > 0 || booths.totalElements > 0)) return setKind('operator')
        setKind(latest && latest.status !== APPLICATION_STATUS.REJECTED ? 'waiting' : 'apply')
      })
      .catch(() => alive && setKind('apply'))
    return () => {
      alive = false
    }
  }, [kind])

  if (kind === 'checking') return null
  if (kind === 'operator') return <OperatorPreparingPage />
  return kind === 'waiting' ? <EventPendingPage /> : <Navigate to="/apply" replace />
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
