import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listRecruitingEvents } from '../../api/operatorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { EventPicture, LoadingBlock } from '../../components/mobile/MobileUi'
import { dDayLabel, dateRange, won } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// 02 부스 모집 · 행사 참여 전 · 부스 운영자
export default function OperatorRecruits() {
  const navigate = useNavigate()
  const { data: items, error, reload } = useAsync(listRecruitingEvents, [])
  const [q, setQ] = useState('')

  const needle = q.trim().toLowerCase()
  const shown = (items ?? []).filter(
    (r) =>
      !needle ||
      [r.event.name, r.event.venue, r.event.organizationName, r.introduction].some((t) => t?.toLowerCase().includes(needle)),
  )

  return (
    <>
      <h1 className="mb-title">부스 모집</h1>
      <p className="mb-sub">내 부스와 함께할 행사를 찾아보세요.</p>

      <div className="mb-search">
        <MIcon name="search" size={18} />
        <input className="mb-input" placeholder="행사명, 지역, 키워드로 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {!items ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-card-row op-count">
            <strong>모집 중인 행사 {shown.length}</strong>
            <span className="mb-muted">모집 중</span>
          </div>
          {shown.length === 0 && (
            <p className="mb-empty">{items.length === 0 ? '지금 모집 중인 행사가 없어요.' : '조건에 맞는 행사가 없어요.'}</p>
          )}
          {shown.map((r) => (
            <button
              key={r.eventId}
              type="button"
              className="mb-card op-recruit"
              onClick={() => navigate(`/operator/recruits/${r.eventId}`, { state: { recruitment: r } })}
            >
              <div className="op-recruit-pic">
                <EventPicture event={r.event} />
              </div>
              <span className="op-recruit-body">
                <span className="op-recruit-head">
                  <strong>{r.event.name}</strong>
                  <span className="mb-chip">{dDayLabel(r.closesAt)} 마감</span>
                </span>
                <small>{dateRange(r.event.startDate, r.event.endDate)}</small>
                <small>{r.event.venue}</small>
                <small>모집 부스 {r.targetBoothCount != null ? `${r.targetBoothCount}개` : '미정'}</small>
                <small>입점비 {r.feeKrw != null ? won(r.feeKrw) : '미정'}</small>
              </span>
            </button>
          ))}
          {items.length > 0 && <p className="mb-muted op-foot">현재 모집 중인 행사를 모두 확인했어요.</p>}
        </>
      )}
    </>
  )
}
