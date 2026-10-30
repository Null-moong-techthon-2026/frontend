// 스태프 sample data for the ?demo preview mode (see utils/demo.js) - and the role / status words
// both the real screens and the preview use. Real use goes through api/staffApi.js to the backend;
// this module is only touched when the preview flag is on. State lives in memory (a reload resets it).

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

export const STAFF_INVITE = { code: 'BL26-STF7', token: '7Qm4xN' }
export const SHIFT_DAYS = ['2026-11-02', '2026-11-03', '2026-11-04']

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
  revision: 0,
  ...extra,
})

// The people named in the wireframes first, then more so the lists have pages.
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

// The preview's own staff account: an approved staff member with two shifts like the wireframe.
const DEMO_ME = m('demo-staff', '김민서', 'STAFF', 'duty-info', '010-0000-1001', 'WAITING', { email: 'booth@example.com' })

let state = null
let me = null // the preview account's own member (null = a newcomer who has not joined)
let attendance = []

function init() {
  if (state) return state
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
      revision: 0,
    })),
  )
  shifts.forEach((s) => {
    if (s.dutyId === 'duty-info' && s.date === SHIFT_DAYS[0]) s.memberIds.push('demo-staff')
  })
  // 11:00 - 13:00 입구 안내 (with 이수현 and 최지우), then 14:00 - 16:00 행사 안내 like the wireframe.
  shifts.push({ id: 'shift-demo-gate', date: SHIFT_DAYS[0], dutyId: 'duty-gate', start: '11:00', end: '13:00', memberIds: ['demo-staff', 's03', 's04'], roles: ['STAFF', 'LABOR', 'VOLUNTEER'], revision: 0 })
  return (state = { members: [...members, DEMO_ME], duties: DUTIES.map((d) => ({ ...d })), shifts })
}

export const readStaffData = () => init()

// ---- organizer actions (preview) ----

export const updateMember = (id, fields) => {
  const s = init()
  s.members = s.members.map((x) => (x.id === id ? { ...x, ...fields } : x))
}
export const approveMember = (id) => updateMember(id, { status: STAFF_STATUS.WAITING })
export const rejectMember = (id) => updateMember(id, { status: STAFF_STATUS.REJECTED })

export function assignDuty(memberId, dutyId) {
  const s = init()
  s.members = s.members.map((x) =>
    x.id === memberId ? { ...x, dutyId, status: x.status === STAFF_STATUS.PENDING ? x.status : STAFF_STATUS.WORKING } : x,
  )
}

export function addDuty({ name, zone, start, end }) {
  const s = init()
  const duty = { id: `duty-${Date.now()}`, name, zone, start, end }
  s.duties = [...s.duties, duty]
  return duty
}

export function addShift({ date, dutyId, start, end, roles }) {
  const s = init()
  const shift = { id: `shift-${Date.now()}`, date, dutyId, start, end, memberIds: [], roles, revision: 0 }
  s.shifts = [...s.shifts, shift]
  return shift
}

export function setShiftMembers(shiftId, memberIds) {
  const s = init()
  const shift = s.shifts.find((x) => x.id === shiftId)
  s.shifts = s.shifts.map((x) => (x.id === shiftId ? { ...x, memberIds } : x))
  s.members = s.members.map((x) => (memberIds.includes(x.id) ? { ...x, dutyId: shift.dutyId } : x))
}

// ---- the preview's staff account ----

// ?demo=1 is an approved staff member; ?demo=2 a newcomer who joins with the code.
export function setDemoNewcomer(isNewcomer) {
  if (isNewcomer) {
    if (me?.id === 'demo-staff') me = null
  } else if (!me) {
    me = DEMO_ME
  }
}

export function demoJoin(role, affiliation) {
  const s = init()
  me = m('demo-new', '김민서', role, null, '010-0000-0000', 'PENDING', { email: 'booth@example.com', affiliation: affiliation ?? '' })
  s.members = [me, ...s.members.filter((x) => x.id !== 'demo-new')]
}

export function demoMemberships() {
  const s = init()
  const mine = me ? s.members.find((x) => x.id === me.id) : null
  if (!mine) return []
  const duty = s.duties.find((d) => d.id === mine.dutyId)
  return [
    {
      eventId: 'demo-event',
      memberId: mine.id,
      role: mine.role,
      status: mine.status,
      eventName: '비룡제 2026',
      startDate: SHIFT_DAYS[0],
      endDate: SHIFT_DAYS[SHIFT_DAYS.length - 1],
      venue: '인하대학교 대운동장',
      dutyName: duty?.name ?? null,
      name: mine.name,
      phone: mine.phone,
      email: mine.email,
      affiliation: mine.affiliation,
    },
  ]
}

export function demoSchedule(date) {
  const s = init()
  return s.shifts
    .filter((x) => x.date === date && x.memberIds.includes('demo-staff'))
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((x) => {
      const duty = s.duties.find((d) => d.id === x.dutyId)
      return {
        id: x.id,
        date: x.date,
        dutyId: x.dutyId,
        dutyName: duty?.name ?? '',
        zone: duty?.zone ?? '',
        start: x.start,
        end: x.end,
        mates: x.memberIds
          .filter((id) => id !== 'demo-staff')
          .map((id) => s.members.find((p) => p.id === id))
          .filter(Boolean)
          .map((p) => ({ id: p.id, name: p.name, role: p.role, phone: p.phone, dutyName: duty?.name ?? null })),
      }
    })
}

const nowHm = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const minutesOf = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))
const worked = (r) => {
  if (!r.out) return 0
  const span = minutesOf(r.out) - minutesOf(r.in)
  return Math.max(0, span >= 300 ? span - 60 : span)
}

export function demoClock(kind) {
  const date = SHIFT_DAYS[0]
  if (kind === 'in') {
    if (!attendance.some((r) => r.date === date)) attendance = [...attendance, { date, in: nowHm(), out: null, minutes: 0 }]
  } else {
    attendance = attendance.map((r) => (r.date === date && !r.out ? { ...r, out: nowHm() } : r)).map((r) => ({ ...r, minutes: worked(r) }))
  }
  return attendance.find((r) => r.date === date)
}

export function demoAttendance() {
  const records = [...attendance].sort((a, b) => b.date.localeCompare(a.date))
  return { records, totalMinutes: records.reduce((sum, r) => sum + worked(r), 0) }
}

// Counts of a list of members by one field (role / status).
export function countBy(members, key) {
  const counts = {}
  for (const x of members) counts[x[key]] = (counts[x[key]] ?? 0) + 1
  return counts
}
