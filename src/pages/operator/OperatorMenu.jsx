import { useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { changeItemStock, getMyBoothDetail } from '../../api/operatorApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { STOCK_LEVEL, STOCK_LEVEL_LABEL } from '../../constants/booth'
import { apiErrorMessage } from '../../constants/errors'
import { won } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// Order of the buttons; the backend has no "중간" level between 충분 and 부족.
const LEVELS = [STOCK_LEVEL.AVAILABLE, STOCK_LEVEL.LOW, STOCK_LEVEL.SOLD_OUT, STOCK_LEVEL.UNLIMITED]

// 06-1 메뉴·재고 관리 · 부스 운영자
export default function OperatorMenu() {
  const navigate = useNavigate()
  const { booth } = useOutletContext()
  const [openId, setOpenId] = useState(null) // the item whose level buttons are shown
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const { data: detail, error, reload, setData } = useAsync(() => (booth ? getMyBoothDetail(booth) : null), [booth?.id])

  if (!booth) return <Navigate to="/operator/home" replace />

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate('/operator/booth')}>
      <MIcon name="back" size={18} />내 부스
    </button>
  )
  if (!detail) {
    return (
      <>
        {back}
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }

  const soldOut = detail.items.filter((i) => i.stockStatus === STOCK_LEVEL.SOLD_OUT).length

  const setLevel = async (item, level) => {
    if (busy || level === item.stockStatus) return
    setBusy(true)
    setMessage('')
    try {
      setData(await changeItemStock({ id: detail.id, eventId: detail.eventId, revision: detail.revision }, item, level))
      setOpenId(null)
    } catch (err) {
      setMessage(apiErrorMessage(err))
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {back}
      <h1 className="mb-title is-sm">메뉴·재고 관리</h1>
      <p className="mb-sub">현재 재고 상태를 눌러 변경하세요.</p>

      <div className="mb-card mb-card-row">
        <strong>전체 메뉴 {detail.items.length}</strong>
        <span className="mb-link">
          품절 메뉴 {soldOut}/{detail.items.length}
        </span>
      </div>

      {detail.items.length === 0 && <p className="mb-empty">등록된 메뉴가 없어요. 아래에서 메뉴를 추가해 주세요.</p>}
      {detail.items.map((item) => {
        const open = openId === item.id
        return (
          <div key={item.id} className="mb-card op-item">
            <div className="mb-card-row">
              <span className="op-item-name">
                <strong>{item.name}</strong>
                <small>{won(item.priceKrw)}</small>
              </span>
              <button type="button" className="op-level" onClick={() => setOpenId(open ? null : item.id)} aria-expanded={open}>
                {STOCK_LEVEL_LABEL[item.stockStatus]}
                <MIcon name="chevronDown" size={14} />
              </button>
            </div>
            {open && (
              <div className="op-levels">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={item.stockStatus === level ? 'is-active' : ''}
                    disabled={busy}
                    onClick={() => setLevel(item, level)}
                  >
                    {STOCK_LEVEL_LABEL[level]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {message && <p className="mb-error">{message}</p>}

      <div className="mb-card">
        <h3>재고 상태 안내</h3>
        <p className="mb-muted">충분 / 부족 / 품절 / 무제한</p>
        <p className="mb-muted">변경한 상태는 방문객 화면에도 반영됩니다.</p>
      </div>

      <MobileFooter>
        <button type="button" className="mb-btn is-outline" onClick={() => navigate('/operator/booth/edit')}>
          메뉴·가격 수정
        </button>
      </MobileFooter>
    </>
  )
}
