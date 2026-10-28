// 스태프 (staff) data. There is NO backend for it yet (docs/BACKEND_REQUESTS.md), so this small
// store keeps everything in this browser: the organizer's 스태프 screens (명단 / 근무표 / 실시간
// 현황) and the staff app (일정, 프로필, 근무 기록) read and change the same data.
// When the backend gets staff APIs, replace the actions below with calls; the shapes stay.
//
//   member { id, name, role, dutyId, phone, email, affiliation, status, memo, worked }
//          role   STAFF 스태프 | ADMIN 관리자(주최측) | LABOR 근로 | VOLUNTEER 봉사
//          status PENDING 승인 대기 | WORKING 근무 중 | WAITING 대기 중 | BREAK 휴식 중 | ABSENT 미출근 | REJECTED 거부
//   duty   { id, name, zone, start, end }              'HH:mm' times
//   shift  { id, date, dutyId, start, end, memberIds, roles }
//   accounts   { [accountId]: memberId }        which member a logged-in staff account is
//   attendance { [memberId]: [{ date, in, out }] }   출근 / 퇴근 times ('HH:mm'; out is null until 퇴근)

import { useSyncExternalStore } from 'react'

export const STAFF_ROLE = { STAFF: 'STAFF', ADMIN: 'ADMIN', LABOR: 'LABOR', VOLUNTEER: 'VOLUNTEER' }
export const STAFF_ROLE_LABEL = { STAFF: '스태프', ADMIN: '관리자', LABOR: '근로', VOLUNTEER: '봉사' }

export const STAFF_STATUS = {
  PENDING: 'PENDING',
  WORKING: 'WORKING',
  WAITING: 'WAITING',
  BREAK: 'BREAK',
  ABSENT: 'ABSENT',
  REJECTED: 'REJECTED',
}
export const STAFF_STATUS_LABEL = {
  PENDING: '승인 대기',
  WORKING: '근무 중',
  WAITING: '대기 중',
  BREAK: '휴식 중',
  ABSENT: '미출근',
  REJECTED: '거부',
}

export const STAFF_INVITE = { code: 'BL26-STF7', url: 'boothluck.kr/invite/staff/7Qm4xN', token: '7Qm4xN' }

const KEY = 'boothluck.dummy.staff'

const DUTIES = [
  { id: 'duty-info', name: '행사 안내', zone: '운영본부', start: '14:00', end: '16:00' },
  { id: 'duty-gate', name: '입구 안내', zone: '정문', start: '14:00', end: '17:00' },
  { id: 'duty-clean', name: '환경 정리', zone: '행사장 전역', start: '14:00', end: '18:00' },
  { id: 'duty-patrol', name: '안전 순찰', zone: '중앙 광장', start: '11:00', end: '15:00' },
  { id: 'duty-goods', name: '물품 지원', zone: '물품 보관소', start: '14:00', end: '18:00' },
  { id: 'duty-stage', name: '무대 지원', zone: '메인 무대', start: '14:00', end: '21:00' },
]

const m = (id, name, role, dutyId, phone, status, extra = {}) => ({
  id,
  name,
  role,
  dutyId,
  phone,
  email: `${id}@example.com`,
  affiliation: '인하대학교',
  status,
  memo: '',
  worked: false,
  ...extra,
})

// The people named in the wireframes first, then more of them so the lists have pages.
const NAMED = [
  m('s01', '김민지', 'STAFF', 'duty-info', '010-0000-1001', 'PENDING', { email: 'minji@example.com' }),
  m('s02', '박서준', 'ADMIN', 'duty-stage', '010-0000-1002', 'WORKING'),
  m('s03', '이수현', 'LABOR', 'duty-gate', '010-0000-1003', 'WAITING'),
  m('s04', '최지우', 'VOLUNTEER', 'duty-clean', '010-0000-1004', 'BREAK'),
  m('s05', '정하늘', 'STAFF', 'duty-gate', '010-0000-1005', 'WORKING'),
  m('s06', '한도윤', 'LABOR', 'duty-info', '010-0000-1006', 'ABSENT'),
  m('s07', '이서윤', 'VOLUNTEER', 'duty-gate', '010-0000-1007', 'WORKING'),
  m('s08', '김서아', 'VOLUNTEER', 'duty-clean', '010-0000-1008', 'WORKING'),
  m('s09', '박도현', 'VOLUNTEER', 'duty-clean', '010-0000-1009', 'WORKING'),
  m('s10', '정우진', 'STAFF', 'duty-patrol', '010-0000-1010', 'WORKING'),
  m('s11', '윤지호', 'LABOR', 'duty-patrol', '010-0000-1011', 'WORKING'),
  m('s12', '김지안', 'LABOR', 'duty-goods', '010-0000-1012', 'WORKING'),
  m('s13', '장예은', 'VOLUNTEER', 'duty-goods', '010-0000-1013', 'WORKING'),
  m('s14', '이도윤', 'STAFF', 'duty-stage', '010-0000-1014', 'WORKING'),
  m('s15', '김태영', 'STAFF', null, '010-0000-1015', 'BREAK'),
  m('s16', '최예린', 'LABOR', null, '010-0000-1016', 'ABSENT'),
  m('s17', '강민준', 'STAFF', null, '010-0000-1017', 'ABSENT'),
  m('s18', '송하린', 'VOLUNTEER', null, '010-0000-1018', 'WAITING'),
  m('s19', '오하윤', 'STAFF', 'duty-gate', '010-0000-1019', 'WORKING'),
  m('s20', '서준호', 'LABOR', 'duty-gate', '010-0000-1020', 'WORKING'),
  m('s21', '조유진', 'VOLUNTEER', 'duty-gate', '010-0000-1021', 'WORKING'),
  m('s22', '문서아', 'STAFF', 'duty-gate', '010-0000-1022', 'WORKING'),
]
const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']
const GIVEN = ['도영', '하은', '시우', '유나', '지후', '서연', '준서', '아린', '현우', '다은', '예준', '수빈', '민재']
const EXTRA = Array.from({ length: 13 }, (_, i) => {
  const n = 23 + i
  const role = ['STAFF', 'LABOR', 'VOLUNTEER'][i % 3]
  const status = i < 2 ? 'PENDING' : i < 5 ? 'WAITING' : 'WORKING'
  return m(`s${n}`, `${SURNAMES[i % SURNAMES.length]}${GIVEN[i]}`, role, i < 5 ? null : DUTIES[i % DUTIES.length].id, `010-0000-10${String(n).padStart(2, '0')}`, status)
})

