import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { getPublicNotice } from '../../api/visitorApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { longDateTime } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

// 04-2 공지 상세 · 일반 사용자
export default function VisitorNoticeDetail() {
  const navigate = useNavigate()
  const { noticeId } = useParams()
  const { event, base } = useOutletContext()
  const { data: notice, error, reload } = useAsync(
    () => getPublicNotice(event.id, noticeId, event.organizationName),
    [event.id, noticeId],
  )

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate(`${base}/info/notices`)}>
      <MIcon name="back" size={18} />
      공지사항
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
      <p className="mb-muted">{[notice.author, longDateTime(notice.publishedAt)].filter(Boolean).join(' · ')}</p>

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
        <button type="button" className="mb-btn is-outline" onClick={() => navigate(`${base}/map`)}>
          행사 지도 보기
        </button>
      </MobileFooter>
    </>
  )
}
