import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import {
  BOOTH_OPERATING_STATUS as O,
  BOOTH_OPERATING_STATUS_LABEL,
  BOOTH_STATUS,
} from '../constants/booth'
import { EVENT_PROGRESS, EVENT_PROGRESS_LABEL } from '../constants/event'
import { NOTICE_STATUS } from '../constants/notice'
import { RECRUIT_STATUS_LABEL } from '../constants/recruit'
import { useBooths } from '../context/useBooths'
import { useNotices } from '../context/useNotices'
import { useRecruit } from '../context/useRecruit'
import { useEvent } from '../context/useEvent'
import EventEditModal from '../components/EventEditModal'
import { formatDateTime } from '../utils/date'
import { getEventProgress } from '../utils/event'
import { audienceText, noticeDateText, sortNotices } from '../utils/notice'
import { getRecruitStatus } from '../utils/recruit'
import './dashboard.css'

const RECENT_NOTICE_COUNT = 3
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const withWeekday = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return `${iso.replaceAll('-', '.')}(${WEEKDAYS[d.getDay()]})`
}

// Placeholder QR (a real QR image comes from the backend / a QR library later).
function QrPlaceholder() {
  return (
    <svg className="db-qr" viewBox="0 0 64 64" aria-label="방문객용 QR 코드 (임시)" role="img">
      <g fill="none" stroke="currentColor" strokeWidth="5">
        <rect x="4" y="4" width="20" height="20" />
        <rect x="40" y="4" width="20" height="20" />
        <rect x="4" y="40" width="20" height="20" />
      </g>
      <g fill="currentColor">
        <rect x="12" y="12" width="4" height="4" />
        <rect x="48" y="12" width="4" height="4" />
        <rect x="12" y="48" width="4" height="4" />
        <rect x="40" y="40" width="8" height="8" />
        <rect x="52" y="40" width="8" height="8" />
        <rect x="40" y="52" width="8" height="8" />
        <rect x="28" y="28" width="8" height="8" />
      </g>
    </svg>
  )
}

