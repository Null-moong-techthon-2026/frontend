import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import OrganizerLayout from '../components/OrganizerLayout'
import {
  STAFF_INVITE,
  STAFF_ROLE,
  STAFF_ROLE_LABEL,
  STAFF_STATUS,
  STAFF_STATUS_LABEL,
  SHIFT_DAYS,
  addDuty,
  addShift,
  approveMember,
  assignDuty,
  countBy,
  dutyOf,
  membersOfDuty,
  rejectMember,
  setShiftMembers,
  updateMember,
  useStaffData,
} from '../dummy/staffStore'
import './staff.css'

const TABS = [
  ['roster', '명단', '행사에 함께할 인원을 초대하고 역할과 업무를 관리하세요.'],
  ['schedule', '근무표', '날짜별 근무를 배치하고, 시간표를 선택해 스태프를 할당하세요.'],
  ['live', '실시간 현황', '근무표에 맞춰 바뀌는 현황을 확인하고, 현장에서 인원을 재배정하세요.'],
]
const PAGE_SIZE = 6
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const HOURS = Array.from({ length: 10 }, (_, i) => 11 + i) // 11:00 ... 20:00 columns
const GRID_START = 11 * 60
const GRID_END = 21 * 60
const TIMES = Array.from({ length: 24 }, (_, i) => `${String(11 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)

const minutes = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))
const dayLabel = (ymd) => {
  const d = new Date(`${ymd}T00:00:00`)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`
}
const nowLabel = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} (${WEEKDAYS[d.getDay()]}) ${p(d.getHours())}:${p(d.getMinutes())}`
}
const statusTone = (status) =>
  status === STAFF_STATUS.PENDING ? 'is-lime' : status === STAFF_STATUS.WORKING ? 'is-green' : status === STAFF_STATUS.ABSENT ? 'is-red' : 'is-gray'

// 스태프 (organizer, web): 명단 / 근무표 / 실시간 현황 + their popups. Data: dummy/staffStore.js.
export default function OrganizerStaffPage() {
  const data = useStaffData()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t[0] === params.get('tab')) ? params.get('tab') : 'roster'
  const setTab = (key) => setParams(key === 'roster' ? {} : { tab: key }, { replace: true })
  const [modal, setModal] = useState(null) // 'invite' | 'duty' | 'shift'
  const current = TABS.find((t) => t[0] === tab)

  return (
    <OrganizerLayout
      active="staff"
      crumb="스태프"
      title="스태프"
      subtitle={current[2]}
      actions={
        tab === 'schedule' ? null : (
          <>
            {tab === 'roster' && (
              <button type="button" className="om-btn om-btn-outline" onClick={() => setModal('duty')}>
                업무 추가하기
              </button>
            )}
            {tab === 'roster' && (
              <button type="button" className="om-btn om-btn-primary" onClick={() => setModal('invite')}>
                스태프 초대
              </button>
            )}
          </>
        )
      }
    >
      <div className="sf">
        <div className="sf-tabs" role="tablist">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'roster' && <Roster data={data} />}
        {tab === 'schedule' && <Schedule data={data} onAdd={() => setModal('shift')} />}
        {tab === 'live' && <Live data={data} />}
      </div>
      {modal === 'invite' && <InviteModal onClose={() => setModal(null)} />}
      {modal === 'duty' && <DutyModal onClose={() => setModal(null)} />}
      {modal === 'shift' && <ShiftModal data={data} onClose={() => setModal(null)} />}
    </OrganizerLayout>
  )
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="sf-overlay" onClick={onClose}>
      <div className="sf-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sf-modal-head">
          <h2>{title}</h2>
          <button type="button" className="sf-x" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        {subtitle && <p className="sf-modal-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

function Stat({ label, value, tone = '' }) {
  return (
    <div className={`sf-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

