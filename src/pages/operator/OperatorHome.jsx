import { useNavigate, useOutletContext } from 'react-router-dom'
import { getMyBoothDetail, listOperatorNotices } from '../../api/operatorApi'
import { getPublicEvent } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { ContactHqButton, EventPicture, LoadingBlock, MiniMap, OperationChip } from '../../components/mobile/MobileUi'
import { dateRange, shortDateTime } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// 01 홈 · 행사 참여 전 / 05 홈 · 행사 참여 후 · 부스 운영자
export default function OperatorHome() {
  const { joined } = useOutletContext()
  return joined ? <JoinedHome /> : <NewcomerHome />
}

function NewcomerHome() {
  const navigate = useNavigate()
  return (
    <>
      <h1 className="mb-title">홈</h1>
      <p className="mb-sub">안녕하세요, 부스 운영자님</p>

      <div className="mb-card op-empty-card">
        <span className="op-empty-ico">
          <MIcon name="doc" size={26} />
        </span>
        <h2>참여 중인 행사가 없습니다!</h2>
        <p className="mb-muted">
          모집 중인 행사를 찾아
          <br />내 부스와 함께해 보세요.
        </p>
        <button type="button" className="mb-btn is-primary" onClick={() => navigate('/operator/recruits')}>
          행사 찾기
        </button>
      </div>

      <button type="button" className="mb-nav-card" onClick={() => navigate('/operator/invite')}>
        <span className="mb-ico">
          <MIcon name="link" size={20} />
        </span>
        <span>
          <strong>초대받은 행사가 있나요?</strong>
          <small>상태&초대에서 코드를 입력하세요.</small>
        </span>
        <MIcon name="chevron" size={18} />
      </button>
      <button type="button" className="mb-nav-card" onClick={() => navigate('/operator/profile/booth')}>
        <span className="mb-ico">
          <MIcon name="user" size={20} />
        </span>
        <span>
          <strong>내 부스 프로필</strong>
          <small>행사에 보여줄 소개와 사진을 관리해요.</small>
        </span>
        <MIcon name="chevron" size={18} />
      </button>
    </>
  )
}

function JoinedHome() {
  const navigate = useNavigate()
  const { booth } = useOutletContext()
  const { data: detail } = useAsync(() => getMyBoothDetail(booth), [booth.id])
  const { data: event } = useAsync(() => getPublicEvent(booth.eventId).catch(() => null), [booth.eventId])
  const { data: notices, error, reload } = useAsync(() => listOperatorNotices(booth.eventId), [booth.eventId])

  const recent = [...(notices ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2)
  const view = event ?? { name: booth.eventName, venue: booth.venue, startDate: booth.startDate, endDate: booth.endDate, imageUrl: null }

  return (
    <>
      <h1 className="mb-title">홈</h1>
      <p className="mb-sub">{view.name}과 함께하는 내 부스</p>

      <div className="mb-card op-event">
        <div className="op-event-top">
          <div className="op-event-pic">
            <EventPicture event={view} />
          </div>
          <span className="op-event-info">
            <strong>{view.name}</strong>
            <small>{dateRange(view.startDate, view.endDate)}</small>
            <small>{view.venue}</small>
          </span>
        </div>
        <div className="mb-card-row">
          <strong className="op-booth-line">
            {booth.name}
            {booth.code && ` · ${booth.code}번`}
          </strong>
          <OperationChip status={detail?.operationStatus ?? booth.operationStatus} />
        </div>
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>내 부스 위치</h3>
          <button type="button" className="mb-link" onClick={() => navigate(`/e/${booth.eventId}/map?booth=${booth.id}`)}>
            지도에서 보기 ›
          </button>
        </div>
        {detail?.placement ? (
          <>
            <MiniMap placement={detail.placement} label={booth.code} />
            <p className="mb-muted op-caption">
              {[booth.code && `${booth.code}번`, detail.placement.label].filter(Boolean).join(' · ')}
            </p>
          </>
        ) : (
          <p className="mb-muted">아직 지도에 배치되지 않았어요. 주최측이 배치하면 여기에 표시돼요.</p>
        )}
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>최근 공지</h3>
          <button type="button" className="mb-link" onClick={() => navigate('/operator/notices')}>
            전체 보기 ›
          </button>
        </div>
        {!notices ? (
          <LoadingBlock error={error} onRetry={reload} />
        ) : recent.length === 0 ? (
          <p className="mb-muted">아직 공지가 없어요.</p>
        ) : (
          <ul className="op-recent">
            {recent.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => navigate(`/operator/notices/${n.id}`)}>
                  <strong>{n.title}</strong>
                  <small>{shortDateTime(n.publishedAt)}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-btn-row">
        <button type="button" className="mb-btn is-primary" onClick={() => navigate('/operator/booth')}>
          내 부스 관리
        </button>
        <ContactHqButton phone={view.phone} />
      </div>
    </>
  )
}