function EventArt({ name, imageUrl }) {
  if (imageUrl) {
    return (
      <div className="db-art">
        <img className="db-art-img" src={imageUrl} alt={`${name} 대표 이미지`} />
      </div>
    )
  }
  return (
    <div className="db-art" aria-hidden="true">
      <span className="db-art-sign">{name.replace(/\s*\d{4}$/, '')}</span>
      <svg viewBox="0 0 220 90">
        <g fill="#dfe8e4" stroke="#cdd9d4">
          <rect x="22" y="20" width="52" height="60" />
          <rect x="84" y="20" width="52" height="60" />
          <rect x="146" y="20" width="52" height="60" />
        </g>
        <g fill="#c4d3cd">
          <rect x="40" y="46" width="16" height="34" />
          <rect x="102" y="46" width="16" height="34" />
          <rect x="164" y="46" width="16" height="34" />
        </g>
        <path d="M6 82h208" stroke="#cdd9d4" strokeWidth="2" />
      </svg>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { booths } = useBooths()
  const { notices } = useNotices()
  const { event, updateEvent } = useEvent()
  const { recruit } = useRecruit()
  const recruitStatus = getRecruitStatus(recruit.published, event.recruitDeadline)
  const [copied, setCopied] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const progress = getEventProgress(event.startDate, event.endDate)

  // Numbers come straight from the booth list so they always match 부스 관리 / 지도 제작.
  const approved = booths.filter((b) => b.status === BOOTH_STATUS.APPROVED)
  const countOperating = (s) => approved.filter((b) => b.operatingStatus === s).length

  const stats = [
    { key: 'total', label: '전체 부스', value: approved.length },
    { key: O.OPEN, label: BOOTH_OPERATING_STATUS_LABEL[O.OPEN], value: countOperating(O.OPEN) },
    {
      key: O.PREPARING,
      label: BOOTH_OPERATING_STATUS_LABEL[O.PREPARING],
      value: countOperating(O.PREPARING),
    },
    {
      key: O.SOLD_OUT,
      label: BOOTH_OPERATING_STATUS_LABEL[O.SOLD_OUT],
      value: countOperating(O.SOLD_OUT),
    },
    { key: O.CLOSED, label: BOOTH_OPERATING_STATUS_LABEL[O.CLOSED], value: countOperating(O.CLOSED) },
  ]

  // Same ordering as the notice list; drafts are never shown here.
  const recentNotices = sortNotices(notices.filter((n) => n.status !== NOTICE_STATUS.DRAFT)).slice(
    0,
    RECENT_NOTICE_COUNT,
  )

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be blocked; still confirm so the flow is visible.
    }
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
  }

  const copyLabel = (key, label) => (copied === key ? '복사됨' : label)

  return (
    <OrganizerLayout
      active="dashboard"
      crumb="대시보드"
      title="대시보드"
      subtitle="행사 정보와 부스 운영 현황을 한눈에 확인하세요."
      actions={
        <button type="button" className="om-btn om-btn-outline" onClick={() => setEditOpen(true)}>
          행사 정보 수정
        </button>
      }
    >
      <div className="db-body">
        <section className="db-event">
          <EventArt name={event.name} imageUrl={event.imageUrl} />
          <div className="db-event-info">
            <div className="db-event-title">
              <h2>{event.name}</h2>
              <span className={`db-chip${progress === EVENT_PROGRESS.ONGOING ? '' : ' is-muted'}`}>
                {EVENT_PROGRESS_LABEL[progress]}
              </span>
            </div>
            <p>
              <Icon name="calendar" />
              {withWeekday(event.startDate)} – {withWeekday(event.endDate).slice(5)}
            </p>
            <p>
              <Icon name="pin" />
              {event.venue}
            </p>
          </div>
          <div className="db-event-intro">
            <h3>행사 소개</h3>
            <p>{event.intro}</p>
          </div>
        </section>

        <section className="db-recruit">
          <div className="db-recruit-title">
            <h3>부스 공개 모집 현황</h3>
            <span>{RECRUIT_STATUS_LABEL[recruitStatus]}</span>
          </div>
          <dl>
            <div>
              <dt>모집 마감일</dt>
              <dd>{formatDateTime(event.recruitDeadline)}</dd>
            </div>
            <div>
              <dt>신청 수</dt>
              <dd>{booths.length}건</dd>
            </div>
            <div>
              <dt>모집 부스 수</dt>
              <dd>{event.recruitTarget}팀</dd>
            </div>
          </dl>
          <button
            type="button"
            className="om-btn om-btn-primary"
            onClick={() => navigate('/organizer/recruit')}
          >
            모집 관리
          </button>
        </section>

        <div className="db-section-head">
          <h3>부스 운영 요약</h3>
          <button type="button" className="db-link" onClick={() => navigate('/organizer/live')}>
            운영 현황 보기 →
          </button>
        </div>
        <div className="db-stats">
          {stats.map((s) => (
            <div key={s.key} className={`db-stat is-${s.key}`}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>

        <div className="db-cards">
          <section className="db-card">
            <div className="db-card-head">
              <h3>최근 공지사항</h3>
              <button
                type="button"
                className="db-link"
                onClick={() => navigate('/organizer/notices', { state: { compose: true } })}
              >
                + 공지 작성
              </button>
            </div>
            <ul className="db-notices">
              {recentNotices.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => navigate('/organizer/notices')}>
                    <span className="db-notice-badge">
                      {n.urgent && n.status === NOTICE_STATUS.PUBLISHED && (
                        <span className="db-urgent">긴급</span>
                      )}
                    </span>
                    <span className="db-notice-main">
                      <strong>{n.title}</strong>
                      <small>
                        <span>{audienceText(n.audiences)}</span>
                        <span>{noticeDateText(n)}</span>
                      </small>
                    </span>
                  </button>
                </li>
              ))}
              {recentNotices.length === 0 && <li className="db-empty">게시된 공지가 없어요.</li>}
            </ul>
            <button
              type="button"
              className="db-outline-btn"
              onClick={() => navigate('/organizer/notices')}
            >
              공지사항 전체 보기
            </button>
          </section>

          <section className="db-card">
            <h3>부스 운영자 초대</h3>
            <p className="db-sub">초대 코드나 링크로 부스 신청을 받으세요.</p>
            <span className="db-label">초대 코드</span>
            <div className="db-copy-row">
              <input readOnly value={event.inviteCode} aria-label="초대 코드" />
              <button type="button" className="db-outline-btn" onClick={() => copy('code', event.inviteCode)}>
                {copyLabel('code', '복사')}
              </button>
            </div>
            <span className="db-label">초대 링크</span>
            <div className="db-copy-row">
              <input
                readOnly
                value={event.inviteUrl.replace(/^https?:\/\//, '')}
                aria-label="초대 링크"
              />
              <button type="button" className="db-outline-btn" onClick={() => copy('invite', event.inviteUrl)}>
                {copyLabel('invite', '복사')}
              </button>
            </div>
            <p className="db-hint">
              초대를 받은 운영자는 부스 정보를 입력해 신청할 수 있습니다.
              <br />
              신청 내용은 부스 관리에서 승인할 수 있습니다.
            </p>
            <button
              type="button"
              className="om-btn om-btn-primary db-block-btn"
              onClick={() => copy('send', event.inviteUrl)}
            >
              {copyLabel('send', '초대 링크 보내기')}
            </button>
          </section>

          <section className="db-card">
            <h3>방문객 링크 · QR 공유</h3>
            <p className="db-sub">방문객은 로그인 없이 바로 이용할 수 있어요.</p>
            <span className="db-label">방문객용 링크</span>
            <input
              className="db-full-input"
              readOnly
              value={event.visitorUrl.replace(/^https?:\/\//, '')}
              aria-label="방문객용 링크"
            />
            <div className="db-two">
              <button type="button" className="db-outline-btn" onClick={() => copy('visitor', event.visitorUrl)}>
                {copyLabel('visitor', '링크 복사')}
              </button>
              {/* TODO(backend): generate the real QR image and copy it. */}
              <button type="button" className="db-outline-btn">
                QR 복사
              </button>
            </div>
            <div className="db-qr-row">
              <QrPlaceholder />
              <div>
                <strong>행사 홍보물에 QR을 붙여주세요.</strong>
                <p>지도를 바로 열 수 있는 방문객용 QR입니다.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      {editOpen && (
        <EventEditModal
          event={event}
          onClose={() => setEditOpen(false)}
          onSave={(fields) => {
            updateEvent(fields)
            setEditOpen(false)
          }}
        />
      )}
    </OrganizerLayout>
  )
}
