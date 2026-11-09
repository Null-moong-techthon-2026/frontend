import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createDuty,
  createShift,
  decideStaffMember,
  getStaffInvitation,
  issueStaffInvitation,
  listDuties,
  listShifts,
  listStaffAttendance,
  listStaff,
  replaceShiftMembers,
  updateShift,
  deleteShift,
  revokeStaffInvitation,
  updateStaffMember,
} from '../api/staffApi'
import OrganizerLayout from '../components/OrganizerLayout'
import Toast from '../components/Toast'
import { apiErrorMessage } from '../constants/errors'
import { useEvent } from '../context/useEvent'
import { STAFF_ROLE, STAFF_ROLE_LABEL, STAFF_STATUS, STAFF_STATUS_LABEL, countBy } from '../dummy/staffStore'
import { eventDays, todayYmd } from '../utils/eventDays'
import { useAsync } from '../utils/useAsync'
import { useToast } from '../utils/useToast'
import './staff.css'

const TABS = [
  ['roster', '명단', '행사에 함께할 인원을 초대하고 역할과 업무를 관리하세요.'],
  ['schedule', '근무표', '날짜별 근무를 배치하고, 시간표를 선택해 스태프를 할당하세요.'],
  ['attendance', '출퇴근표', '근무표에 배정한 시간과, 스태프가 앱에서 누른 출근·퇴근 상태를 나란히 비교하세요.'],
  ['live', '실시간 현황', '근무표에 맞춰 바뀌는 현황을 확인하고, 현장에서 인원을 재배정하세요.'],
]
const PAGE_SIZE = 6
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const HOURS = Array.from({ length: 10 }, (_, i) => 11 + i) // 11:00 ... 20:00 columns
const GRID_START = 11 * 60
const GRID_END = 21 * 60
const TIMES = Array.from({ length: 24 }, (_, i) => `${String(11 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const LIVE_REFRESH_MS = 30000

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
// The statuses an organizer may pick for this person: 대기 / 미출근, plus the one the person is in.
// 근무 중 comes from the person's own 출근 button (the server refuses it otherwise), and the 휴식
// status is not used: working time is simply what the 출근 / 퇴근 buttons record.
const statusChoices = (member) =>
  Object.values(STAFF_STATUS).filter(
    (s) => s !== STAFF_STATUS.REJECTED && (s === member.status || s === STAFF_STATUS.WAITING || s === STAFF_STATUS.ABSENT),
  )
const active = (members) => members.filter((x) => x.status !== STAFF_STATUS.PENDING && x.status !== STAFF_STATUS.REJECTED)

// 스태프 (organizer, web): 명단 / 근무표 / 실시간 현황 + their popups. Data: api/staffApi.js.
export default function OrganizerStaffPage() {
  const { event } = useEvent()
  const { toast, notify } = useToast()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t[0] === params.get('tab')) ? params.get('tab') : 'roster'
  const setTab = (key) => setParams(key === 'roster' ? {} : { tab: key }, { replace: true })
  const [modal, setModal] = useState(null) // 'invite' | 'duty' | 'shift'
  const [scheduleVersion, setScheduleVersion] = useState(0) // bumped to load the 근무표 again

  const { data: board, error, reload } = useAsync(async () => {
    const [staff, duties] = await Promise.all([listStaff(event.id), listDuties(event.id)])
    return { members: staff.members, summary: staff.summary, duties }
  }, [event.id])

  // The live tab follows the field: it asks again every half minute.
  useEffect(() => {
    if (tab !== 'live' && tab !== 'attendance' && tab !== 'roster') return undefined
    const timer = setInterval(reload, LIVE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [tab, reload])

  // Runs a write call, then loads the page's data again; says so when the server refuses.
  const act = async (call, doneMessage) => {
    try {
      const result = await call()
      await reload()
      if (doneMessage) notify(doneMessage)
      return result ?? true
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      return false
    }
  }
  const actions = {
    updateMember: (member, fields) => act(() => updateStaffMember(event.id, member, fields)),
    decide: (member, decision) => act(() => decideStaffMember(event.id, member, decision), decision === 'APPROVED' ? '승인했어요.' : '거부했어요.'),
    // Only the duty: "근무 중" / "휴식" come from the person's own clock-in (the server refuses them otherwise).
    assignDuty: (member, dutyId) => act(() => updateStaffMember(event.id, member, { dutyId }), '업무를 배정했어요. 출근하면 근무 중으로 표시돼요.'),
    refresh: () => act(async () => {}, '명단을 새로 불러왔어요.'),
    addDuty: (fields) => act(() => createDuty(event.id, fields), '업무를 추가했어요.'),
  }

  const current = TABS.find((t) => t[0] === tab)
  const waiting = board ? board.members.filter((m) => m.status === STAFF_STATUS.PENDING).length : 0

  return (
    <OrganizerLayout
      active="staff"
      crumb="스태프"
      title="스태프"
      subtitle={current[2]}
      actions={
        tab === 'roster' ? (
          <>
            <button type="button" className="om-btn om-btn-outline" onClick={() => setModal('duty')}>
              업무 추가하기
            </button>
            <button type="button" className="om-btn om-btn-primary" onClick={() => setModal('invite')}>
              스태프 초대
            </button>
          </>
        ) : null
      }
    >
      <div className="sf">
        <div className="sf-tabs" role="tablist">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
              {label}
              {key === 'roster' && waiting > 0 && <span className="sf-tab-badge">{waiting}</span>}
            </button>
          ))}
        </div>
        {!board ? (
          <p className="sf-empty">
            {error ? (
              <>
                {apiErrorMessage(error)}{' '}
                <button type="button" className="sf-link" onClick={reload}>
                  다시 시도
                </button>
              </>
            ) : (
              '불러오는 중…'
            )}
          </p>
        ) : (
          <>
            {tab === 'roster' && <Roster board={board} actions={actions} />}
            {tab === 'schedule' && <Schedule key={scheduleVersion} board={board} event={event} onAdd={() => setModal('shift')} notify={notify} />}
            {tab === 'attendance' && <Attendance board={board} event={event} />}
            {tab === 'live' && <Live board={board} actions={actions} />}
          </>
        )}
      </div>
      {modal === 'invite' && <InviteModal eventId={event.id} onClose={() => setModal(null)} />}
      {modal === 'duty' && <DutyModal actions={actions} onClose={() => setModal(null)} />}
      {modal === 'shift' && board && (
        <ShiftModal
          board={board}
          event={event}
          onClose={() => setModal(null)}
          onCreated={() => {
            setScheduleVersion((v) => v + 1)
            reload()
          }}
          notify={notify}
        />
      )}
      <Toast toast={toast} />
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
function Roster({ board, actions }) {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)

  // People waiting for approval come first: a new application must not hide on a later page.
  const people = board.members
    .filter((x) => x.status !== STAFF_STATUS.REJECTED)
    .sort((a, b) => Number(b.status === STAFF_STATUS.PENDING) - Number(a.status === STAFF_STATUS.PENDING))
  const roles = countBy(people, 'role')
  const pending = people.filter((x) => x.status === STAFF_STATUS.PENDING).length
  const needle = q.trim().toLowerCase()
  const filtered = people.filter(
    (x) => (!role || x.role === role) && (!status || x.status === status) && (!needle || x.name.toLowerCase().includes(needle) || x.phone.includes(needle)),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const selected = board.members.find((x) => x.id === selectedId) ?? people[0]
  const dutyName = (id) => board.duties.find((d) => d.id === id)?.name

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
              <button type="button" className="sf-btn is-sm" onClick={() => actions.refresh()}>
                새로고침
              </button>
            </span>
          </div>
          {pending > 0 && (
            <div className="sf-callout">
              <span>
                승인을 기다리는 신청이 <b>{pending}명</b> 있어요. 명단 맨 위에 보여요.
              </span>
              <button type="button" className="sf-btn is-sm" onClick={() => { setStatus(STAFF_STATUS.PENDING); setPage(0) }}>
                대기 중만 보기
              </button>
            </div>
          )}
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
                <tr key={x.id} className={x.id === selected?.id ? 'is-selected' : ''}>
                  <td>
                    <strong>{x.name}</strong>
                  </td>
                  <td>
                    <select className="sf-cell-select" value={x.role} onChange={(e) => actions.updateMember(x, { role: e.target.value })} aria-label={`${x.name} 역할`}>
                      {Object.values(STAFF_ROLE).map((r) => (
                        <option key={r} value={r}>
                          {STAFF_ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select className="sf-cell-select" value={x.dutyId ?? ''} onChange={(e) => actions.updateMember(x, { dutyId: e.target.value || null })} aria-label={`${x.name} 업무`}>
                      <option value="">미할당</option>
                      {board.duties.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{x.phone}</td>
                  <td>
                    <select className={`sf-chip-select ${statusTone(x.status)}`} value={x.status} onChange={(e) => actions.updateMember(x, { status: e.target.value })} aria-label={`${x.name} 상태`}>
                      {statusChoices(x).map((s) => (
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
                    {people.length === 0 ? '아직 스태프가 없어요. 스태프 초대로 초대 코드를 보내 보세요.' : '조건에 맞는 인원이 없어요.'}
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
        {selected ? (
          <Detail key={`${selected.id}:${selected.revision}`} member={selected} dutyName={dutyName(selected.dutyId)} board={board} actions={actions} />
        ) : (
          <aside className="sf-card sf-empty">
            아직 스태프가 없어요.
            <br />
            '스태프 초대'로 초대 코드를 보내 보세요.
          </aside>
        )}
      </div>
    </>
  )
}

function Detail({ member, dutyName, board, actions }) {
  const [memo, setMemo] = useState(member.memo)
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
        <dd>{member.email || '-'}</dd>
        <dt>소속</dt>
        <dd>{member.affiliation || '-'}</dd>
        <dt>역할</dt>
        <dd>
          <select className="sf-select" value={member.role} onChange={(e) => actions.updateMember(member, { role: e.target.value })}>
            {Object.values(STAFF_ROLE).map((r) => (
              <option key={r} value={r}>
                {STAFF_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </dd>
        <dt>업무</dt>
        <dd>
          <select className="sf-select" value={member.dutyId ?? ''} onChange={(e) => actions.updateMember(member, { dutyId: e.target.value || null })}>
            <option value="">미할당</option>
            {board.duties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </dd>
        <dt>상태</dt>
        <dd>
          <select className={`sf-select ${statusTone(member.status)}`} value={member.status} onChange={(e) => actions.updateMember(member, { status: e.target.value })}>
            {statusChoices(member).map((s) => (
              <option key={s} value={s}>
                {STAFF_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </dd>
      </dl>
      <h3 className="sf-h3">배정 · 근무 요약</h3>
      <dl className="sf-kv">
        <dt>업무</dt>
        <dd>{dutyName ?? '미배정'}</dd>
        <dt>부스 할당</dt>
        <dd>미할당</dd>
      </dl>
      <h3 className="sf-h3">주최측 참고 메모</h3>
      <small className="sf-hint">주최측 계정만 열람할 수 있습니다.</small>
      <textarea className="sf-textarea" placeholder="운영 참고 사항을 적어 두세요." value={memo} onChange={(e) => setMemo(e.target.value)} onBlur={() => memo !== member.memo && actions.updateMember(member, { memo })} />
      <div className="sf-actions">
        <button type="button" className="sf-btn is-danger" disabled={!pending} onClick={() => actions.decide(member, 'REJECTED')}>
          거부
        </button>
        <button type="button" className="sf-btn is-primary" disabled={!pending} onClick={() => actions.decide(member, 'APPROVED')}>
          승인
        </button>
      </div>
    </aside>
  )
}

function InviteModal({ eventId, onClose }) {
  const { data: invitation, loading, error, reload } = useAsync(() => getStaffInvitation(eventId), [eventId])
  const [copied, setCopied] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // The clipboard can be blocked; the confirmation still shows.
    }
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }
  const change = async (call, ask) => {
    if (busy || (ask && !window.confirm(ask))) return
    setBusy(true)
    setMessage('')
    try {
      await call()
      reload()
    } catch (err) {
      setMessage(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="스태프 초대" subtitle="초대 코드를 입력하거나 링크를 통해 스태프 참여를 신청할 수 있습니다." onClose={onClose}>
      {loading && !invitation ? (
        <p className="sf-empty">불러오는 중…</p>
      ) : error ? (
        <p className="sf-empty">{apiErrorMessage(error)}</p>
      ) : !invitation ? (
        <>
          <p className="sf-note">아직 발급한 초대가 없어요. 발급하면 코드와 링크를 스태프에게 보낼 수 있어요.</p>
          <div className="sf-actions is-end">
            <button type="button" className="sf-btn is-primary" disabled={busy} onClick={() => change(() => issueStaffInvitation(eventId))}>
              초대 코드 발급
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="sf-label">초대 코드</span>
          <div className="sf-copy">
            <strong>{invitation.code}</strong>
            <button type="button" className="sf-btn" onClick={() => copy('code', invitation.code)}>
              {copied === 'code' ? '복사됨' : '복사하기'}
            </button>
          </div>
          <span className="sf-label">초대 링크</span>
          <div className="sf-copy">
            <span>{(invitation.inviteUrl ?? '').replace(/^https?:\/\//, '')}</span>
            <button type="button" className="sf-btn" onClick={() => copy('url', invitation.inviteUrl)}>
              {copied === 'url' ? '복사됨' : '복사하기'}
            </button>
          </div>
          <p className="sf-note">
            신청한 스태프는 승인 대기 상태로 등록됩니다.
            <br />
            명단에서 내용을 확인하고 승인 또는 거부해 주세요.
          </p>
          <div className="sf-actions">
            <button type="button" className="sf-btn" disabled={busy} onClick={() => change(() => issueStaffInvitation(eventId), '새로 발급하면 이전 코드와 링크는 쓸 수 없게 돼요. 발급할까요?')}>
              다시 발급
            </button>
            <button type="button" className="sf-btn is-danger" disabled={busy} onClick={() => change(() => revokeStaffInvitation(eventId), '초대를 종료하면 지금의 코드와 링크를 쓸 수 없게 돼요. 종료할까요?')}>
              초대 종료
            </button>
          </div>
        </>
      )}
      {message && <p className="sf-note" role="alert">{message}</p>}
      <div className="sf-actions is-end">
        <button type="button" className="sf-btn" onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  )
}

function DutyModal({ actions, onClose }) {
  const [form, setForm] = useState({ name: '', zone: '' })
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const ok = form.name.trim() && form.zone.trim()
  return (
    <Modal title="업무 추가하기" subtitle="구역과 업무 이름을 입력하세요. 근무 시간은 근무표에서 정해요." onClose={onClose}>
      <label className="sf-label">업무 이름</label>
      <input className="sf-input" placeholder="예: 행사 안내" value={form.name} onChange={set('name')} maxLength={100} />
      <label className="sf-label">구역</label>
      <input className="sf-input" placeholder="예: 운영본부" value={form.zone} onChange={set('zone')} maxLength={100} />
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="sf-btn is-primary"
          disabled={!ok || busy}
          onClick={async () => {
            setBusy(true)
            if (await actions.addDuty({ name: form.name.trim(), zone: form.zone.trim() })) onClose()
            else setBusy(false)
          }}
        >
          등록하기
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- 근무표
function Schedule({ board, event, onAdd, notify }) {
  const days = useMemo(() => eventDays(event), [event])
  const [day, setDay] = useState(days[0])
  const [selectedId, setSelectedId] = useState(null)
  const { data: rows, error, reload } = useAsync(() => listShifts(event.id, day), [event.id, day])
  const shifts = rows ?? []
  const selected = shifts.find((s) => s.id === selectedId) ?? shifts[0] ?? null
  const dayIndex = days.indexOf(day)

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const showNow = nowMin >= GRID_START && nowMin <= GRID_END
  const dutyOf = (id) => board.duties.find((d) => d.id === id)
  const nameOf = (id) => board.members.find((x) => x.id === id)?.name

  return (
    <div className="sf-split">
      <section className="sf-card">
        <div className="sf-toolbar">
          <button type="button" className="sf-btn is-icon" disabled={dayIndex <= 0} onClick={() => setDay(days[dayIndex - 1])} aria-label="이전 날짜">
            ‹
          </button>
          <select className="sf-select" value={day} onChange={(e) => setDay(e.target.value)} aria-label="날짜">
            {days.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </select>
          <button type="button" className="sf-btn is-icon" disabled={dayIndex >= days.length - 1} onClick={() => setDay(days[dayIndex + 1])} aria-label="다음 날짜">
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
          <span className="sf-pill is-green">{shifts.length}개 구역 · 업무</span>
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
          {shifts.map((s) => {
            const duty = dutyOf(s.dutyId)
            const people = s.memberIds.map(nameOf).filter(Boolean)
            const left = ((Math.max(minutes(s.start), GRID_START) - GRID_START) / (GRID_END - GRID_START)) * 100
            const width = ((Math.min(minutes(s.end), GRID_END) - Math.max(minutes(s.start), GRID_START)) / (GRID_END - GRID_START)) * 100
            return (
              <div key={s.id} className="sf-grid-row">
                <div className="sf-grid-label">
                  <small>{duty?.zone}</small>
                  <strong>{duty?.name}</strong>
                  <small>{s.roles.map((r) => STAFF_ROLE_LABEL[r] ?? r).join(' · ')}</small>
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
          {!rows && <p className="sf-empty">{error ? apiErrorMessage(error) : '불러오는 중…'}</p>}
          {rows && shifts.length === 0 && <p className="sf-empty">이 날짜에는 등록된 근무가 없어요. 시간표 배치하기로 추가해 보세요.</p>}
        </div>
        <small className="sf-hint">미배정 시간은 휴식으로 표시 · 현재 시각선은 10분 단위로 이동</small>
      </section>
      {selected ? (
        <ShiftPanel key={`${selected.id}:${selected.revision}`} shift={selected} board={board} event={event} onSaved={reload} notify={notify} />
      ) : (
        <aside className="sf-card sf-empty">근무를 선택하세요.</aside>
      )}
    </div>
  )
}

function ShiftPanel({ shift, board, event, onSaved, notify }) {
  const eventId = event.id
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const duty = board.duties.find((d) => d.id === shift.dutyId)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [chosen, setChosen] = useState(shift.memberIds)
  const [busy, setBusy] = useState(false)

  const needle = q.trim().toLowerCase()
  const list = active(board.members)
    .filter((x) => (!role || x.role === role) && (!needle || x.name.toLowerCase().includes(needle) || x.phone.includes(needle)))
    .sort((a, b) => Number(chosen.includes(b.id)) - Number(chosen.includes(a.id)))
    .slice(0, 12)
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))

  const save = async () => {
    setBusy(true)
    try {
      await replaceShiftMembers(eventId, shift, chosen)
      notify('배정을 저장했어요.')
      onSaved()
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setBusy(false)
    }
  }

  return (
    <aside className="sf-card">
      <h2>선택한 근무</h2>
      <h3 className="sf-duty-name">{duty?.name}</h3>
      <p className="sf-meta">
        {duty?.zone} · {shift.start} – {shift.end}
      </p>
      <p className="sf-meta">
        역할: {shift.roles.map((r) => STAFF_ROLE_LABEL[r] ?? r).join(' · ')} | 배정 {chosen.length}명
      </p>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={() => setEditing(true)}>
          시간 · 역할 변경
        </button>
        <button type="button" className="sf-btn is-danger" onClick={() => setRemoving(true)}>
          근무 삭제
        </button>
      </div>
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
        {list.length === 0 && <li className="sf-empty">배정할 수 있는 스태프가 없어요.</li>}
      </ul>
      <small className="sf-hint">선택한 {chosen.length}명이 해당 근무에 배정됩니다.</small>
      <button type="button" className="sf-btn is-primary is-block" disabled={busy} onClick={save}>
        배정 저장하기
      </button>
      {editing && <ShiftEditModal shift={shift} event={event} duty={duty} onClose={() => setEditing(false)} onSaved={onSaved} notify={notify} />}
      {removing && <ShiftRemoveModal shift={shift} duty={duty} eventId={eventId} onClose={() => setRemoving(false)} onSaved={onSaved} notify={notify} />}
    </aside>
  )
}

// Change the day, hours or roles of a shift that has not started yet.
function ShiftEditModal({ shift, event, duty, onClose, onSaved, notify }) {
  const days = useMemo(() => eventDays(event), [event])
  const [form, setForm] = useState({ date: shift.date, start: shift.start, end: shift.end, roles: shift.roles })
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleRole = (r) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }))
  const times = TIMES.includes(form.start) && TIMES.includes(form.end) ? TIMES : [...new Set([...TIMES, form.start, form.end])].sort()
  const ok = form.start < form.end && form.roles.length > 0

  const submit = async () => {
    setBusy(true)
    try {
      await updateShift(event.id, shift, form)
      notify('근무 시간을 바꿨어요.')
      onSaved()
      onClose()
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setBusy(false)
    }
  }

  return (
    <Modal title="근무 시간 변경" subtitle={`${duty?.zone ?? ''} · ${duty?.name ?? ''} (배정한 인원은 그대로 유지돼요. 시작 전 근무만 바꿀 수 있어요.)`} onClose={onClose}>
      <label className="sf-label">날짜</label>
      <select className="sf-select" value={form.date} onChange={set('date')}>
        {days.map((d) => (
          <option key={d} value={d}>
            {dayLabel(d)}
          </option>
        ))}
      </select>
      <div className="sf-two">
        <div>
          <label className="sf-label">시작 시간</label>
          <select className="sf-select" value={form.start} onChange={set('start')}>
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="sf-label">종료 시간</label>
          <select className="sf-select" value={form.end} onChange={set('end')}>
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="sf-label">역할 · 복수 선택</label>
      <div className="sf-checks">
        {Object.values(STAFF_ROLE).map((r) => (
          <label key={r}>
            <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />
            {STAFF_ROLE_LABEL[r]}
          </label>
        ))}
      </div>
      {form.start >= form.end && <p className="sf-note">종료 시간은 시작 시간보다 늦어야 해요.</p>}
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button type="button" className="sf-btn is-primary" disabled={!ok || busy} onClick={submit}>
          변경 저장
        </button>
      </div>
    </Modal>
  )
}

function ShiftRemoveModal({ shift, duty, eventId, onClose, onSaved, notify }) {
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await deleteShift(eventId, shift)
      notify('근무를 삭제했어요.')
      onSaved()
      onClose()
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setBusy(false)
    }
  }
  return (
    <Modal title="근무 삭제" subtitle={`${duty?.name ?? ''} ${shift.start} – ${shift.end} 근무와 그 배정이 사라져요. 이미 시작한 근무는 지울 수 없어요.`} onClose={onClose}>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button type="button" className="sf-btn is-danger" disabled={busy} onClick={submit}>
          삭제하기
        </button>
      </div>
    </Modal>
  )
}

function ShiftModal({ board, event, onClose, onCreated, notify }) {
  const days = useMemo(() => eventDays(event), [event])
  const [mode, setMode] = useState('new')
  const [form, setForm] = useState({ date: days[0], start: '14:00', end: '16:00', zone: '', name: '', dutyId: board.duties[0]?.id ?? '', roles: [STAFF_ROLE.STAFF, STAFF_ROLE.LABOR] })
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleRole = (r) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }))
  const ok = form.start < form.end && form.roles.length > 0 && (mode === 'existing' ? form.dutyId : form.zone.trim() && form.name.trim())

  const submit = async () => {
    setBusy(true)
    try {
      const dutyId = mode === 'existing' ? form.dutyId : (await createDuty(event.id, { zone: form.zone.trim(), name: form.name.trim() })).id
      await createShift(event.id, { date: form.date, dutyId, start: form.start, end: form.end, roles: form.roles })
      notify('근무를 등록했어요.')
      onCreated()
      onClose()
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setBusy(false)
    }
  }

  return (
    <Modal title="시간표 배치하기" subtitle="행과 근무 시간을 정한 뒤 스태프를 배정하세요." onClose={onClose}>
      <div className="sf-seg">
        <button type="button" className={mode === 'new' ? 'is-active' : ''} onClick={() => setMode('new')}>
          새 행 추가
        </button>
        <button type="button" className={mode === 'existing' ? 'is-active' : ''} disabled={board.duties.length === 0} onClick={() => setMode('existing')}>
          기존 행에 시간 추가
        </button>
      </div>
      <label className="sf-label">날짜</label>
      <select className="sf-select" value={form.date} onChange={set('date')}>
        {days.map((d) => (
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
            {board.duties.map((d) => (
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
      <p className="sf-note">기존 행을 선택하면 구역 · 업무를 그대로 사용합니다.</p>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button type="button" className="sf-btn is-primary" disabled={!ok || busy} onClick={submit}>
          등록하기
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- 실시간 현황
function Live({ board, actions }) {
  const [zone, setZone] = useState('')
  const [dutyId, setDutyId] = useState('')
  const [detailDuty, setDetailDuty] = useState(null)
  const [assignFor, setAssignFor] = useState(null)
  const [openGroup, setOpenGroup] = useState(null)

  const people = active(board.members)
  const counts = countBy(people, 'status')
  const zones = useMemo(() => [...new Set(board.duties.map((d) => d.zone))], [board.duties])
  const duties = board.duties.filter((d) => (!zone || d.zone === zone) && (!dutyId || d.id === dutyId))
  const working = (id) => people.filter((x) => x.dutyId === id && x.status === STAFF_STATUS.WORKING)
  const groups = [STAFF_STATUS.BREAK, STAFF_STATUS.ABSENT, STAFF_STATUS.WAITING].map((s) => ({
    status: s,
    people: people.filter((x) => x.status === s),
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
              {board.duties.map((d) => (
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
              const here = working(d.id)
              return (
                <section key={d.id} className="sf-card sf-duty">
                  <div className="sf-card-head">
                    <h2>{d.name}</h2>
                    <span className="sf-pill is-green">{here.length}명</span>
                  </div>
                  <p className="sf-meta">{d.zone}</p>
                  {here.slice(0, 2).map((x) => (
                    <div key={x.id} className="sf-person">
                      <strong>{x.name}</strong>
                      <em>{STAFF_ROLE_LABEL[x.role]}</em>
                      <small>{x.phone}</small>
                    </div>
                  ))}
                  {here.length === 0 && <p className="sf-empty">근무 중인 인원이 없어요.</p>}
                  <button type="button" className="sf-btn is-block" onClick={() => setDetailDuty(d)}>
                    전체 {here.length}명 상세 보기
                  </button>
                </section>
              )
            })}
            {duties.length === 0 && <p className="sf-empty">등록된 업무가 없어요. 명단에서 업무를 추가해 주세요.</p>}
          </div>
          <small className="sf-hint">30초마다 자동으로 새로 불러와요.</small>
        </div>

        <aside className="sf-card">
          <h2>미배정 인원</h2>
          <p className="sf-meta">휴식 · 미출근 · 대기 인원을 확인합니다.</p>
          {groups.map(({ status, people: list }) => (
            <div key={status} className="sf-group">
              <div className="sf-group-head">
                <strong>{STAFF_STATUS_LABEL[status]}</strong>
                <span className={`sf-pill ${statusTone(status)}`}>{list.length}명</span>
              </div>
              {(openGroup === status ? list : list.slice(0, 2)).map((x) => (
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
              {list.length > 2 && (
                <button type="button" className="sf-link" onClick={() => setOpenGroup(openGroup === status ? null : status)}>
                  {openGroup === status ? '접기' : `전체 ${list.length}명 보기`} ›
                </button>
              )}
            </div>
          ))}
        </aside>
      </div>
      {detailDuty && <DutyDetailModal duty={detailDuty} people={working(detailDuty.id)} onClose={() => setDetailDuty(null)} />}
      {assignFor && <AssignModal member={assignFor} board={board} actions={actions} onClose={() => setAssignFor(null)} />}
    </>
  )
}

function DutyDetailModal({ duty, people, onClose }) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const shown = people.filter((x) => !needle || x.name.toLowerCase().includes(needle) || x.phone.includes(needle))
  return (
    <Modal title={`${duty.name} · 배정 인원`} subtitle={`${duty.zone} · 근무 중 ${people.length}명`} onClose={onClose}>
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

function AssignModal({ member, board, actions, onClose }) {
  const [dutyId, setDutyId] = useState(board.duties[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const countOf = (id) => active(board.members).filter((x) => x.dutyId === id).length
  return (
    <Modal title="업무 할당" onClose={onClose}>
      <div className="sf-who">
        <strong>{member.name}</strong>
        <em>{STAFF_ROLE_LABEL[member.role]}</em>
        <span className={`sf-pill ${statusTone(member.status)}`}>{STAFF_STATUS_LABEL[member.status]}</span>
        <small>{member.phone}</small>
      </div>
      <p className="sf-label">배정할 업무를 선택하세요.</p>
      <small className="sf-hint">등록한 구역 · 업무가 표시됩니다.</small>
      <ul className="sf-radio">
        {board.duties.map((d) => (
          <li key={d.id} className={dutyId === d.id ? 'is-on' : ''}>
            <label>
              <input type="radio" name="duty" checked={dutyId === d.id} onChange={() => setDutyId(d.id)} />
              <strong>{d.name}</strong>
              <small>
                {d.zone} · {countOf(d.id)}명 배정
              </small>
            </label>
          </li>
        ))}
        {board.duties.length === 0 && <li className="sf-empty">먼저 명단에서 업무를 추가해 주세요.</li>}
      </ul>
      <div className="sf-actions">
        <button type="button" className="sf-btn" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="sf-btn is-primary"
          disabled={!dutyId || busy}
          onClick={async () => {
            setBusy(true)
            if (await actions.assignDuty(member, dutyId)) onClose()
            else setBusy(false)
          }}
        >
          할당 확인
        </button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------- 출퇴근표
// The 근무표 is what the organizer planned (who should work when). The 출퇴근 is what each person
// really did with the 출근 / 퇴근 buttons of the staff app, as the server keeps it: one row per
// stretch (a person can clock in and out several times a day). Both are shown side by side for one
// day and compared. 휴식 is not calculated on its own: working time is the time from each 출근 to
// its 퇴근.
const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`)
const nowMinutes = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// -> [{ label, tone }] how what happened fits what was planned for one person on one day
//   day: 'future' | 'today' | 'past'
function compareDay(shifts, stretches, day) {
  const now = nowMinutes()
  const firstStart = shifts.length ? Math.min(...shifts.map((s) => minutes(s.start))) : null
  const lastEnd = shifts.length ? Math.max(...shifts.map((s) => minutes(s.end))) : null
  if (stretches.length === 0) {
    if (shifts.length === 0) return []
    if (day === 'future' || (day === 'today' && now < firstStart)) return [{ label: '근무 전', tone: 'is-gray' }]
    if (day === 'today' && now < lastEnd) return [{ label: '미출근 · 지각', tone: 'is-red' }]
    return [{ label: '결근 (기록 없음)', tone: 'is-red' }]
  }
  const out = []
  const open = stretches.some((s) => !s.out)
  if (shifts.length === 0) return [{ label: '근무표에 없는 출근', tone: 'is-lime' }]
  const late = minutes(stretches[0].in) - firstStart
  if (late > 0) out.push({ label: `지각 ${late}분`, tone: 'is-red' })
  const lastOut = stretches.filter((s) => s.out).at(-1)
  if (!open && lastOut && minutes(lastOut.out) < lastEnd) out.push({ label: `${lastEnd - minutes(lastOut.out)}분 일찍 퇴근`, tone: 'is-lime' })
  if (open && (day === 'past' || (day === 'today' && now >= lastEnd))) out.push({ label: '퇴근 확인 필요', tone: 'is-lime' })
  if (out.length === 0) out.push({ label: open ? '근무 중' : '정상', tone: 'is-green' })
  return out
}

