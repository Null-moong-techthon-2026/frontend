import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { listMySchedule } from '../../api/staffApi'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { STAFF_ROLE_LABEL } from '../../dummy/staffStore'
import { eventDays, scheduleDay } from '../../utils/eventDays'
import { dayTitle } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
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
  const { state, event } = useOutletContext()
  if (state !== 'approved') return <NeedApproval state={state} title="일정" />
  return <Schedule event={event} />
}

function Schedule({ event }) {
  const { mine } = useOutletContext()
  const days = useMemo(() => eventDays(event), [event])
  const [day, setDay] = useState(scheduleDay(event))
  const [together, setTogether] = useState(null) // the person whose card is open
  const { data: shifts, error, reload } = useAsync(() => listMySchedule(mine.eventId, day), [mine.eventId, day])

  const list = shifts ?? []
  const worked = list.reduce((sum, s) => sum + (minutes(s.end) - minutes(s.start)), 0)
  let gaps = 0
  const items = []
  list.forEach((s, i) => {
    const prev = list[i - 1]
    if (prev && minutes(s.start) > minutes(prev.end)) {
      gaps += minutes(s.start) - minutes(prev.end)
      items.push({ type: 'break', key: `break-${s.id}`, from: prev.end, to: s.start })
    }
    items.push({ type: 'shift', key: s.id, shift: s })
  })

  return (
    <>
      <h1 className="mb-title">일정</h1>
      <p className="mb-sub">{event.name} · 내 근무 일정을 확인하세요.</p>
      <div className="sa-days">
        {days.map((d) => {
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
        {shifts && (
          <small className="mb-muted">
            근무 {hoursText(worked)} · 휴식 {hoursText(gaps)}
          </small>
        )}
      </div>

      {!shifts ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : list.length === 0 ? (
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
              <li key={item.key}>
                <time>{item.shift.start}</time>
                <div className="mb-card">
                  <b className="sa-time">
                    {item.shift.start} – {item.shift.end}
                  </b>
                  <strong>{item.shift.dutyName}</strong>
                  <small>{item.shift.zone}</small>
                  <small>{item.shift.mates.length > 0 ? '함께 근무' : '혼자 근무'}</small>
                  {item.shift.mates.length > 0 && (
                    <div className="sa-mates">
                      {item.shift.mates.slice(0, 2).map((m) => (
                        <button key={m.id} type="button" onClick={() => setTogether({ ...m, dutyName: m.dutyName ?? item.shift.dutyName })}>
                          {m.name} ›
                        </button>
                      ))}
                      {item.shift.mates.length > 2 && <span className="sa-more">외 {item.shift.mates.length - 2}명</span>}
                    </div>
                  )}
                </div>
              </li>
            ),
          )}
          <li className="is-end">
            <time>{list[list.length - 1].end}</time>
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
              <b>{together.name}</b>
              <span className="sa-role-tag">{STAFF_ROLE_LABEL[together.role] ?? together.role}</span>
            </p>
            <dl className="mb-kv">
              <dt>업무</dt>
              <dd>{together.dutyName ?? '미배정'}</dd>
              <dt>연락처</dt>
              <dd>{together.phone || '-'}</dd>
            </dl>
            {together.phone && (
              <a className="mb-btn is-primary" href={`tel:${together.phone.replaceAll('-', '')}`}>
                전화 걸기
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
