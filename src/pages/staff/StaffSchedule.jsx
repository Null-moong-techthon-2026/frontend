import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { DEMO_EVENT } from '../../dummy/demoData'
import { SHIFT_DAYS, STAFF_ROLE_LABEL, scheduleDay, myShifts } from '../../dummy/staffStore'
import { dayTitle } from '../../utils/mobileFormat'
import { NeedApproval } from './StaffNotices'
import './staff-app.css'

const dayChip = (ymd) => {
  const d = new Date(`${ymd}T00:00:00`)
  return { md: `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`, wd: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] }
}
const minutes = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))
const hoursText = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

// 05 일정 · 스태프 (+ 05-1 함께 근무하는 스태프 팝업)
export default function StaffSchedule() {
  const { state, me, data } = useOutletContext()
  const [day, setDay] = useState(scheduleDay())
  const [together, setTogether] = useState(null) // the member whose card is open

  if (state !== 'approved') return <NeedApproval state={state} title="일정" />

  const shifts = myShifts(data, me.id, day)
  const worked = shifts.reduce((sum, s) => sum + (minutes(s.end) - minutes(s.start)), 0)
  let gaps = 0
  const items = []
  shifts.forEach((s, i) => {
    const prev = shifts[i - 1]
    if (prev && minutes(s.start) > minutes(prev.end)) {
      gaps += minutes(s.start) - minutes(prev.end)
      items.push({ type: 'break', key: `break-${s.id}`, from: prev.end, to: s.start })
    }
    items.push({ type: 'shift', key: s.id, shift: s })
  })

  return (
    <>
      <h1 className="mb-title">일정</h1>
      <p className="mb-sub">{DEMO_EVENT.name} · 내 근무 일정을 확인하세요.</p>
      <div className="sa-days">
        {SHIFT_DAYS.map((d) => {
          const c = dayChip(d)
          return (
            <button key={d} type="button" className={day === d ? 'is-active' : ''} onClick={() => setDay(d)}>
              <b>{c.md}</b>
              <small>{c.wd}</small>
            </button>
          )
        })}
      </div>
      <div className="mb-card-row sa-day-head">
        <h2 className="mb-h3">{dayTitle(day)}</h2>
        <small className="mb-muted">
          근무 {hoursText(worked)} · 휴식 {hoursText(gaps)}
        </small>
      </div>

      {shifts.length === 0 ? (
        <p className="mb-empty">이 날은 등록된 일정이 없어요.</p>
      ) : (
        <ol className="sa-timeline">
          {items.map((item) =>
            item.type === 'break' ? (
              <li key={item.key} className="is-break">
                <time>{item.from}</time>
                <div className="mb-card">
                  <span>
                    <b>휴식</b> · {item.from} – {item.to}
                  </span>
                </div>
              </li>
            ) : (
              <ShiftCard key={item.key} shift={item.shift} data={data} meId={me.id} onTogether={setTogether} />
            ),
          )}
          <li className="is-end">
            <time>{shifts[shifts.length - 1].end}</time>
            <span className="mb-muted">오늘 일정 종료</span>
          </li>
        </ol>
      )}

      {together && (
        <div className="sa-sheet" onClick={() => setTogether(null)}>
          <div className="sa-sheet-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mb-card-row">
              <h3>함께 근무하는 스태프</h3>
              <button type="button" className="sa-x" aria-label="닫기" onClick={() => setTogether(null)}>
                ×
              </button>
            </div>
            <p className="sa-who">
              <MIconUser />
              <b>{together.name}</b>
              <span className="sa-role-tag">{STAFF_ROLE_LABEL[together.role]}</span>
            </p>
            <dl className="mb-kv">
              <dt>업무</dt>
              <dd>{data.duties.find((d) => d.id === together.dutyId)?.name ?? '미배정'}</dd>
              <dt>연락처</dt>
              <dd>{together.phone}</dd>
            </dl>
            <a className="mb-btn is-primary" href={`tel:${together.phone.replaceAll('-', '')}`}>
              전화 걸기
            </a>
          </div>
        </div>
      )}
    </>
  )
}

function MIconUser() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0" />
    </svg>
  )
}

function ShiftCard({ shift, data, meId, onTogether }) {
  const duty = data.duties.find((d) => d.id === shift.dutyId)
  const mates = shift.memberIds.filter((id) => id !== meId).map((id) => data.members.find((x) => x.id === id)).filter(Boolean)
  return (
    <li>
      <time>{shift.start}</time>
      <div className="mb-card">
        <b className="sa-time">
          {shift.start} – {shift.end}
        </b>
        <strong>{duty?.name}</strong>
        <small>{duty?.zone}</small>
        <small>{mates.length > 0 ? '함께 근무' : '혼자 근무'}</small>
        {mates.length > 0 && (
          <div className="sa-mates">
            {mates.slice(0, 2).map((m) => (
              <button key={m.id} type="button" onClick={() => onTogether(m)}>
                {m.name} ›
              </button>
            ))}
            {mates.length > 2 && <span className="sa-more">외 {mates.length - 2}명</span>}
          </div>
        )}
      </div>
    </li>
  )
}
