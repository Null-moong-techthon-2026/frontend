import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { clockIn, clockOut, listMyAttendance, listMySchedule, listStaffNotices, resolveStaffInvite } from '../../api/staffApi'
import { apiErrorMessage } from '../../constants/errors'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { EventPicture } from '../../components/mobile/MobileUi'
import { STAFF_ROLE_LABEL } from '../../dummy/staffStore'
import { scheduleDay, todayYmd } from '../../utils/eventDays'
import { dateRange, dayTitle, shortDateTime } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './staff-app.css'

// 홈 · 스태프: 01 초대 코드 입력 / 03 참여 신청 완료·승인 대기 / 04 홈 (참여 완료)
export default function StaffHome() {
  const { state } = useOutletContext()
  if (state === 'approved') return <ApprovedHome />
  if (state === 'pending') return <PendingHome />
  if (state === 'rejected') return <RejectedHome />
  return <EnterCode />
}

function EnterCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (!code.trim() || busy) return
    setBusy(true)
    setMessage('')
    try {
      const resolved = await resolveStaffInvite(code)
      navigate('/staff/join', { state: { resolved, code: code.trim() } })
    } catch (err) {
      setMessage(
        err.status === 404 ? '초대 코드를 확인해 주세요. 코드가 틀렸거나 기간이 지났을 수 있어요.' : apiErrorMessage(err),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="mb-title">행사에 참여하기</h1>
      <p className="mb-sub">주최측에게 받은 초대 코드를 입력해 주세요.</p>
      <div className="sa-icon">
        <MIcon name="doc" size={28} />
      </div>
      <div className="mb-card">
        <h3>초대 코드</h3>
        <input
          className="mb-input sa-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="BL26-STF7"
          autoComplete="off"
          autoCapitalize="characters"
        />
        <p className="mb-muted sa-caption">코드의 영문과 숫자, 하이픈을 확인해 주세요.</p>
        {message && <p className="mb-error">{message}</p>}
      </div>
      <div className="mb-card">
        <h3>초대 링크로 들어오셨나요?</h3>
        <p className="mb-muted">로그인 후 해당 행사의 참여 확인 화면으로 바로 연결됩니다.</p>
      </div>
      <MobileFooter>
        <button type="button" className="mb-btn is-primary" disabled={!code.trim() || busy} onClick={submit}>
          {busy ? '확인 중…' : '초대 코드 확인'}
        </button>
      </MobileFooter>
    </>
  )
}

function PendingHome() {
  const { mine, event, reload } = useOutletContext()
  const [checked, setChecked] = useState(false)

  return (
    <>
      <h1 className="mb-title">참여 신청이 완료됐어요</h1>
      <p className="mb-sub">주최자가 신청 내용을 확인하고 있습니다.</p>
      <div className="sa-icon">
        <MIcon name="clock" size={28} />
      </div>
      <div className="mb-card sa-event">
        <EventRow event={event} />
        <div className="mb-card-row">
          <small>
            신청 역할 · <b>{STAFF_ROLE_LABEL[mine.role] ?? mine.role}</b>
          </small>
          <span className="mb-chip">승인 대기</span>
        </div>
      </div>
      <ol className="mb-card sa-steps">
        <li className="is-done">
          <i />
          <span>
            <strong>참여 신청 완료</strong>
            <small>초대 코드와 역할을 제출했어요.</small>
          </span>
        </li>
        <li className="is-now">
          <i />
          <span>
            <strong>주최자 검토 중</strong>
            <small>주최자의 승인을 기다리고 있어요.</small>
          </span>
        </li>
        <li>
          <i />
          <span>
            <strong>참여 확정</strong>
            <small>승인 후 스태프 홈을 이용할 수 있어요.</small>
          </span>
        </li>
      </ol>
      <p className="mb-muted sa-caption">승인되면 홈에서 행사와 업무를 확인할 수 있습니다.</p>
      {checked && <p className="op-banner">아직 검토 중이에요. 승인되면 이 화면이 바뀌어요.</p>}
      <MobileFooter>
        <button
          type="button"
          className="mb-btn is-primary"
          onClick={() => {
            setChecked(true)
            reload()
          }}
        >
          승인 상태 확인
        </button>
      </MobileFooter>
    </>
  )
}

