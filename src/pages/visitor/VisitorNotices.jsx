import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { listPublicNotices } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { shortDateTime } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

const FILTERS = [
  ['all', '전체'],
  ['urgent', '긴급'],
  ['normal', '일반'],
]

// 04-1 전체 공지 · 일반 사용자
export default function VisitorNotices() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  const { data: notices, error, reload } = useAsync(() => listPublicNotices(event.id, event.organizationName), [event.id])
  const [filter, setFilter] = useState('all')

  const shown = [...(notices ?? [])]
    .filter((n) => filter === 'all' || (filter === 'urgent') === n.urgent)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.publishedAt.localeCompare(a.publishedAt))

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate(`${base}/info`)}>
        <MIcon name="back" size={18} />
        행사 정보
      </button>
      <h1 className="mb-title">공지사항</h1>
      <p className="mb-sub">방문객에게 공개된 행사 소식을 확인하세요.</p>

      <div className="mb-seg">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {!notices ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : shown.length === 0 ? (
        <p className="mb-empty">공개된 공지가 없어요.</p>
      ) : (
        shown.map((n) => (
          <button key={n.id} type="button" className="mb-card vs-notice-row" onClick={() => navigate(`${base}/info/notices/${n.id}`)}>
            <span className="vs-notice-top">
              <span className={`mb-chip${n.urgent ? '' : ' is-gray'}`}>{n.urgent ? '긴급' : '일반'}</span>
              <small>{shortDateTime(n.publishedAt)}</small>
            </span>
            <span className="vs-notice-line">
              <strong>{n.title}</strong>
              <MIcon name="chevron" size={18} />
            </span>
          </button>
        ))
      )}
    </>
  )
}