// ---------------------------------------------------------------- 명단
function Roster({ data }) {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState('s01')

  const people = data.members.filter((x) => x.status !== STAFF_STATUS.REJECTED)
  const roles = countBy(people, 'role')
  const pending = people.filter((x) => x.status === STAFF_STATUS.PENDING).length
  const needle = q.trim().toLowerCase()
  const filtered = people.filter(
    (x) => (!role || x.role === role) && (!status || x.status === status) && (!needle || x.name.toLowerCase().includes(needle) || x.phone.includes(needle)),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const selected = data.members.find((x) => x.id === selectedId)

  return (
    <>
      <div className="sf-stats">
        <Stat label="전체 인원" value={people.length} />
        <Stat label="관리자(주최측)" value={roles.ADMIN ?? 0} />
        <Stat label="스태프" value={roles.STAFF ?? 0} tone="is-accent" />
        <Stat label="근로" value={roles.LABOR ?? 0} />
        <Stat label="봉사" value={roles.VOLUNTEER ?? 0} />
      </div>
      <div className="sf-split">
        <section className="sf-card">
          <div className="sf-card-head">
            <h2>스태프 명단</h2>
            <span className="sf-pills">
              <span className="sf-pill">전체 {people.length}</span>
              <span className="sf-pill is-lime">승인 대기 {pending}</span>
            </span>
          </div>
          <div className="sf-filters">
            <input className="sf-input" placeholder="⌕ 이름 · 연락처 검색" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
            <select className="sf-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(0) }} aria-label="역할">
              <option value="">전체 역할</option>
              {Object.values(STAFF_ROLE).map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <select className="sf-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} aria-label="상태">
              <option value="">전체 상태</option>
              {Object.values(STAFF_STATUS).filter((s) => s !== STAFF_STATUS.REJECTED).map((s) => (
                <option key={s} value={s}>
                  {STAFF_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <table className="sf-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>역할</th>
                <th>업무</th>
                <th>연락처</th>
                <th>상태</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id} className={x.id === selectedId ? 'is-selected' : ''}>
                  <td>
                    <strong>{x.name}</strong>
                  </td>
                  <td>
                    <select className="sf-cell-select" value={x.role} onChange={(e) => updateMember(x.id, { role: e.target.value })} aria-label={`${x.name} 역할`}>
                      {Object.values(STAFF_ROLE).map((r) => (
                        <option key={r} value={r}>
                          {STAFF_ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select className="sf-cell-select" value={x.dutyId ?? ''} onChange={(e) => (e.target.value ? assignDuty(x.id, e.target.value) : updateMember(x.id, { dutyId: null }))} aria-label={`${x.name} 업무`}>
                      <option value="">미할당</option>
                      {data.duties.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{x.phone}</td>
                  <td>
                    <select className={`sf-chip-select ${statusTone(x.status)}`} value={x.status} onChange={(e) => updateMember(x.id, { status: e.target.value })} aria-label={`${x.name} 상태`}>
                      {Object.values(STAFF_STATUS).filter((s) => s !== STAFF_STATUS.REJECTED).map((s) => (
                        <option key={s} value={s}>
                          {STAFF_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="sf-btn is-sm" onClick={() => setSelectedId(x.id)}>
                      보기
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="sf-empty">
                    조건에 맞는 인원이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="sf-foot">
            <small>총 {filtered.length}명 중 {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}~{page * PAGE_SIZE + shown.length}명</small>
            <span className="sf-pager">
              <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="이전">
                ‹
              </button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} type="button" className={i === page ? 'is-active' : ''} onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              ))}
              <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="다음">
                ›
              </button>
            </span>
          </div>
          <small className="sf-hint">역할 · 업무 · 상태를 눌러 변경할 수 있어요.</small>
        </section>
        {selected && <Detail key={selected.id} member={selected} data={data} />}
      </div>
    </>
  )
}

function Detail({ member, data }) {
  const [memo, setMemo] = useState(member.memo)
  const duty = dutyOf(data, member)
  const shifts = data.shifts.filter((s) => s.memberIds.includes(member.id))
  const pending = member.status === STAFF_STATUS.PENDING

  return (
    <aside className="sf-card">
      <div className="sf-card-head">
        <h2>스태프 상세</h2>
        <span className={`sf-pill ${statusTone(member.status)}`}>{STAFF_STATUS_LABEL[member.status]}</span>
      </div>
      <dl className="sf-kv">
        <dt>이름</dt>
        <dd>
          <strong>{member.name}</strong>
        </dd>
        <dt>연락처</dt>
        <dd>{member.phone}</dd>
        <dt>이메일</dt>
        <dd>{member.email}</dd>
        <dt>소속</dt>
        <dd>{member.affiliation}</dd>
        <dt>역할</dt>
        <dd>
          <select className="sf-select" value={member.role} onChange={(e) => updateMember(member.id, { role: e.target.value })}>
            {Object.values(STAFF_ROLE).map((r) => (
              <option key={r} value={r}>
                {STAFF_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </dd>
        <dt>업무</dt>
        <dd>
          <select className="sf-select" value={member.dutyId ?? ''} onChange={(e) => (e.target.value ? assignDuty(member.id, e.target.value) : updateMember(member.id, { dutyId: null }))}>
            <option value="">미할당</option>
            {data.duties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </dd>
        <dt>상태</dt>
        <dd>
          <select className={`sf-select ${statusTone(member.status)}`} value={member.status} onChange={(e) => updateMember(member.id, { status: e.target.value })}>
            {Object.values(STAFF_STATUS).filter((s) => s !== STAFF_STATUS.REJECTED).map((s) => (
              <option key={s} value={s}>
                {STAFF_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </dd>
      </dl>
      <h3 className="sf-h3">배정 · 근무 요약</h3>
      <dl className="sf-kv">
        <dt>근무 시간</dt>
        <dd>{duty ? `${duty.start} – ${duty.end}` : '미등록'}</dd>
        <dt>부스 할당</dt>
        <dd>미할당</dd>
        <dt>근무표</dt>
        <dd>{shifts.length === 0 ? '등록된 근무표가 없습니다.' : `${shifts.length}건 배정됨`}</dd>
      </dl>
      <h3 className="sf-h3">주최측 참고 메모</h3>
      <small className="sf-hint">주최측 계정만 열람할 수 있습니다.</small>
      <textarea className="sf-textarea" placeholder="운영 참고 사항을 적어 두세요." value={memo} onChange={(e) => setMemo(e.target.value)} onBlur={() => memo !== member.memo && updateMember(member.id, { memo })} />
      <div className="sf-actions">
        <button type="button" className="sf-btn is-danger" disabled={!pending} onClick={() => rejectMember(member.id)}>
          거부
        </button>
        <button type="button" className="sf-btn is-primary" disabled={!pending} onClick={() => approveMember(member.id)}>
          승인
        </button>
      </div>
    </aside>
  )
}

function InviteModal({ onClose }) {
  const [copied, setCopied] = useState('')
  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // The clipboard can be blocked; the confirmation still shows.
    }
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }
  return (
    <Modal title="스태프 초대" subtitle="초대 코드를 입력하거나 링크를 통해 스태프 참여를 신청할 수 있습니다." onClose={onClose}>
      <span className="sf-label">초대 코드</span>
      <div className="sf-copy">
        <strong>{STAFF_INVITE.code}</strong>
        <button type="button" className="sf-btn" onClick={() => copy('code', STAFF_INVITE.code)}>
          {copied === 'code' ? '복사됨' : '복사하기'}
        </button>
      </div>
      <span className="sf-label">초대 링크</span>
      <div className="sf-copy">
        <span>{STAFF_INVITE.url}</span>
        <button type="button" className="sf-btn" onClick={() => copy('url', `${window.location.origin}/invite/staff/${STAFF_INVITE.token}`)}>
          {copied === 'url' ? '복사됨' : '복사하기'}
        </button>
      </div>
      <p className="sf-note">
        신청한 스태프는 승인 대기 상태로 등록됩니다.
        <br />
        명단에서 내용을 확인하고 승인 또는 거부해 주세요.
      </p>
      <p className="sf-note">※ 초대 코드와 링크는 아직 서버에서 발급하지 않는 예시예요.</p>
      <div className="sf-actions is-end">
        <button type="button" className="sf-btn" onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  )
}

function DutyModal({ onClose }) {
  const [form, setForm] = useState({ name: '', zone: '', start: '14:00', end: '16:00' })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const ok = form.name.trim() && form.zone.trim() && form.start < form.end
  return (
    <Modal title="업무 추가하기" subtitle="구역과 업무를 정하고 근무 시간을 입력하세요." onClose={onClose}>
      <label className="sf-label">업무 이름</label>
      <input className="sf-input" placeholder="예: 행사 안내" value={form.name} onChange={set('name')} />
      <label className="sf-label">구역</label>
      <input className="sf-input" placeholder="예: 운영본부" value={form.zone} onChange={set('zone')} />
      <div className="sf-two">
        <div>
          <label className="sf-label">시작 시간</label>
          <select className="sf-select" value={form.start} onChange={set('start')}>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="sf-label">종료 시간</label>
          <select className="sf-select" value={form.end} onChange={set('end')}>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="sf-btn is-primary"
          disabled={!ok}
          onClick={() => {
            addDuty({ name: form.name.trim(), zone: form.zone.trim(), start: form.start, end: form.end })
            onClose()
          }}
        >
          등록하기
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- 근무표
function Schedule({ data, onAdd }) {
  const [day, setDay] = useState(SHIFT_DAYS[0])
  const [selectedId, setSelectedId] = useState(null)
  const rows = data.shifts.filter((s) => s.date === day)
  const selected = data.shifts.find((s) => s.id === selectedId) ?? rows[1] ?? rows[0] ?? null
  const dayIndex = SHIFT_DAYS.indexOf(day)

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const showNow = nowMin >= GRID_START && nowMin <= GRID_END

  return (
    <div className="sf-split">
      <section className="sf-card">
        <div className="sf-toolbar">
          <button type="button" className="sf-btn is-icon" disabled={dayIndex <= 0} onClick={() => setDay(SHIFT_DAYS[dayIndex - 1])} aria-label="이전 날짜">
            ‹
          </button>
          <select className="sf-select" value={day} onChange={(e) => setDay(e.target.value)} aria-label="날짜">
            {SHIFT_DAYS.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </select>
          <button type="button" className="sf-btn is-icon" disabled={dayIndex >= SHIFT_DAYS.length - 1} onClick={() => setDay(SHIFT_DAYS[dayIndex + 1])} aria-label="다음 날짜">
            ›
          </button>
          <span className="sf-pill is-green">행사 {dayIndex + 1}일차</span>
          <span className="sf-spacer" />
          <button type="button" className="sf-btn is-primary" onClick={onAdd}>
            시간표 배치하기
          </button>
        </div>
        <div className="sf-grid-head">
          <h2>
            {Number(day.slice(5, 7))}월 {Number(day.slice(8, 10))}일 근무표
          </h2>
          <span className="sf-pill is-green">{rows.length}개 구역 · 업무</span>
          {showNow && <span className="sf-now-label">현재 {String(Math.floor(nowMin / 60)).padStart(2, '0')}:{String(nowMin % 60).padStart(2, '0')}</span>}
        </div>
        <div className="sf-grid">
          <div className="sf-grid-row is-head">
            <div className="sf-grid-label">구역 · 업무 · 역할</div>
            <div className="sf-grid-track">
              {HOURS.map((h) => (
                <span key={h}>{String(h).padStart(2, '0')}:00</span>
              ))}
            </div>
          </div>
          {rows.map((s) => {
            const duty = data.duties.find((d) => d.id === s.dutyId)
            const people = s.memberIds.map((id) => data.members.find((x) => x.id === id)?.name).filter(Boolean)
            const left = ((Math.max(minutes(s.start), GRID_START) - GRID_START) / (GRID_END - GRID_START)) * 100
            const width = ((Math.min(minutes(s.end), GRID_END) - Math.max(minutes(s.start), GRID_START)) / (GRID_END - GRID_START)) * 100
            return (
              <div key={s.id} className="sf-grid-row">
                <div className="sf-grid-label">
                  <small>{duty?.zone}</small>
                  <strong>{duty?.name}</strong>
                  <small>{s.roles.map((r) => STAFF_ROLE_LABEL[r]).join(' · ')}</small>
                </div>
                <div className="sf-grid-track">
                  <button
                    type="button"
                    className={`sf-block${selected?.id === s.id ? ' is-selected' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <b>
                      {s.start} – {s.end}
                    </b>
                    <span>{people.length === 0 ? '배정 인원 없음' : people.length <= 2 ? people.join(' · ') : `${people[0]} 외 ${people.length - 1}명`}</span>
                  </button>
                  {showNow && <i className="sf-now" style={{ left: `${((nowMin - GRID_START) / (GRID_END - GRID_START)) * 100}%` }} />}
                </div>
              </div>
            )
          })}
          {rows.length === 0 && <p className="sf-empty">이 날짜에는 등록된 근무가 없어요. 시간표 배치하기로 추가해 보세요.</p>}
        </div>
        <small className="sf-hint">미배정 시간은 휴식으로 표시 · 현재 시각선은 10분 단위로 이동</small>
      </section>
      {selected ? <ShiftPanel key={selected.id} shift={selected} data={data} /> : <aside className="sf-card sf-empty">근무를 선택하세요.</aside>}
    </div>
  )
}

function ShiftPanel({ shift, data }) {
  const duty = data.duties.find((d) => d.id === shift.dutyId)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [chosen, setChosen] = useState(shift.memberIds)
  const [saved, setSaved] = useState(false)

  const needle = q.trim().toLowerCase()
  const list = data.members
    .filter((x) => x.status !== STAFF_STATUS.PENDING && x.status !== STAFF_STATUS.REJECTED)
    .filter((x) => (!role || x.role === role) && (!needle || x.name.toLowerCase().includes(needle) || x.phone.includes(needle)))
    .sort((a, b) => Number(chosen.includes(b.id)) - Number(chosen.includes(a.id)))
    .slice(0, 12)
  const toggle = (id) => {
    setSaved(false)
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  return (
    <aside className="sf-card">
      <h2>선택한 근무</h2>
      <h3 className="sf-duty-name">{duty?.name}</h3>
      <p className="sf-meta">
        {duty?.zone} · {shift.start} – {shift.end}
      </p>
      <p className="sf-meta">
        역할: {shift.roles.map((r) => STAFF_ROLE_LABEL[r]).join(' · ')} | 배정 {chosen.length}명
      </p>
      <input className="sf-input" placeholder="⌕ 이름 · 연락처 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="sf-select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="역할">
        <option value="">전체 역할</option>
        {Object.values(STAFF_ROLE).map((r) => (
          <option key={r} value={r}>
            {STAFF_ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <ul className="sf-pick">
        {list.map((x) => (
          <li key={x.id} className={chosen.includes(x.id) ? 'is-on' : ''}>
            <label>
              <input type="checkbox" checked={chosen.includes(x.id)} onChange={() => toggle(x.id)} />
              <span>
                <strong>{x.name}</strong>
                <em>{STAFF_ROLE_LABEL[x.role]}</em>
                <small>{x.phone}</small>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <small className="sf-hint">선택한 {chosen.length}명이 해당 근무에 배정됩니다.</small>
      <button
        type="button"
        className="sf-btn is-primary is-block"
        onClick={() => {
          setShiftMembers(shift.id, chosen)
          setSaved(true)
        }}
      >
        {saved ? '저장했어요' : '배정 저장하기'}
      </button>
    </aside>
  )
}

function ShiftModal({ data, onClose }) {
  const [mode, setMode] = useState('new')
  const [form, setForm] = useState({ date: SHIFT_DAYS[0], start: '14:00', end: '16:00', zone: '', name: '', dutyId: data.duties[0]?.id ?? '', roles: [STAFF_ROLE.STAFF, STAFF_ROLE.LABOR] })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleRole = (r) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }))
  const ok = form.start < form.end && form.roles.length > 0 && (mode === 'existing' ? form.dutyId : form.zone.trim() && form.name.trim())

  const submit = () => {
    const dutyId =
      mode === 'existing' ? form.dutyId : addDuty({ name: form.name.trim(), zone: form.zone.trim(), start: form.start, end: form.end }).id
    addShift({ date: form.date, dutyId, start: form.start, end: form.end, roles: form.roles })
    onClose()
  }

  return (
    <Modal title="시간표 배치하기" subtitle="행과 근무 시간을 정한 뒤 스태프를 배정하세요." onClose={onClose}>
      <div className="sf-seg">
        <button type="button" className={mode === 'new' ? 'is-active' : ''} onClick={() => setMode('new')}>
          새 행 추가
        </button>
        <button type="button" className={mode === 'existing' ? 'is-active' : ''} onClick={() => setMode('existing')}>
          기존 행에 시간 추가
        </button>
      </div>
      <label className="sf-label">날짜</label>
      <select className="sf-select" value={form.date} onChange={set('date')}>
        {SHIFT_DAYS.map((d) => (
          <option key={d} value={d}>
            {dayLabel(d)}
          </option>
        ))}
      </select>
      <div className="sf-two">
        <div>
          <label className="sf-label">시작 시간</label>
          <select className="sf-select" value={form.start} onChange={set('start')}>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="sf-label">종료 시간</label>
          <select className="sf-select" value={form.end} onChange={set('end')}>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      {mode === 'new' ? (
        <>
          <label className="sf-label">구역</label>
          <input className="sf-input" placeholder="운영본부" value={form.zone} onChange={set('zone')} />
          <label className="sf-label">업무</label>
          <input className="sf-input" placeholder="행사 안내" value={form.name} onChange={set('name')} />
        </>
      ) : (
        <>
          <label className="sf-label">기존 행 (구역 · 업무)</label>
          <select className="sf-select" value={form.dutyId} onChange={set('dutyId')}>
            {data.duties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.zone} · {d.name}
              </option>
            ))}
          </select>
        </>
      )}
      <label className="sf-label">역할 · 복수 선택</label>
      <div className="sf-checks">
        {Object.values(STAFF_ROLE).map((r) => (
          <label key={r}>
            <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />
            {STAFF_ROLE_LABEL[r]}
          </label>
        ))}
      </div>
      <p className="sf-note">기존 행을 선택하면 구역 · 업무 · 역할을 그대로 사용합니다.</p>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button type="button" className="sf-btn is-primary" disabled={!ok} onClick={submit}>
          등록하기
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- 실시간 현황
function Live({ data }) {
  const [zone, setZone] = useState('')
  const [dutyId, setDutyId] = useState('')
  const [detailDuty, setDetailDuty] = useState(null)
  const [assignFor, setAssignFor] = useState(null)
  const [openGroup, setOpenGroup] = useState(null)

  const active = data.members.filter((x) => x.status !== STAFF_STATUS.PENDING && x.status !== STAFF_STATUS.REJECTED)
  const counts = countBy(active, 'status')
  const zones = useMemo(() => [...new Set(data.duties.map((d) => d.zone))], [data.duties])
  const duties = data.duties.filter((d) => (!zone || d.zone === zone) && (!dutyId || d.id === dutyId))
  const groups = [STAFF_STATUS.BREAK, STAFF_STATUS.ABSENT, STAFF_STATUS.WAITING].map((s) => ({
    status: s,
    people: active.filter((x) => x.status === s),
  }))

  return (
    <>
      <div className="sf-stats is-four">
        <Stat label="근무 중" value={`${counts.WORKING ?? 0}명`} tone="is-working" />
        <Stat label="휴식 중" value={`${counts.BREAK ?? 0}명`} tone="is-break" />
        <Stat label="미출근" value={`${counts.ABSENT ?? 0}명`} tone="is-absent" />
        <Stat label="대기 중" value={`${counts.WAITING ?? 0}명`} />
      </div>
      <div className="sf-split">
        <div>
          <div className="sf-toolbar">
            <select className="sf-select" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="구역">
              <option value="">전체 구역</option>
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
            <select className="sf-select" value={dutyId} onChange={(e) => setDutyId(e.target.value)} aria-label="업무">
              <option value="">전체 업무</option>
              {data.duties.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="sf-spacer" />
            <span className="sf-live">● 실시간 {nowLabel()} 기준</span>
          </div>
          <div className="sf-duties">
            {duties.map((d) => {
              const people = membersOfDuty(data, d.id).filter((x) => x.status === STAFF_STATUS.WORKING)
              return (
                <section key={d.id} className="sf-card sf-duty">
                  <div className="sf-card-head">
                    <h2>{d.name}</h2>
                    <span className="sf-pill is-green">{people.length}명</span>
                  </div>
                  <p className="sf-meta">
                    {d.zone} · {d.start} – {d.end}
                  </p>
                  {people.slice(0, 2).map((x) => (
                    <div key={x.id} className="sf-person">
                      <strong>{x.name}</strong>
                      <em>{STAFF_ROLE_LABEL[x.role]}</em>
                      <small>{x.phone}</small>
                    </div>
                  ))}
                  {people.length === 0 && <p className="sf-empty">근무 중인 인원이 없어요.</p>}
                  <button type="button" className="sf-btn is-block" onClick={() => setDetailDuty(d)}>
                    전체 {people.length}명 상세 보기
                  </button>
                </section>
              )
            })}
          </div>
          <div className="sf-foot">
            <span className="sf-pager">
              <button type="button" disabled aria-label="이전">
                ‹
              </button>
              <button type="button" className="is-active">
                1
              </button>
              <button type="button" disabled aria-label="다음">
                ›
              </button>
            </span>
            <small>업무가 늘어나면 6개씩 다음 페이지에서 확인합니다.</small>
          </div>
          <small className="sf-hint">근무표의 시간대가 되면 업무와 카드 배정이 자동으로 반영됩니다.</small>
        </div>

        <aside className="sf-card">
          <h2>미배정 인원</h2>
          <p className="sf-meta">휴식 · 미출근 · 대기 인원을 확인합니다.</p>
          {groups.map(({ status, people }) => (
            <div key={status} className="sf-group">
              <div className="sf-group-head">
                <strong>{STAFF_STATUS_LABEL[status]}</strong>
                <span className={`sf-pill ${statusTone(status)}`}>{people.length}명</span>
              </div>
              {(openGroup === status ? people : people.slice(0, 2)).map((x) => (
                <div key={x.id} className="sf-unassigned">
                  <span>
                    <strong>{x.name}</strong> <em>{STAFF_ROLE_LABEL[x.role]}</em>
                    <small>{x.phone}</small>
                  </span>
                  <button type="button" className="sf-btn is-sm" onClick={() => setAssignFor(x)}>
                    할당하기
                  </button>
                </div>
              ))}
              {people.length > 2 && (
                <button type="button" className="sf-link" onClick={() => setOpenGroup(openGroup === status ? null : status)}>
                  {openGroup === status ? '접기' : `전체 ${people.length}명 보기`} ›
                </button>
              )}
            </div>
          ))}
        </aside>
      </div>
      {detailDuty && <DutyDetailModal duty={detailDuty} data={data} onClose={() => setDetailDuty(null)} />}
      {assignFor && <AssignModal member={assignFor} data={data} onClose={() => setAssignFor(null)} />}
    </>
  )
}

function DutyDetailModal({ duty, data, onClose }) {
  const [q, setQ] = useState('')
  const people = membersOfDuty(data, duty.id).filter((x) => x.status === STAFF_STATUS.WORKING)
  const needle = q.trim().toLowerCase()
  const shown = people.filter((x) => !needle || x.name.toLowerCase().includes(needle) || x.phone.includes(needle))
  return (
    <Modal title={`${duty.name} · 배정 인원`} subtitle={`${duty.zone} · ${duty.start} – ${duty.end} · 근무 중 ${people.length}명`} onClose={onClose}>
      <input className="sf-input" placeholder="⌕ 이름 · 연락처 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="sf-table is-plain">
        <thead>
          <tr>
            <th>이름</th>
            <th>역할</th>
            <th>연락처</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((x) => (
            <tr key={x.id}>
              <td>
                <strong>{x.name}</strong>
              </td>
              <td>{STAFF_ROLE_LABEL[x.role]}</td>
              <td>{x.phone}</td>
              <td>
                <span className={`sf-pill ${statusTone(x.status)}`}>{STAFF_STATUS_LABEL[x.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="sf-btn is-primary is-block" onClick={onClose}>
        확인
      </button>
    </Modal>
  )
}

function AssignModal({ member, data, onClose }) {
  const [dutyId, setDutyId] = useState(data.duties[0]?.id ?? '')
  return (
    <Modal title="업무 할당" onClose={onClose}>
      <div className="sf-who">
        <strong>{member.name}</strong>
        <em>{STAFF_ROLE_LABEL[member.role]}</em>
        <span className={`sf-pill ${statusTone(member.status)}`}>{STAFF_STATUS_LABEL[member.status]}</span>
        <small>{member.phone}</small>
      </div>
      <p className="sf-label">배정할 업무를 선택하세요.</p>
      <small className="sf-hint">근무표에 등록한 구역 · 업무가 표시됩니다.</small>
      <ul className="sf-radio">
        {data.duties.map((d) => (
          <li key={d.id} className={dutyId === d.id ? 'is-on' : ''}>
            <label>
              <input type="radio" name="duty" checked={dutyId === d.id} onChange={() => setDutyId(d.id)} />
              <strong>{d.name}</strong>
              <small>
                {d.zone} · {membersOfDuty(data, d.id).length}명 배정
              </small>
            </label>
          </li>
        ))}
      </ul>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="sf-btn is-primary"
          disabled={!dutyId}
          onClick={() => {
            assignDuty(member.id, dutyId)
            onClose()
          }}
        >
          할당 확인
        </button>
      </div>
    </Modal>
  )
}
