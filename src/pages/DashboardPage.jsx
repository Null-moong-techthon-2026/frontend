import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../api/eventApi'
import EventEditModal from '../components/EventEditModal'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Toast from '../components/Toast'
import {
  BOOTH_OPERATING_STATUS as O,
  BOOTH_OPERATING_STATUS_LABEL,
} from '../constants/booth'
import { apiErrorMessage } from '../constants/errors'
import { EVENT_PROGRESS, EVENT_PROGRESS_LABEL } from '../constants/event'
import { NOTICE_STATUS } from '../constants/notice'
import { RECRUIT_STATUS_LABEL } from '../constants/recruit'
import { useBooths } from '../context/useBooths'
import { useEvent } from '../context/useEvent'
import { useInvitation } from '../context/useInvitation'
import { useRecruit } from '../context/useRecruit'
import { formatDateTime, instantToLocalDateTime } from '../utils/date'
import { getEventProgress } from '../utils/event'
import { audienceText, noticeDateText, sortNotices, toNotice } from '../utils/notice'
import { getRecruitStatus } from '../utils/recruit'
import { useToast } from '../utils/useToast'
import './dashboard.css'

const RECENT_NOTICE_COUNT = 3
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// The CSS class of each stat card (dashboard.css).
const STAT_CLASS = {
  total: 'is-total',
  [O.OPEN]: 'is-open',
  [O.PREPARING]: 'is-preparing',
  [O.SOLD_OUT]: 'is-soldout',
  [O.CLOSED]: 'is-closed',
}

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
  const { summary } = useBooths()
  const { event, updateEvent } = useEvent()
  const { recruit } = useRecruit()
  const { invitation, issued, issue, revoke } = useInvitation()
  const { toast, notify } = useToast()
  const recruitStatus = getRecruitStatus(recruit?.published ?? false, recruit?.deadline ?? '')
  const [copied, setCopied] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [dashboard, setDashboard] = useState(null) // { boothSummary, recentAnnouncements }
  const progress = getEventProgress(event.startDate, event.endDate)

  useEffect(() => {
    let alive = true
    getDashboard(event.id)
      .then((data) => alive && setDashboard(data))
      .catch((err) => alive && notify(apiErrorMessage(err), 'error'))
    return () => {
      alive = false
    }
  }, [event.id, notify])

  // Booth numbers come from the backend (approved + registered booths, archived ones excluded).
  const booths = dashboard?.boothSummary
  const stats = [
    { key: 'total', label: '전체 부스', value: booths?.total ?? 0 },
    { key: O.OPEN, label: BOOTH_OPERATING_STATUS_LABEL[O.OPEN], value: booths?.open ?? 0 },
    {
      key: O.PREPARING,
      label: BOOTH_OPERATING_STATUS_LABEL[O.PREPARING],
      value: booths?.preparing ?? 0,
    },
    {
      key: O.SOLD_OUT,
      label: BOOTH_OPERATING_STATUS_LABEL[O.SOLD_OUT],
      value: booths?.soldOut ?? 0,
    },
    { key: O.CLOSED, label: BOOTH_OPERATING_STATUS_LABEL[O.CLOSED], value: booths?.closed ?? 0 },
  ]

  // Same ordering as the notice list; the backend only sends published notices here.
  const recentNotices = sortNotices((dashboard?.recentAnnouncements ?? []).map(toNotice)).slice(
    0,
    RECENT_NOTICE_COUNT,
  )

  const inviteExpiry = invitation ? formatDateTime(instantToLocalDateTime(invitation.expiresAt)) : ''

  const issueInvite = async () => {
    if (
      invitation?.active &&
      !window.confirm('새로 발급하면 이전 초대 코드와 링크는 사용할 수 없게 돼요. 새로 발급할까요?')
    ) {
      return
    }
    setInviteBusy(true)
    try {
      await issue()
      notify('초대 코드를 발급했어요. 지금 복사해 두세요. 이후에는 다시 볼 수 없어요.')
    } catch (err) {
      notify(
        err.message === 'NO_DEADLINE'
          ? '부스 모집에서 모집 마감일을 저장해야 초대 코드를 만들 수 있어요.'
          : err.code === 'RECRUITMENT_CLOSED'
            ? '부스 모집 공고를 공개한 뒤에 초대 코드를 만들 수 있어요.'
            : apiErrorMessage(err),
        'error',
      )
    } finally {
      setInviteBusy(false)
    }
  }

  const revokeInvite = async () => {
    if (!window.confirm('초대를 종료하면 지금의 초대 코드와 링크를 쓸 수 없게 돼요. 종료할까요?')) return
    setInviteBusy(true)
    try {
      await revoke()
      notify('초대를 종료했어요.')
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
    } finally {
      setInviteBusy(false)
    }
  }

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
              <dd>{recruit?.deadline ? formatDateTime(recruit.deadline) : '미정'}</dd>
            </div>
            <div>
              <dt>신청 수</dt>
              <dd>{summary.total}건</dd>
            </div>
            <div>
              <dt>모집 부스 수</dt>
              <dd>{recruit?.target ? `${recruit.target}팀` : '미정'}</dd>
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
            <div key={s.key} className={`db-stat ${STAT_CLASS[s.key]}`}>
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
            {issued ? (
              <>
                <span className="db-label">초대 코드</span>
                <div className="db-copy-row">
                  <input readOnly value={issued.code} aria-label="초대 코드" />
                  <button type="button" className="db-outline-btn" onClick={() => copy('code', issued.code)}>
                    {copyLabel('code', '복사')}
                  </button>
                </div>
                <span className="db-label">초대 링크</span>
                <div className="db-copy-row">
                  <input
                    readOnly
                    value={issued.inviteUrl.replace(/^https?:\/\//, '')}
                    aria-label="초대 링크"
                  />
                  <button
                    type="button"
                    className="db-outline-btn"
                    onClick={() => copy('invite', issued.inviteUrl)}
                  >
                    {copyLabel('invite', '복사')}
                  </button>
                </div>
                <p className="db-hint">
                  이 코드는 지금만 볼 수 있어요. 새로고침하면 사라지니 꼭 복사해 두세요.
                  <br />
                  {inviteExpiry}까지 사용할 수 있어요.
                </p>
                <button
                  type="button"
                  className="om-btn om-btn-primary db-block-btn"
                  onClick={() => copy('send', issued.inviteUrl)}
                >
                  {copyLabel('send', '초대 링크 보내기')}
                </button>
              </>
            ) : (
              <>
                <p className="db-hint">
                  {!invitation
                    ? '아직 발급한 초대 코드가 없어요.'
                    : invitation.active
                      ? `초대가 진행 중이에요. ${inviteExpiry}까지 사용할 수 있어요.`
                      : '지난 초대는 쓸 수 없는 상태예요. 새로 발급해 주세요.'}
                  <br />
                  초대 코드는 발급할 때 한 번만 보여 줘요. 다시 필요하면 새로 발급하세요. (이전 코드는 쓸 수
                  없게 돼요)
                </p>
                <button
                  type="button"
                  className="om-btn om-btn-primary db-block-btn"
                  disabled={inviteBusy}
                  onClick={issueInvite}
                >
                  {invitation ? '초대 코드 다시 발급' : '초대 코드 발급'}
                </button>
              </>
            )}
            {invitation?.active && (
              <button
                type="button"
                className="db-outline-btn db-block-btn"
                disabled={inviteBusy}
                onClick={revokeInvite}
              >
                초대 종료
              </button>
            )}
            <p className="db-hint">
              초대를 받은 운영자는 부스 정보를 입력해 신청할 수 있습니다.
              <br />
              신청 내용은 부스 관리에서 승인할 수 있습니다.
            </p>
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
              {/* TODO(visitor app): generate the real QR image and copy it. */}
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
      <Toast toast={toast} />
      {editOpen && (
        <EventEditModal
          event={event}
          onClose={() => setEditOpen(false)}
          onSave={async (fields) => {
            await updateEvent(fields)
            setEditOpen(false)
            notify('행사 정보를 저장했어요.')
          }}
        />
      )}
    </OrganizerLayout>
  )
}