const SHIFT_DAYS = ['2026-11-02', '2026-11-03', '2026-11-04']
const SHIFT_DATE = SHIFT_DAYS[0]

const seed = () => {
  const members = [...NAMED, ...EXTRA]
  const shifts = SHIFT_DAYS.flatMap((date, day) =>
    DUTIES.map((d) => ({
      id: `shift-${d.id}-${day + 1}`,
      date,
      dutyId: d.id,
      start: d.start,
      end: d.end,
      memberIds: members.filter((x) => x.dutyId === d.id && x.status !== 'PENDING').map((x) => x.id),
      roles: ['STAFF', 'LABOR', 'VOLUNTEER'],
    })),
  )
  return { members, duties: DUTIES, shifts, accounts: {}, attendance: {} }
}

let state = null
const listeners = new Set()

function load() {
  if (state) return state
  try {
    const stored = JSON.parse(localStorage.getItem(KEY))
    if (stored?.members && stored?.duties && stored?.shifts) {
      return (state = { accounts: {}, attendance: {}, ...stored })
    }
  } catch {
    // fall through to the seed
  }
  return (state = seed())
}

function commit(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // keep it in memory only
  }
  listeners.forEach((l) => l())
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// { members, duties, shifts } - a new object after every change.
export const useStaffData = () => useSyncExternalStore(subscribe, load, load)

export const resetStaffData = () => commit(seed())

// ---- actions ----

export const updateMember = (id, fields) =>
  commit({ ...load(), members: load().members.map((x) => (x.id === id ? { ...x, ...fields } : x)) })

export const approveMember = (id) => updateMember(id, { status: STAFF_STATUS.WAITING })
export const rejectMember = (id) => updateMember(id, { status: STAFF_STATUS.REJECTED })

// Puts a person on a duty (and into that duty's shift of the day).
export function assignDuty(memberId, dutyId) {
  const current = load()
  const shifts = current.shifts.map((s) => {
    const without = s.memberIds.filter((x) => x !== memberId)
    return s.dutyId === dutyId && s.date === SHIFT_DATE ? { ...s, memberIds: [...without, memberId] } : { ...s, memberIds: without }
  })
  commit({
    ...current,
    shifts,
    members: current.members.map((x) =>
      x.id === memberId ? { ...x, dutyId, status: x.status === STAFF_STATUS.PENDING ? x.status : STAFF_STATUS.WORKING } : x,
    ),
  })
}

export function addDuty({ name, zone, start, end }) {
  const current = load()
  const duty = { id: `duty-${Date.now()}`, name, zone, start, end }
  commit({ ...current, duties: [...current.duties, duty] })
  return duty
}

export function addShift({ date, dutyId, start, end, roles }) {
  const current = load()
  const shift = { id: `shift-${Date.now()}`, date, dutyId, start, end, memberIds: [], roles }
  commit({ ...current, shifts: [...current.shifts, shift] })
  return shift
}

export function setShiftMembers(shiftId, memberIds) {
  const current = load()
  const shift = current.shifts.find((s) => s.id === shiftId)
  commit({
    ...current,
    shifts: current.shifts.map((s) => (s.id === shiftId ? { ...s, memberIds } : s)),
    members: current.members.map((x) =>
      memberIds.includes(x.id) ? { ...x, dutyId: shift.dutyId } : x,
    ),
  })
}

// ---- reading helpers ----

