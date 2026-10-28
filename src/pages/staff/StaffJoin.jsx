import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { resolveStaffInvite } from '../../api/staffApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MobileLayout from '../../components/mobile/MobileLayout'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { STAFF_ROLE, STAFF_ROLE_LABEL, joinStaff } from '../../dummy/staffStore'
import { dDayLabel } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import { EventRow } from './StaffHome'
import './staff-app.css'

const ROLE_CHOICES = [
  [STAFF_ROLE.STAFF, '행사 운영을 지원하는 스태프로 참여'],
  [STAFF_ROLE.LABOR, '근로 인력으로 참여'],
  [STAFF_ROLE.VOLUNTEER, '봉사 인력으로 참여'],
]

// 02 행사 참여 확인 · 역할 선택 · 스태프 (reached with a code typed on the home screen)
export default function StaffJoin() {
  const { state } = useLocation() // { event, code }
  const { user, me } = useOutletContext()
  if (!state?.event) return <Navigate to="/staff/home" replace />
  if (me) return <Navigate to="/staff/home" replace />
  return <JoinForm event={state.event} user={user} />
}

function JoinForm({ event, user }) {
  const navigate = useNavigate()
  const [role, setRole] = useState(STAFF_ROLE.STAFF)
  return (
    <>
      <h1 className="mb-title is-sm">이 행사에 참여하시겠어요?</h1>
      <p className="mb-sub">행사 정보를 확인하고 참여 역할을 선택해 주세요.</p>
      <div className="mb-card sa-event">
        <div className="mb-card-row">
          <EventRow event={event} />
          <span className="mb-chip">{dDayLabel(event.startDate)}</span>
        </div>
      </div>

      <h2 className="mb-h3">참여 역할</h2>
      {ROLE_CHOICES.map(([key, text]) => (
        <label key={key} className={`mb-card sa-role-card${role === key ? ' is-on' : ''}`}>
          <input type="radio" name="role" checked={role === key} onChange={() => setRole(key)} />
          <span>
            <strong>{STAFF_ROLE_LABEL[key]}</strong>
            <small>{text}</small>
          </span>
        </label>
      ))}
      <p className="mb-muted sa-caption">참여 신청 후 주최자가 역할을 변경할 수 있습니다.</p>

      <MobileFooter>
        <button
          type="button"
          className="mb-btn is-primary"
          onClick={() => {
            joinStaff(user, role)
            navigate('/staff/home', { replace: true })
          }}
        >
          참여 신청하기
        </button>
      </MobileFooter>
    </>
  )
}

// /invite/staff/:token - the link an organizer sends to staff. Needs a login; then it opens the
// confirmation screen for the event behind the token.
export function StaffInviteLanding() {
  const navigate = useNavigate()
  const { token } = useParams()
  const { data: event, error } = useAsync(() => resolveStaffInvite(token), [token])

  if (event) return <Navigate to="/staff/join" replace state={{ event, code: token }} />
  return (
    <MobileLayout chip="스태프">
      {error ? (
        <div className="mb-empty">
          <p>초대 링크를 확인해 주세요. 링크가 틀렸거나 기간이 지났을 수 있어요.</p>
          <button type="button" className="mb-btn is-primary" onClick={() => navigate('/staff/home')}>
            초대 코드 직접 입력하기
          </button>
        </div>
      ) : (
        <LoadingBlock>초대를 확인하고 있어요…</LoadingBlock>
      )}
    </MobileLayout>
  )
}
