import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getRecruitment } from '../../api/operatorApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { EventPicture, LoadingBlock } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY_LABEL } from '../../constants/booth'
import { dateRange, longDateTime, shortDate, won } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// 03 모집 공고 상세 · 부스 운영자
export default function OperatorRecruitDetail() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const { state } = useLocation() // { recruitment, code } when it comes from the list / an invitation
  const { data: loaded, error, reload } = useAsync(
    () => (state?.recruitment?.eventId === eventId ? Promise.resolve(state.recruitment) : getRecruitment(eventId)),
    [eventId],
  )

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate('/operator/recruits')}>
      <MIcon name="back" size={18} />
      부스 모집
    </button>
  )
  if (!loaded) {
    return (
      <>
        {back}
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }
  const r = loaded
  const closed = r.status === 'CLOSED'

  return (
    <>
      {back}
      <EventPicture event={r.event} />
      <div className="vs-title">
        <h1 className="mb-title is-sm">{r.event.name}</h1>
        <span className={`mb-chip${closed ? ' is-gray' : ''}`}>{closed ? '모집 마감' : `${shortDate(r.closesAt)} 마감`}</span>
      </div>
      <ul className="vs-meta">
        <li>
          <MIcon name="calendar" size={16} />
          {dateRange(r.event.startDate, r.event.endDate)}
        </li>
        <li>
          <MIcon name="pin" size={16} />
          {r.event.venue}
        </li>
      </ul>

      <div className="op-stats">
        <div className="mb-card">
          <small>모집 부스 수</small>
          <strong>{r.targetBoothCount != null ? `${r.targetBoothCount}개` : '미정'}</strong>
        </div>
        <div className="mb-card">
          <small>입점비</small>
          <strong>{r.feeKrw != null ? won(r.feeKrw) : '미정'}</strong>
        </div>
      </div>

      <h2 className="mb-h3">행사 소개</h2>
      <p className="vs-body">{r.introduction || r.event.intro || '소개가 아직 없어요.'}</p>

      <h2 className="mb-h3">모집 기간</h2>
      <p className="vs-body">~ {longDateTime(r.closesAt)}</p>

      <h2 className="mb-h3">신청 조건</h2>
      <ul className="op-bullets">
        {r.categories.length > 0 && <li>{r.categories.map((c) => BOOTH_CATEGORY_LABEL[c] ?? c).join('·')} 부스 신청 가능</li>}
        <li>신청한 운영자가 직접 부스를 운영해야 합니다.</li>
        {r.documents.map((d) => (
          <li key={d.id}>
            {d.name}
            {d.required ? ' 제출이 필요합니다.' : ' (선택 제출)'}
          </li>
        ))}
        {r.feeNote && <li>{r.feeNote}</li>}
      </ul>

      <MobileFooter>
        <button
          type="button"
          className="mb-btn is-primary"
          disabled={closed}
          onClick={() => navigate(`/operator/recruits/${eventId}/apply`, { state: { recruitment: r, code: state?.code } })}
        >
          {closed ? '모집이 마감됐어요' : '신청하기'}
        </button>
      </MobileFooter>
    </>
  )
}