export const dutyOf = (data, member) => data.duties.find((d) => d.id === member.dutyId) ?? null
export const membersOfDuty = (data, dutyId) => data.members.filter((x) => x.dutyId === dutyId && x.status !== STAFF_STATUS.PENDING && x.status !== STAFF_STATUS.REJECTED)

export function countBy(members, key) {
  const counts = {}
  for (const x of members) counts[x[key]] = (counts[x[key]] ?? 0) + 1
  return counts
}

export { SHIFT_DAYS }

// ---- the staff app (a logged-in staff account is one member) ----

export const memberOfAccount = (data, accountId) => {
  const id = data.accounts[accountId]
  return id ? (data.members.find((x) => x.id === id) ?? null) : null
}

// A staff account asks to join with an invitation code: becomes a member waiting for approval.
export function joinStaff(account, role) {
  const current = load()
  const id = `acc-${account.id}`
  const member = {
    id,
    name: account.nickname,
    role,
    dutyId: null,
    phone: account.phoneNumber ?? '',
    email: account.email ?? '',
    affiliation: '',
    status: STAFF_STATUS.PENDING,
    memo: '',
    worked: false,
  }
  commit({
    ...current,
    members: [member, ...current.members.filter((x) => x.id !== id)],
    accounts: { ...current.accounts, [account.id]: id },
  })
  return member
}

// Preview mode: the demo account is an approved staff member with the two shifts of the wireframe.
export function ensureDemoStaff(account) {
  const current = load()
  if (current.accounts[account.id]) return
  const id = 'demo-staff'
  const member = {
    id,
    name: account.nickname,
    role: STAFF_ROLE.STAFF,
    dutyId: 'duty-info',
    phone: '010-0000-1001',
    email: account.email,
    affiliation: '인하대학교',
    status: STAFF_STATUS.WAITING,
    memo: '',
    worked: false,
  }
  // 11:00 - 13:00 입구 안내 (with 이수현 and 최지우), then 14:00 - 16:00 행사 안내 like the wireframe.
  const addTo = (shift) => (shift.date === SHIFT_DAYS[0] && shift.dutyId === 'duty-info' ? { ...shift, memberIds: [...shift.memberIds, id] } : shift)
  const morning = { id: 'shift-demo-gate', date: SHIFT_DAYS[0], dutyId: 'duty-gate', start: '11:00', end: '13:00', memberIds: [id, 's03', 's04'], roles: ['STAFF', 'LABOR', 'VOLUNTEER'] }
  commit({
    ...current,
    members: [...current.members, member],
    shifts: [...current.shifts.map(addTo), morning],
    accounts: { ...current.accounts, [account.id]: id },
  })
}

export function updateProfile(memberId, { name, phone, email, affiliation }) {
  updateMember(memberId, { name, phone, email, affiliation })
}

const nowHm = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const todayYmd = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// The day the app shows as "오늘": today when it is an event day, else the first event day.
export const scheduleDay = () => (SHIFT_DAYS.includes(todayYmd()) ? todayYmd() : SHIFT_DAYS[0])

export const attendanceOn = (data, memberId, date) => (data.attendance[memberId] ?? []).find((a) => a.date === date) ?? null

export function clockIn(memberId) {
  const current = load()
  const date = scheduleDay()
  const list = current.attendance[memberId] ?? []
  if (list.some((a) => a.date === date)) return
  commit({
    ...current,
    attendance: { ...current.attendance, [memberId]: [...list, { date, in: nowHm(), out: null }] },
    members: current.members.map((x) => (x.id === memberId ? { ...x, status: STAFF_STATUS.WORKING } : x)),
  })
}

export function clockOut(memberId) {
  const current = load()
  const date = scheduleDay()
  const list = current.attendance[memberId] ?? []
  commit({
    ...current,
    attendance: { ...current.attendance, [memberId]: list.map((a) => (a.date === date && !a.out ? { ...a, out: nowHm() } : a)) },
    members: current.members.map((x) => (x.id === memberId ? { ...x, status: STAFF_STATUS.WAITING, worked: true } : x)),
  })
}

// Worked minutes of one attendance record (a 1 hour break is taken off long days).
export function workedMinutes(record) {
  if (!record?.out) return 0
  const span = Number(record.out.slice(0, 2)) * 60 + Number(record.out.slice(3, 5)) - (Number(record.in.slice(0, 2)) * 60 + Number(record.in.slice(3, 5)))
  return Math.max(0, span >= 300 ? span - 60 : span)
}

// A member's shifts of one day, earliest first.
export const myShifts = (data, memberId, date) =>
  data.shifts
    .filter((s) => s.date === date && s.memberIds.includes(memberId))
    .sort((a, b) => a.start.localeCompare(b.start))

// Gives up a join request (or starts over after a rejection).
export function cancelStaffJoin(accountId) {
  const current = load()
  const id = current.accounts[accountId]
  const { [accountId]: removed, ...accounts } = current.accounts
  void removed
  commit({ ...current, accounts, members: current.members.filter((x) => x.id !== id) })
}
