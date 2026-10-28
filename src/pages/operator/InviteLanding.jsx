import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveInvitation } from '../../api/operatorApi'
import MobileLayout from '../../components/mobile/MobileLayout'
import './operator.css'

// /invite/:code - the link an organizer sends to booth operators. Needs a login (RequireAuth sends
// others to /login and back here); then it opens the recruitment notice behind the code.
export default function InviteLanding() {
  const navigate = useNavigate()
  const { code } = useParams()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    resolveInvitation(code)
      .then((recruitment) => alive && navigate(`/operator/recruits/${recruitment.eventId}`, { replace: true, state: { recruitment, code } }))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [code, navigate])

  return (
    <MobileLayout chip="부스 운영자">
      {failed ? (
        <div className="mb-empty">
          <p>초대 링크를 확인해 주세요. 링크가 틀렸거나 기간이 지났을 수 있어요.</p>
          <button type="button" className="mb-btn is-primary" onClick={() => navigate('/operator/invite')}>
            초대 코드 직접 입력하기
          </button>
        </div>
      ) : (
        <div className="mb-loading">초대를 확인하고 있어요…</div>
      )}
    </MobileLayout>
  )
}
