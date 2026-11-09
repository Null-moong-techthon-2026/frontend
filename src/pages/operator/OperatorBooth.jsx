import { useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { changeOperationStatus, getMyBoothDetail } from '../../api/operatorApi'
import { getPublicEvent } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { ContactHqButton, LoadingBlock } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY_LABEL, BOOTH_OPERATING_STATUS as OP, BOOTH_OPERATING_STATUS_LABEL, STOCK_LEVEL } from '../../constants/booth'
import { apiErrorMessage } from '../../constants/errors'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// What the operator can switch by hand (품절 follows from the menu stock).
const STATUS_CHOICES = [OP.OPEN, OP.PREPARING, OP.CLOSED]

// 06 내 부스 · 운영 관리 · 부스 운영자
export default function OperatorBooth() {
  const navigate = useNavigate()
  const { booth } = useOutletContext()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const { data: detail, error, reload, setData } = useAsync(() => (booth ? getMyBoothDetail(booth) : null), [booth?.id])
  const { data: event } = useAsync(() => (booth ? getPublicEvent(booth.eventId).catch(() => null) : null), [booth?.eventId])

  if (!booth) return <Navigate to="/operator/home" replace />
  if (!detail) return <LoadingBlock error={error} onRetry={reload} />

  const soldOutCount = detail.items.filter((i) => i.stockStatus === STOCK_LEVEL.SOLD_OUT).length

  const change = async (status) => {
    if (busy || status === detail.operationStatus) return
    setBusy(true)
    setMessage('')
    try {
      setData(await changeOperationStatus({ id: detail.id, eventId: detail.eventId, revision: detail.revision }, status))
    } catch (err) {
      setMessage(apiErrorMessage(err))
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="mb-title">내 부스</h1>
      <p className="mb-sub">운영 상태와 메뉴 재고를 관리하세요.</p>

      <div className="mb-card">
        <div className="mb-card-row">
          <h2 className="op-booth-name">{detail.name}</h2>
          {detail.code && <span className="mb-chip is-outline">{detail.code}번</span>}
        </div>
        <p className="mb-muted op-caption">
          {[booth.eventName, BOOTH_CATEGORY_LABEL[detail.categoryCode]].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="mb-card-row op-status-head">
        <h2 className="mb-h3">부스 운영 상태</h2>
        <span className="mb-link">현재 · {BOOTH_OPERATING_STATUS_LABEL[detail.operationStatus]}</span>
      </div>
      <div className="op-status">
        {STATUS_CHOICES.map((status) => (
          <button
            key={status}
            type="button"
            className={`mb-btn ${detail.operationStatus === status ? 'is-primary' : 'is-outline'}`}
            disabled={busy}
            onClick={() => change(status)}
          >
            {detail.operationStatus === status && <MIcon name="check" size={18} />}
            {BOOTH_OPERATING_STATUS_LABEL[status]}
          </button>
        ))}
      </div>
      {message && <p className="mb-error">{message}</p>}

      <button type="button" className="mb-nav-card op-gap" onClick={() => navigate('/operator/booth/menu')}>
        <span>
          <strong>메뉴·재고 관리</strong>
          <small>
            품절 메뉴 {soldOutCount}/{detail.items.length} · 메뉴별 상태를 변경할 수 있어요.
          </small>
        </span>
        <MIcon name="chevron" size={18} />
      </button>

      <div className="mb-card">
        <h3>내 부스 정보</h3>
        <div className="mb-card-row">
          <span>부스 번호 {detail.code || '-'}</span>
          <button type="button" className="mb-link" onClick={() => navigate(`/operator/map?event=${booth.eventId}&booth=${booth.id}`)}>
            지도에서 보기 ›
          </button>
        </div>
        <button type="button" className="op-edit-link" onClick={() => navigate('/operator/booth/edit')}>
          <span>
            <strong>소개·운영시간·메뉴·사진 수정</strong>
            <small>방문객에게 보이는 부스 정보를 관리해요.</small>
          </span>
          <MIcon name="chevron" size={18} />
        </button>
      </div>

      <ContactHqButton phone={event?.phone} className="mb-btn is-outline" />
    </>
  )
}
