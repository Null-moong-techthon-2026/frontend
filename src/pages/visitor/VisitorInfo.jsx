import { useNavigate, useOutletContext } from 'react-router-dom'
import MIcon from '../../components/mobile/MobileIcons'
import { EventPicture } from '../../components/mobile/MobileUi'
import { dateRange } from '../../utils/mobileFormat'
import './visitor.css'

// 04 행사 정보 · 일반 사용자
export default function VisitorInfo() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  const route = `https://map.naver.com/p/search/${encodeURIComponent(event.venue)}`

  return (
    <>
      <EventPicture event={event} />
      <h1 className="mb-title">{event.name}</h1>
      <p className="mb-sub">행사 소개부터 오시는 길까지 확인하세요.</p>

      <div className="mb-card">
        <ul className="vs-rows">
          <li>
            <MIcon name="calendar" size={16} />
            기간 {dateRange(event.startDate, event.endDate)}
          </li>
          {event.hours && (
            <li>
              <MIcon name="clock" size={16} />
              운영 시간 {event.hours.start} - {event.hours.end}
            </li>
          )}
          <li>
            <MIcon name="pin" size={16} />
            장소 {event.venue}
          </li>
        </ul>
      </div>

      {event.intro && (
        <div className="mb-card">
          <h3>행사 소개</h3>
          <p className="vs-body">{event.intro}</p>
        </div>
      )}

      <div className="mb-card">
        <h3>오시는 길</h3>
        {event.directions && <p className="vs-body">{event.directions}</p>}
        <div className="vs-stack">
          <button type="button" className="mb-btn is-outline" onClick={() => navigate(`${base}/map`)}>
            행사장 지도 보기
          </button>
          <a className="mb-btn is-outline" href={route} target="_blank" rel="noreferrer">
            길찾기 <MIcon name="external" size={15} />
          </a>
        </div>
      </div>

      {event.phone && (
        <div className="mb-card">
          <h3>문의처</h3>
          <a className="vs-phone" href={`tel:${event.phone.replaceAll('-', '')}`}>
            <MIcon name="phone" size={16} />
            운영본부 {event.phone}
          </a>
        </div>
      )}

      <button type="button" className="mb-nav-card" onClick={() => navigate(`${base}/info/notices`)}>
        <span className="mb-ico">
          <MIcon name="bell" size={20} />
        </span>
        <span>
          <strong>공지사항</strong>
          <small>공개된 행사 소식을 확인하세요.</small>
        </span>
        <MIcon name="chevron" size={18} />
      </button>
      <button type="button" className="mb-nav-card" onClick={() => navigate(`${base}/info/sponsors`)}>
        <span className="mb-ico">
          <MIcon name="coin" size={20} />
        </span>
        <span>
          <strong>함께하는 파트너</strong>
          <small>행사를 함께 만들어가는 후원사예요.</small>
        </span>
        <MIcon name="chevron" size={18} />
      </button>
    </>
  )
}
