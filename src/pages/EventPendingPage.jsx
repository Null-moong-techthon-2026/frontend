import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import ScreenShell from '../components/ScreenShell'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import { useEvent } from '../context/useEvent'
import { useMyOpenings } from '../utils/useMyOpenings'

const formatDate = (iso) => (iso ? iso.slice(0, 10).replaceAll('-', '.') : '')

// The waiting page of an organizer who applied to open an event (행사 개설 신청) and has no event yet:
// the application is being reviewed, was rejected (the reason is shown and a new one can be sent), or
// was approved and the event is about to show up.
export default function EventPendingPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { status, reload: reloadEvent } = useEvent()
  const { openings, error, reload } = useMyOpenings(user.id)
  const latest = openings?.[0]

  // The event exists (approved): go to its dashboard.
  useEffect(() => {
    if (status === 'ready') navigate('/organizer/dashboard', { replace: true })
  }, [status, navigate])

  const check = () => {
    reload()
    reloadEvent()
  }

  let heading = ''
  let lead = ''
  if (latest?.status === 'PENDING') {
    heading = '승인을 기다리고 있어요.'
    lead = `'${latest.eventName}' 신청서를 부스럭 운영팀이 확인하고 있어요. 결과가 나오면 이 화면이 바뀌어요.`
  } else if (latest?.status === 'REJECTED') {
    heading = '신청이 반려됐어요.'
    lead = `'${latest.eventName}' 신청이 반려됐어요. 내용을 고쳐 다시 신청할 수 있어요.`
  } else if (latest?.status === 'APPROVED') {
    heading = '신청이 승인됐어요.'
    lead = `'${latest.eventName}' 행사가 열렸어요. 아래 버튼으로 확인해 보세요.`
  }

  return (
    <ScreenShell>
      <AuthHeader showBack={false} />
      <div className="auth-body placeholder-body">
        {error ? (
          <p>{apiErrorMessage(error)}</p>
        ) : !openings ? (
          <p>불러오는 중…</p>
        ) : !latest ? (
          <p>
            <strong>행사 개설 신청이 아직 없어요.</strong>
          </p>
        ) : (
          <>
            <p>
              <strong>{heading}</strong>
              <br />
              {lead}
            </p>
            <p>
              {formatDate(latest.createdAt)} 접수
              {latest.reviewedAt ? ` · ${formatDate(latest.reviewedAt)} 처리` : ''}
            </p>
            {latest.status === 'REJECTED' && latest.rejectionReason && (
              <p>
                반려 사유: <strong>{latest.rejectionReason}</strong>
              </p>
            )}
          </>
        )}
        {latest?.status === 'REJECTED' || (openings && !latest) ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/apply')}>
            {latest ? '다시 신청하기' : '행사 개설 신청하기'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={check}>
            {latest?.status === 'APPROVED' ? '행사 열기' : '승인 상태 다시 확인하기'}
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={logout}>
          로그아웃
        </button>
      </div>
    </ScreenShell>
  )
}
