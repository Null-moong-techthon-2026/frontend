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
  return { members, duties: DUTIES, shifts }
}

let state = null
const listeners = new Set()

function load() {
  if (state) return state
  try {
    const stored = JSON.parse(localStorage.getItem(KEY))
    if (stored?.members && stored?.duties && stored?.shifts) return (state = stored)
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
