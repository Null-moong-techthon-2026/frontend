import { useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { getStaffNotice, listStaffNotices } from '../../api/staffApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { ContactHqButton, LoadingBlock } from '../../components/mobile/MobileUi'
import { eventOf } from '../../dummy/staffStore'
import { longDateTime, shortDateTime } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './staff-app.css'

const FILTERS = [
  ['all', '전체'],
  ['urgent', '긴급'],
  ['normal', '일반'],
]

// What the tabs show before the join request is approved.
export function NeedApproval({ state, title }) {
  const navigate = useNavigate()
  return (
    <>
      <h1 className="mb-title">{title}</h1>
      <div className="mb-empty">
        <p>
          {state === 'pending'
            ? '주최자의 승인을 기다리고 있어요. 승인되면 이 화면을 이용할 수 있어요.'
            : '행사에 참여하면 이 화면을 이용할 수 있어요.'}
        </p>
        <button type="button" className="mb-btn is-outline is-sm" onClick={() => navigate('/staff/home')}>
          {state === 'pending' ? '승인 상태 보기' : '초대 코드 입력하기'}
        </button>
      </div>
    </>
  )
}

// 06 공지 · 스태프
export function StaffNotices() {
  const navigate = useNavigate()
  const { state, data } = useOutletContext()
  const [filter, setFilter] = useState('all')
  const { data: notices, error, reload } = useAsync(listStaffNotices, [])
  if (state !== 'approved') return <NeedApproval state={state} title="공지" />

  const shown = [...(notices ?? [])]
    .filter((n) => filter === 'all' || (filter === 'urgent') === n.urgent)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.publishedAt.localeCompare(a.publishedAt))

  return (
    <>
      <h1 className="mb-title">공지</h1>
      <p className="mb-sub">{eventOf(data).name}의 운영 소식을 확인하세요.</p>
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
          <button key={n.id} type="button" className="mb-card vs-notice-row" onClick={() => navigate(`/staff/notices/${n.id}`)}>
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

// 06-1 공지 상세 · 스태프
export function StaffNoticeDetail() {
  const navigate = useNavigate()
  const { noticeId } = useParams()
  const { state, data } = useOutletContext()
  const { data: notice, error, reload } = useAsync(() => getStaffNotice(noticeId), [noticeId])

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate('/staff/notices')}>
      <MIcon name="back" size={18} />
      공지
    </button>
  )
  if (state !== 'approved') return <NeedApproval state={state} title="공지" />
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
      <p className="mb-muted">{[notice.author, longDateTime(notice.publishedAt)].filter(Boolean).join(' · ')}</p>
      <div className="mb-card vs-notice-body">
        {notice.body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {notice.attachment && (
        <div className="mb-card vs-attach">
          <MIcon name="file" size={18} />
          <span>{notice.attachment}</span>
          <MIcon name="chevron" size={16} />
        </div>
      )}
      <MobileFooter>
        <ContactHqButton phone={eventOf(data).phone} />
      </MobileFooter>
    </>
  )
}
