import { useState } from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { getOperatorNotice, listOperatorNotices } from '../../api/operatorApi'
import { getPublicEvent } from '../../api/visitorApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { ContactHqButton, LoadingBlock } from '../../components/mobile/MobileUi'
import { longDateTime, shortDateTime } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

const FILTERS = [
  ['all', '전체'],
  ['urgent', '긴급'],
  ['normal', '일반'],
]

// 07 공지 · 부스 운영자
export function OperatorNotices() {
  const navigate = useNavigate()
  const { booth } = useOutletContext()
  const [filter, setFilter] = useState('all')
  const { data: notices, error, reload } = useAsync(() => (booth ? listOperatorNotices(booth.eventId) : []), [booth?.eventId])
  if (!booth) return <Navigate to="/operator/home" replace />

  const shown = [...(notices ?? [])]
    .filter((n) => filter === 'all' || (filter === 'urgent') === n.urgent)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.publishedAt.localeCompare(a.publishedAt))

  return (
    <>
      <h1 className="mb-title">공지</h1>
      <p className="mb-sub">{booth.eventName}의 운영 소식을 확인하세요.</p>
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
        <p className="mb-empty">공지가 없어요.</p>
      ) : (
        shown.map((n) => (
          <button key={n.id} type="button" className="mb-card vs-notice-row" onClick={() => navigate(`/operator/notices/${n.id}`)}>
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

// 07-1 공지 상세 · 부스 운영자
export function OperatorNoticeDetail() {
  const navigate = useNavigate()
  const { noticeId } = useParams()
  const { booth } = useOutletContext()
  const { data: notice, error, reload } = useAsync(() => (booth ? getOperatorNotice(booth.eventId, noticeId) : null), [booth?.eventId, noticeId])
  const { data: event } = useAsync(() => (booth ? getPublicEvent(booth.eventId).catch(() => null) : null), [booth?.eventId])
  if (!booth) return <Navigate to="/operator/home" replace />

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate('/operator/notices')}>
      <MIcon name="back" size={18} />
      공지
    </button>
  )
  if (!notice) {
    return (
      <>
        {back}
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }
  return (
    <>
      {back}
      <span className={`mb-chip${notice.urgent ? '' : ' is-gray'}`}>{notice.urgent ? '긴급' : '일반'}</span>
      <h1 className="mb-title is-sm vs-notice-h1">{notice.title}</h1>
      <p className="mb-muted">{[notice.author || event?.organizationName, longDateTime(notice.publishedAt)].filter(Boolean).join(' · ')}</p>
      <div className="mb-card vs-notice-body">
        {notice.body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {notice.imageUrl && <img className="vs-notice-img" src={notice.imageUrl} alt="" />}
      {notice.attachment && (
        <div className="mb-card vs-attach">
          <MIcon name="file" size={18} />
          <span>{notice.attachment}</span>
          <MIcon name="chevron" size={16} />
        </div>
      )}
      <MobileFooter>
        <ContactHqButton phone={event?.phone} />
      </MobileFooter>
    </>
  )
}
