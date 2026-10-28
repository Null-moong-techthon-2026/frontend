import { useNavigate, useOutletContext } from 'react-router-dom'
import { getHomeAd, listPublicBooths, listPublicNotices, listSponsors } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { BoothThumb, EventPicture, OperationChip } from '../../components/mobile/MobileUi'
import { BOOTH_OPERATING_STATUS as OP } from '../../constants/booth'
import { EVENT_PROGRESS, EVENT_PROGRESS_LABEL } from '../../constants/event'
import { getEventProgress } from '../../utils/event'
import { boothSubtitle, dateRange } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

const PROGRESS_TEXT = {
  [EVENT_PROGRESS.UPCOMING]: `행사 ${EVENT_PROGRESS_LABEL[EVENT_PROGRESS.UPCOMING]}`,
  [EVENT_PROGRESS.ONGOING]: '행사 진행 중',
  [EVENT_PROGRESS.ENDED]: `행사 ${EVENT_PROGRESS_LABEL[EVENT_PROGRESS.ENDED]}`,
}

// 01 홈 · 일반 사용자
export default function VisitorHome() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  const progress = getEventProgress(event.startDate, event.endDate)

  const { data: notices } = useAsync(() => listPublicNotices(event.id, event.organizationName), [event.id])
  const { data: booths } = useAsync(() => listPublicBooths(event.id), [event.id])
  const { data: sponsors } = useAsync(() => listSponsors(event.id), [event.id])
  const { data: ad } = useAsync(() => getHomeAd(event.id), [event.id])

  // The notice to highlight: the newest urgent one, else the newest.
  const sorted = [...(notices ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const topNotice = sorted.find((n) => n.urgent) ?? sorted[0]

  // Booths worth a look: the ones that are open come first.
  const picks = [...(booths ?? [])]
    .sort((a, b) => Number(b.operationStatus === OP.OPEN) - Number(a.operationStatus === OP.OPEN))
    .slice(0, 2)

  return (
    <>
      <EventPicture event={event} />
      <div className="vs-title">
        <h1 className="mb-title">{event.name}</h1>
        <span className={`mb-chip${progress === EVENT_PROGRESS.ONGOING ? '' : ' is-gray'}`}>{PROGRESS_TEXT[progress]}</span>
      </div>
      <ul className="vs-meta">
        <li>
          <MIcon name="calendar" size={16} />
          {dateRange(event.startDate, event.endDate)}
        </li>
        {event.hours && (
          <li>
            <MIcon name="clock" size={16} />
            오늘 운영 {event.hours.start} - {event.hours.end}
          </li>
        )}
        <li>
          <MIcon name="pin" size={16} />
          {event.venue}
        </li>
      </ul>

      {ad && (
        <a className="mb-card vs-ad" href={ad.url} target="_blank" rel="noreferrer">
          <div className="mb-card-row">
            <small>광고</small>
            <small>{ad.sponsor}</small>
          </div>
          <strong>{ad.title}</strong>
          <span className="mb-link">
            {ad.linkLabel} <MIcon name="external" size={12} />
          </span>
        </a>
      )}

      {topNotice && (
        <div className="mb-card vs-notice">
          <div className="mb-card-row">
            <h3>주요 공지</h3>
            <button type="button" className="mb-link" onClick={() => navigate(`${base}/info/notices`)}>
              전체 보기 ›
            </button>
            {topNotice.urgent && <span className="mb-chip">긴급</span>}
          </div>
          <button type="button" className="vs-notice-title" onClick={() => navigate(`${base}/info/notices/${topNotice.id}`)}>
            {topNotice.title}
          </button>
        </div>
      )}

      <div className="mb-btn-row">
        <button type="button" className="mb-btn is-primary" onClick={() => navigate(`${base}/map`)}>
          지도 보기
        </button>
        <button type="button" className="mb-btn is-outline" onClick={() => navigate(`${base}/booths`)}>
          부스 찾기
        </button>
      </div>

      {picks.length > 0 && (
        <>
          <div className="mb-card-row vs-section">
            <h2 className="mb-h3">이런 부스는 어때요?</h2>
            <button type="button" className="mb-link" onClick={() => navigate(`${base}/booths`)}>
              전체 보기 ›
            </button>
          </div>
          <div className="vs-picks">
            {picks.map((b) => (
              <button key={b.id} type="button" className="mb-card vs-pick" onClick={() => navigate(`${base}/booths/${b.id}`)}>
                <BoothThumb booth={b} className="is-lg" />
                <strong>{b.name}</strong>
                <small>{boothSubtitle(b)}</small>
                <OperationChip status={b.operationStatus} />
              </button>
            ))}
          </div>
        </>
      )}

      {sponsors?.length > 0 && (
        <>
          <div className="mb-card-row vs-section">
            <h2 className="mb-h3">함께하는 파트너</h2>
            <button type="button" className="mb-link" onClick={() => navigate(`${base}/info/sponsors`)}>
              전체 보기 ›
            </button>
          </div>
          <div className="vs-partners">
            {sponsors.slice(0, 3).map((s) => (
              <div key={s.id} className="mb-card vs-partner">
                <span className="vs-avatar">{s.name.slice(-1)}</span>
                <small>{s.name}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
