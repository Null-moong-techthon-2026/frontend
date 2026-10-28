import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listMyApplicationViews, resolveInvitation } from '../../api/operatorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY_LABEL, BOOTH_STATUS, BOOTH_STATUS_LABEL } from '../../constants/booth'
import { shortDate } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

const STATUS_TONE = {
  [BOOTH_STATUS.PENDING]: '',
  [BOOTH_STATUS.APPROVED]: ' is-green',
  [BOOTH_STATUS.REJECTED]: ' is-red',
}

// 상태&초대 탭 · 부스 운영자: type an invitation code, and follow my applications.
export default function OperatorInvite() {
  const navigate = useNavigate()
  const { state } = useLocation() // { applied: eventName } right after applying
  const { data: applications, error, reload } = useAsync(listMyApplicationViews, [])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!code.trim() || busy) return
    setBusy(true)
    setMessage('')
    try {
      const recruitment = await resolveInvitation(code)
      navigate(`/operator/recruits/${recruitment.eventId}`, { state: { recruitment, code: code.trim() } })
    } catch (err) {
      setMessage(
        err.status === 404
          ? '초대 코드를 확인해 주세요. 코드가 틀렸거나 기간이 지났을 수 있어요.'
          : '지금은 확인할 수 없어요. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="mb-title">상태&초대</h1>
      <p className="mb-sub">초대 코드를 입력하고 신청 진행 상황을 확인하세요.</p>
      {state?.applied && <p className="op-banner">{state.applied}에 신청했어요. 주최측이 검토한 뒤 결과를 알려 드려요.</p>}

      <form className="mb-card" onSubmit={submit}>
        <h3>초대 코드</h3>
        <input
          className="mb-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="주최측에게 받은 코드를 입력해 주세요"
          autoComplete="off"
        />
        {message && <p className="mb-error">{message}</p>}
        <p className="mb-muted op-caption">초대 링크로 들어오셨다면 코드를 입력하지 않아도 돼요.</p>
        <button type="submit" className="mb-btn is-primary" disabled={!code.trim() || busy}>
          {busy ? '확인 중…' : '초대 코드 확인'}
        </button>
      </form>

      <h2 className="mb-h3">내 신청 현황</h2>
      {!applications ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : applications.length === 0 ? (
        <p className="mb-empty">아직 신청한 행사가 없어요.</p>
      ) : (
        applications.map((a) => (
          <div key={a.id} className="mb-card op-app">
            <div className="mb-card-row">
              <strong>{a.eventName}</strong>
              <span className={`mb-chip${STATUS_TONE[a.status] ?? ''}`}>{BOOTH_STATUS_LABEL[a.status]}</span>
            </div>
            <p className="mb-muted op-caption">
              {a.boothName} · {BOOTH_CATEGORY_LABEL[a.categoryCode] ?? ''} · {shortDate(a.submittedAt)} 신청
            </p>
            {a.status === BOOTH_STATUS.REJECTED && a.rejectionReason && (
              <p className="op-reason">
                <MIcon name="info" size={14} /> 반려 사유: {a.rejectionReason}
              </p>
            )}
          </div>
        ))
      )}
    </>
  )
}