function RejectedHome() {
  const [again, setAgain] = useState(false)
  if (again) return <EnterCode />
  return (
    <>
      <h1 className="mb-title">참여 신청이 거부됐어요</h1>
      <p className="mb-sub">주최측에 문의하거나 초대 코드를 다시 확인해 주세요.</p>
      <div className="sa-icon is-red">
        <MIcon name="info" size={28} />
      </div>
      <MobileFooter>
        <button type="button" className="mb-btn is-primary" onClick={() => setAgain(true)}>
          초대 코드 다시 입력하기
        </button>
      </MobileFooter>
    </>
  )
}

export function EventRow({ event }) {
  return (
    <div className="sa-event-row">
      <div className="sa-event-pic">
        <EventPicture event={event} />
      </div>
      <span>
        <strong>{event.name}</strong>
        <small>{dateRange(event.startDate, event.endDate)}</small>
        <small>{event.venue}</small>
      </span>
    </div>
  )
}

function ApprovedHome() {
  const navigate = useNavigate()
  const { user, mine, event } = useOutletContext()
  const day = scheduleDay(event)
  const { data: shifts } = useAsync(() => listMySchedule(mine.eventId, day, mine.memberId), [mine.eventId, day])
  const { data: attendance, reload: reloadAttendance } = useAsync(() => listMyAttendance(mine.eventId), [mine.eventId])
  const { data: notices } = useAsync(() => listStaffNotices(mine.eventId), [mine.eventId])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  // The clock records today, whatever day of the event the schedule is showing.
  const record = attendance?.records.find((r) => r.date === todayYmd()) ?? null
  const recent = [...(notices ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2)

  const punch = async (call) => {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await call(mine.eventId)
      reloadAttendance()
    } catch (err) {
      setMessage(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="mb-title">홈</h1>
      <p className="mb-sub">{mine.name || user.nickname}님, 오늘도 함께해요.</p>

      <div className="mb-card sa-event">
        <div className="sa-event-row">
          <div className="sa-event-pic">
            <EventPicture event={event} />
          </div>
          <span>
            <span className="sa-event-title">
              <strong>{event.name}</strong>
            </span>
            <small>{dateRange(event.startDate, event.endDate)}</small>
            <small className="sa-role">
              {STAFF_ROLE_LABEL[mine.role] ?? mine.role}
              {mine.dutyName && ` · ${mine.dutyName} 지원`}
            </small>
          </span>
        </div>
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>출퇴근 체크</h3>
          <span className={`mb-chip ${record ? (record.out ? 'is-gray' : 'is-green') : 'is-outline'}`}>
            {record ? (record.out ? '퇴근 완료' : '근무 중') : '미출근'}
          </span>
        </div>
        <div className="sa-clock">
          <span>
            <small>출근</small>
            <b>{record?.in || '—'}</b>
          </span>
          <span>
            <small>퇴근</small>
            <b>{record?.out || '—'}</b>
          </span>
        </div>
        <div className="mb-btn-row">
          <button type="button" className="mb-btn is-primary" disabled={busy || !attendance || Boolean(record)} onClick={() => punch(clockIn)}>
            출근하기
          </button>
          <button type="button" className="mb-btn is-outline" disabled={busy || !record || Boolean(record.out)} onClick={() => punch(clockOut)}>
            퇴근하기
          </button>
        </div>
        {message && <p className="mb-error">{message}</p>}
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>오늘 일정</h3>
          <button type="button" className="mb-link" onClick={() => navigate('/staff/schedule')}>
            일정 전체 보기 ›
          </button>
        </div>
        <p className="mb-muted">
          {dayTitle(day)} · {shifts?.length ?? 0}개 일정
        </p>
        {shifts && shifts.length === 0 ? (
          <p className="mb-muted sa-caption">등록된 일정이 없어요. 주최측이 근무표에 배정하면 여기에 표시돼요.</p>
        ) : (
          <ul className="sa-today">
            {(shifts ?? []).map((s) => (
              <li key={s.id}>
                <i />
                <span>
                  <strong>{s.dutyName}</strong>
                  <small>{s.zone}</small>
                </span>
                <b>
                  {s.start} – {s.end}
                </b>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>최근 공지</h3>
          <button type="button" className="mb-link" onClick={() => navigate('/staff/notices')}>
            전체 보기 ›
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="mb-muted">아직 공지가 없어요.</p>
        ) : (
          <ul className="op-recent">
            {recent.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => navigate(`/staff/notices/${n.id}`)}>
                  <strong>{n.title}</strong>
                  <small>{shortDateTime(n.publishedAt)}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
