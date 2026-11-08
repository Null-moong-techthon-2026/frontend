import { useNavigate, useOutletContext } from 'react-router-dom'
import { listMyAttendance } from '../../api/staffApi'
import { ContactHqButton, LoadingBlock } from '../../components/mobile/MobileUi'
import MIcon from '../../components/mobile/MobileIcons'
import { useAuth } from '../../context/useAuth'
import { STAFF_ROLE_LABEL } from '../../dummy/staffStore'
import { dateRange, dayTitle } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import { todayYmd } from '../../utils/eventDays'
import { NeedApproval } from './StaffNotices'
import './staff-app.css'

const hoursOf = (min) => `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ''}`
const toMin = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))

// What the screens show about the person: the membership first, then the account.
function whoIs(mine, user) {
  return {
    name: mine?.name || user.nickname,
    email: mine?.email || user.email || '',
    phone: mine?.phone || user.phoneNumber || '',
    affiliation: mine?.affiliation || '',
  }
}

// 07 프로필 · 스태프
export function StaffProfile() {
  const { state } = useOutletContext()
  if (state !== 'approved') return <NeedApproval state={state} title="프로필" />
  return <Profile />
}

function Profile() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, mine, event } = useOutletContext()
  const { data: attendance } = useAsync(() => listMyAttendance(mine.eventId), [mine.eventId])
  const who = whoIs(mine, user)
  const records = attendance?.records ?? []
  const todayMinutes = records.filter((r) => r.date === (attendance?.today ?? todayYmd())).reduce((sum, r) => sum + (r.minutes ?? 0), 0)

  return (
    <>
      <h1 className="mb-title">프로필</h1>
      <p className="mb-sub">내 정보와 참여 중인 행사를 확인하세요.</p>

      <div className="mb-card">
        <div className="mb-card-row">
          <span className="op-me-head">
            <span className="vs-avatar is-lg">
              <MIcon name="user" size={26} />
            </span>
            <span>
              <strong>{who.name}</strong>
              <small>{who.email}</small>
            </span>
          </span>
        </div>
        <dl className="mb-kv sa-kv">
          <dt>연락처</dt>
          <dd>{who.phone || '-'}</dd>
          <dt>소속</dt>
          <dd>{who.affiliation || '-'}</dd>
        </dl>
        <button type="button" className="op-edit-link" onClick={() => navigate('/staff/profile/account')}>
          <span>
            <strong>계정 정보 보기</strong>
            <small>이름 · 연락처 · 이메일</small>
          </span>
          <MIcon name="chevron" size={18} />
        </button>
      </div>

      <div className="mb-card">
        <h3>참여 정보</h3>
        <dl className="mb-kv sa-kv">
          <dt>역할</dt>
          <dd>{STAFF_ROLE_LABEL[mine.role] ?? mine.role}</dd>
          <dt>업무</dt>
          <dd>{mine.dutyName ?? '미배정'}</dd>
          <dt>참여 행사</dt>
          <dd>{event.name}</dd>
        </dl>
        <p className="mb-muted sa-caption">역할 · 업무 · 참여 행사는 주최자가 관리합니다.</p>
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>내 근무 기록</h3>
          <button type="button" className="mb-link" onClick={() => navigate('/staff/profile/records')}>
            기록 보기 ›
          </button>
        </div>
        <div className="sa-clock">
          <span>
            <small>오늘 근무</small>
            <b>{hoursOf(todayMinutes)}</b>
          </span>
          <span>
            <small>누적 근무</small>
            <b>{hoursOf(attendance?.totalMinutes ?? 0)}</b>
          </span>
        </div>
        {attendance && records.length === 0 && <p className="mb-muted sa-caption">아직 출퇴근 기록이 없습니다.</p>}
      </div>

      <ContactHqButton phone={event.phone} className="mb-btn is-outline sa-contact" />
      <button
        type="button"
        className="op-logout"
        onClick={async () => {
          await logout()
          navigate('/login', { replace: true })
        }}
      >
        로그아웃
      </button>
    </>
  )
}

// 계정 정보 · 스태프 (read-only: the backend has no API to change an account yet)
export function StaffAccount() {
  const navigate = useNavigate()
  const { user, mine } = useOutletContext()
  const who = whoIs(mine, user)
  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate('/staff/profile')}>
        <MIcon name="back" size={18} />
        프로필
      </button>
      <h1 className="mb-title is-sm">계정 정보</h1>
      <p className="mb-sub">가입할 때 입력한 정보예요.</p>
      <div className="mb-card">
        <dl className="mb-kv">
          <dt>이름</dt>
          <dd>{who.name}</dd>
          <dt>연락처</dt>
          <dd>{who.phone || '-'}</dd>
          <dt>이메일</dt>
          <dd>{who.email || '-'}</dd>
          <dt>소속</dt>
          <dd>{who.affiliation || '-'}</dd>
        </dl>
      </div>
      <p className="op-note">※ 계정 정보 수정은 아직 지원하지 않아요.</p>
    </>
  )
}

// 07-2 근무 기록 · 스태프
export function StaffRecords() {
  const { state } = useOutletContext()
  if (state !== 'approved') return <NeedApproval state={state} title="프로필" />
  return <Records />
}

function Records() {
  const navigate = useNavigate()
  const { mine, event } = useOutletContext()
  const { data: attendance, error, reload } = useAsync(() => listMyAttendance(mine.eventId), [mine.eventId])
  const todayMinutes = (attendance?.records ?? []).filter((r) => r.date === (attendance.today ?? todayYmd())).reduce((sum, r) => sum + (r.minutes ?? 0), 0)

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate('/staff/profile')}>
        <MIcon name="back" size={18} />
        프로필
      </button>
      <h1 className="mb-title is-sm">근무 기록</h1>
      <p className="mb-sub">내 출퇴근과 근무 시간 기록을 확인하세요.</p>
      <div className="mb-card">
        <strong>{event.name}</strong>
        <p className="mb-muted sa-caption">{dateRange(event.startDate, event.endDate)}</p>
      </div>
      {!attendance ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : (
        <>
          <div className="mb-card sa-clock">
            <span>
              <small>오늘 근무</small>
              <b>{hoursOf(todayMinutes)}</b>
            </span>
            <span>
              <small>누적 근무</small>
              <b>{hoursOf(attendance.totalMinutes)}</b>
            </span>
          </div>
          {attendance.records.length === 0 && <p className="mb-empty">아직 출퇴근 기록이 없어요. 홈에서 출근하기를 눌러 보세요.</p>}
          {attendance.records.map((r, i) => {
            const span = r.out ? toMin(r.out) - toMin(r.in) : 0
            const minutes = r.minutes ?? span
            return (
              <div key={r.id ?? `${r.date}-${i}`} className="mb-card">
                <div className="mb-card-row">
                  <h3>{dayTitle(r.date)}</h3>
                  <span className={`mb-chip ${r.out ? 'is-outline' : 'is-green'}`}>{r.out ? '근무 완료' : '근무 중'}</span>
                </div>
                <dl className="mb-kv sa-kv">
                  <dt>출근</dt>
                  <dd>{r.in || '—'}</dd>
                  <dt>퇴근</dt>
                  <dd>{r.out ?? '—'}</dd>
                  <dt>기록된 근무</dt>
                  <dd>{hoursOf(minutes)}</dd>
                </dl>
              </div>
            )
          })}
        </>
      )}
      <p className="mb-muted sa-caption">출퇴근 기록에 이상이 있으면 운영본부에 문의해 주세요.</p>
      <ContactHqButton phone={event.phone} />
    </>
  )
}
