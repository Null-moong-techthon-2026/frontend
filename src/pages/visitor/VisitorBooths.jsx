import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { listPublicBooths } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { BoothThumb, LoadingBlock, OperationChip } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY, BOOTH_CATEGORY_LABEL, BOOTH_OPERATING_STATUS as OP } from '../../constants/booth'
import { boothSubtitle } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

// 02 부스 목록 · 일반 사용자
export default function VisitorBooths() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  const { data: booths, error, reload } = useAsync(() => listPublicBooths(event.id), [event.id])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [openOnly, setOpenOnly] = useState(false)

  const needle = q.trim().toLowerCase()
  const shown = (booths ?? []).filter(
    (b) =>
      (!category || b.categoryCode === category) &&
      (!openOnly || b.operationStatus === OP.OPEN) &&
      (!needle || b.name.toLowerCase().includes(needle) || b.items.some((i) => i.name.toLowerCase().includes(needle))),
  )

  return (
    <>
      <h1 className="mb-title">부스</h1>
      <p className="mb-sub">먹거리부터 체험까지, 원하는 부스를 찾아보세요.</p>

      <div className="mb-search">
        <MIcon name="search" size={18} />
        <input className="mb-input" placeholder="부스명, 메뉴로 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="vs-filters">
        <select className="mb-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="카테고리">
          <option value="">전체 카테고리</option>
          {Object.values(BOOTH_CATEGORY).map((c) => (
            <option key={c} value={c}>
              {BOOTH_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <label className="vs-check">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
          운영 중만 보기
        </label>
      </div>

      {!booths ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : (
        <>
          <p className="vs-count">전체 부스 {shown.length}개</p>
          {shown.length === 0 && (
            <p className="mb-empty">{booths.length === 0 ? '아직 공개된 부스가 없어요.' : '조건에 맞는 부스가 없어요.'}</p>
          )}
          {shown.map((b) => (
            <button key={b.id} type="button" className="mb-card vs-booth" onClick={() => navigate(`${base}/booths/${b.id}`)}>
              <BoothThumb booth={b} />
              <span className="vs-booth-body">
                <span className="vs-booth-head">
                  <strong>{b.name}</strong>
                  <OperationChip status={b.operationStatus} />
                </span>
                <small>{boothSubtitle(b)}</small>
                <span className="mb-link">부스 자세히 보기 ›</span>
              </span>
            </button>
          ))}
        </>
      )}
    </>
  )
}