function Attendance({ board, event }) {
  const days = useMemo(() => eventDays(event), [event])
  const [day, setDay] = useState(() => (days.includes(todayYmd()) ? todayYmd() : days[0]))
  const { data, error, reload } = useAsync(async () => {
    const [shifts, records] = await Promise.all([listShifts(event.id, day), listStaffAttendance(event.id, day)])
    return { shifts, records }
  }, [event.id, day])
  const today = todayYmd()
  const dayKind = day === today ? 'today' : day > today ? 'future' : 'past'

  // Ask again together with the live statuses (the board reloads itself every half minute).
  useEffect(() => {
    const timer = setInterval(reload, LIVE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [reload])

  const dutyName = (id) => board.duties.find((d) => d.id === id)?.name ?? ''
  const shiftsOf = new Map() // memberId -> planned shifts of the day
  for (const s of data?.shifts ?? []) for (const id of s.memberIds) shiftsOf.set(id, [...(shiftsOf.get(id) ?? []), s])
  const stretchesOf = new Map() // memberId -> clock-in / clock-out stretches of the day, oldest first
  for (const r of data?.records ?? []) stretchesOf.set(r.memberId, [...(stretchesOf.get(r.memberId) ?? []), r])
  for (const list of stretchesOf.values()) list.sort((a, b) => a.in.localeCompare(b.in))

  const byId = new Map(board.members.map((m) => [m.id, m]))
  const ids = [...new Set([...shiftsOf.keys(), ...stretchesOf.keys()])]
  const rows = ids
    .map((id) => {
      const member = byId.get(id)
      const stretches = stretchesOf.get(id) ?? []
      const shifts = shiftsOf.get(id) ?? []
      return {
        id,
        name: member?.name ?? stretches[0]?.name ?? '',
        role: member?.role ?? stretches[0]?.role,
        shifts,
        stretches,
        worked: stretches.reduce((sum, s) => sum + (s.minutes ?? 0), 0),
        verdicts: compareDay(shifts, stretches, dayKind),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const planned = rows.filter((r) => r.shifts.length > 0).length
  const came = rows.filter((r) => r.stretches.length > 0).length
  const late = rows.filter((r) => r.verdicts.some((v) => v.label.startsWith('지각') || v.label.startsWith('미출근'))).length
  const missed = rows.filter((r) => r.verdicts.some((v) => v.label.startsWith('결근'))).length
  const dayIndex = days.indexOf(day)

  return (
    <section className="sf-card">
      <div className="sf-toolbar">
        <button type="button" className="sf-btn is-icon" disabled={dayIndex <= 0} onClick={() => setDay(days[dayIndex - 1])} aria-label="이전 날짜">
          ‹
        </button>
        <select className="sf-select" value={day} onChange={(e) => setDay(e.target.value)} aria-label="날짜">
          {days.map((d) => (
            <option key={d} value={d}>
              {dayLabel(d)}
            </option>
          ))}
        </select>
        <button type="button" className="sf-btn is-icon" disabled={dayIndex >= days.length - 1} onClick={() => setDay(days[dayIndex + 1])} aria-label="다음 날짜">
          ›
        </button>
        <span className="sf-pill is-green">근무 배정 {planned}명</span>
        <span className="sf-pill is-green">출근 {came}명</span>
        {late > 0 && <span className="sf-pill is-red">지각 · 미출근 {late}명</span>}
        {missed > 0 && <span className="sf-pill is-red">결근 {missed}명</span>}
        <span className="sf-spacer" />
        {dayKind === 'today' && <span className="sf-live">● 실시간 {nowLabel()} 기준</span>}
      </div>

      <table className="sf-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>역할</th>
            <th>근무표 (계획)</th>
            <th>출퇴근 (실제 기록)</th>
            <th>근무 시간</th>
            <th>비교</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.name}</strong>
              </td>
              <td>{STAFF_ROLE_LABEL[r.role]}</td>
              <td>
                {r.shifts.length === 0
                  ? '배정 없음'
                  : r.shifts.map((s) => (
                      <div key={s.id}>
                        {s.start} – {s.end} <small>{dutyName(s.dutyId)}</small>
                      </div>
                    ))}
              </td>
              <td>
                {r.stretches.length === 0
                  ? '기록 없음'
                  : r.stretches.map((s, i) => (
                      <div key={s.id ?? i}>
                        {s.in} – {s.out ?? '근무 중'}
                      </div>
                    ))}
              </td>
              <td>{r.stretches.length === 0 ? '-' : fmtMinutes(r.worked)}</td>
              <td>
                {r.verdicts.length === 0
                  ? '-'
                  : r.verdicts.map((v) => (
                      <span key={v.label} className={`sf-pill ${v.tone}`}>
                        {v.label}
                      </span>
                    ))}
              </td>
            </tr>
          ))}
          {data && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="sf-empty">
                이 날짜에 근무가 배정되거나 출근한 스태프가 없어요.
              </td>
            </tr>
          )}
          {!data && (
            <tr>
              <td colSpan={6} className="sf-empty">
                {error ? apiErrorMessage(error) : '불러오는 중…'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <small className="sf-hint">
        출근 · 퇴근은 스태프가 앱에서 누른 시각이에요. 같은 날 여러 번 출퇴근하면 구간마다 한 줄로 보여요. 휴식은 따로 계산하지 않고, 출근부터 퇴근까지를 근무 시간으로 봐요. 근무표(계획)는 근무표 탭에서 바꿀 수 있어요.
      </small>
    </section>
  )
}
