import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import ScreenShell from '../components/ScreenShell'
import { APPLICATION_STATUS, APPLICATION_STATUS_LABEL } from '../constants/eventApplication'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import { useEvent } from '../context/useEvent'
import { useMyEventApplications } from '../utils/useMyEventApplications'

const formatDate = (iso) => iso.slice(0, 10).replaceAll('-', '.')

// The waiting page: shown to an organizer who has applied to open an event (행사 개설 신청) but
// has no event yet - either the application is still being reviewed, or it was approved and the
// event is about to show up. (Accounts that never applied, or were rejected, are sent to the
// application form instead: see components/RequireEvent.jsx.)
export default function EventPendingPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { reload: reloadEvent } = useEvent()
  const { applications, error } = useMyEventApplications(user.id)
  const latest = applications?.[0]
  const approved = latest?.status === APPLICATION_STATUS.APPROVED

  return (
    <ScreenShell>
      <AuthHeader showBack={false} />
      <div className="auth-body placeholder-body">
        {error ? (
          <p>{apiErrorMessage(error)}</p>
        ) : !latest ? (
          <p>불러오는 중…</p>
        ) : (
          <>
            <p>
              <strong>{approved ? '신청이 승인됐어요. 행사를 준비하고 있어요.' : '승인을 기다리고 있어요.'}</strong>
              <br />
              {approved
                ? `'${latest.eventName}' 행사가 곧 열려요. 아래 버튼으로 확인해 보세요.`
                : `'${latest.eventName}' 신청서를 검토하고 있어요. 결과는 담당자가 안내해 드려요.`}
            </p>
            <p>
              신청 상태: <strong>{APPLICATION_STATUS_LABEL[latest.status]}</strong> · {formatDate(latest.submittedAt)} 접수
            </p>
          </>
        )}
        <button type="button" className="btn btn-primary" onClick={reloadEvent}>
          행사가 열렸는지 다시 확인하기
        </button>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/apply')}>
          신청 내용 보기
        </button>
        <button type="button" className="btn btn-outline" onClick={logout}>
          로그아웃
        </button>
      </div>
    </ScreenShell>
  )
}
