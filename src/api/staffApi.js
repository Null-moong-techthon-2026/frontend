// 스태프 (people who help run an event): the organizer's staff screens and the staff app.
//
// Real backend (all under /api):
//   organizer   POST|GET|DELETE /events/:id/staff-invitation      invitation code + link
//               GET   /events/:id/staff                           roster (+ summary)
//               PATCH /events/:id/staff/:memberId                 role / status / duty / memo
//               POST  /events/:id/staff/:memberId/decision        approve / reject
//               GET|POST /events/:id/staff-duties                 duties (zone + name)
//               GET|POST /events/:id/staff-shifts                 shifts of a day / add one
//               PUT   /events/:id/staff-shifts/:shiftId/members   who works the shift
//   staff       POST  /staff-invitations/resolve                  the event behind a code
//               POST  /events/:id/staff-applications              ask to join (PENDING)
//               GET   /me/staff-memberships                       my joins and their status
//               GET   /events/:id/staff/me/schedule?date=         my shifts (+ who works with me)
//               POST  /events/:id/staff/me/clock-in | clock-out   server time
//               GET   /events/:id/staff/me/attendance             my records
// The response bodies of these endpoints are not typed in the OpenAPI document, so the views below
// accept the field names loosely (see the normalizers) and are the one place to adjust.
// In ?demo preview mode everything comes from dummy/staffStore.js instead (in memory + this browser).
//
// View models:
//   member { id, name, role, status, dutyId, dutyName, phone, email, affiliation, memo, revision }
//   duty   { id, zone, name }
//   shift  { id, date, dutyId, start, end, roles, memberIds, revision }
//   mine   { id, date, dutyId, dutyName, zone, start, end, mates:[{id,name,role,phone}] }
//   record { date, in, out, minutes }

import { DEMO_EVENT, DEMO_NOTICES } from '../dummy/demoData'
import * as store from '../dummy/staffStore'
import { demoDelay, isDemo } from '../utils/demo'
import { instantToLocalDate, instantToLocalDateTime } from '../utils/date'
import { get, patch, post, put, query, del } from './client'

const notFound = () => Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })

// ---------------- normalizers ----------------

// '14:00:00' | '14:00' | an ISO instant -> '14:00'
const hm = (value) => {
  if (!value) return ''
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  const local = instantToLocalDateTime(value)
  return local ? local.slice(11, 16) : ''
}

const ymd = (value) => (!value ? '' : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : instantToLocalDate(value))

// '01099990000' -> '010-9999-0000'
const dashPhone = (value) => {
  const d = String(value ?? '').replace(/\D/g, '')
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return value ?? ''
}

export const memberView = (r) => ({
  id: r.memberId ?? r.id,
  name: r.name ?? r.nickname ?? r.accountName ?? '',
  role: r.role,
  status: r.status,
  dutyId: r.dutyId ?? r.duty?.id ?? null,
  dutyName: r.dutyName ?? r.duty?.name ?? null,
  phone: dashPhone(r.phone ?? r.phoneNumber),
  email: r.email ?? '',
  affiliation: r.affiliation ?? '',
  memo: r.memo ?? '',
  revision: r.revision ?? 0,
})

const dutyView = (r) => ({ id: r.id ?? r.dutyId, zone: r.zone ?? '', name: r.name ?? '' })

const shiftView = (r) => {
  const people = r.members ?? []
  return {
    id: r.id ?? r.shiftId,
    date: ymd(r.date),
    dutyId: r.dutyId ?? r.duty?.id,
    start: hm(r.start),
    end: hm(r.end),
    roles: r.roles ?? [],
    memberIds: r.memberIds ?? people.map((p) => p.memberId ?? p.id),
    revision: r.revision ?? 0,
  }
}

const mineView = (r) => ({
  id: r.id ?? r.shiftId,
  date: ymd(r.date),
  dutyId: r.dutyId ?? r.duty?.id ?? null,
  dutyName: r.dutyName ?? r.duty?.name ?? r.name ?? '',
  zone: r.zone ?? r.duty?.zone ?? '',
  start: hm(r.start),
  end: hm(r.end),
  mates: (r.mates ?? r.coworkers ?? r.members ?? r.people ?? []).map(memberView),
})

const recordView = (r) => ({
  date: ymd(r.date),
  in: hm(r.in ?? r.clockIn ?? r.clockInAt ?? r.checkInAt),
  out: hm(r.out ?? r.clockOut ?? r.clockOutAt ?? r.checkOutAt) || null,
  minutes: r.workedMinutes ?? r.minutes ?? r.workMinutes ?? null,
})

// What the page of members says about the roster: the server's summary, or counted here.
const summaryOf = (raw, members) => {
  const s = raw.summary
  if (s) return { total: s.total ?? members.length, admin: s.admin ?? 0, staff: s.staff ?? 0, labor: s.labor ?? 0, volunteer: s.volunteer ?? 0, pending: s.pending ?? 0 }
  const count = (k, v) => members.filter((m) => m[k] === v).length
  return {
    total: members.length,
    admin: count('role', 'ADMIN'),
    staff: count('role', 'STAFF'),
    labor: count('role', 'LABOR'),
    volunteer: count('role', 'VOLUNTEER'),
    pending: count('status', 'PENDING'),
  }
}

const base = (eventId) => `/api/events/${eventId}`

// ---------------- organizer ----------------

// The server builds `inviteUrl` from a setting of its own (still "frontend.invalid" there); the link is
// made here from the token at its end and this site's address.
const staffInvitation = (raw) => ({
  code: raw.code,
  inviteUrl: `${window.location.origin}/invite/staff/${String(raw.inviteUrl ?? '').split('/').pop()}`,
  expiresAt: raw.expiresAt,
})

export async function getStaffInvitation(eventId) {
  if (isDemo()) return demoDelay({ code: store.STAFF_INVITE.code, inviteUrl: `${window.location.origin}/invite/staff/${store.STAFF_INVITE.token}`, expiresAt: null })
  try {
    return staffInvitation(await get(`${base(eventId)}/staff-invitation`))
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

export async function issueStaffInvitation(eventId) {
  if (isDemo()) return getStaffInvitation(eventId)
  return staffInvitation(await post(`${base(eventId)}/staff-invitation`))
}

export async function revokeStaffInvitation(eventId) {
  if (isDemo()) return null
  return del(`${base(eventId)}/staff-invitation`)
}

// -> { members, summary }  (everyone of the event; the screen filters and pages them itself)
export async function listStaff(eventId) {
  if (isDemo()) {
    const members = store.readStaffData().members.map(memberView)
    return demoDelay({ members, summary: summaryOf({}, members) })
  }
  const raw = await get(`${base(eventId)}/staff${query({ page: 0, size: 100 })}`)
  const members = (raw.content ?? raw).map(memberView)
  return { members, summary: summaryOf(raw, members) }
}

// fields: any of { role, status, dutyId (null = no duty), memo }
export async function updateStaffMember(eventId, member, fields) {
  if (isDemo()) {
    if ('dutyId' in fields && fields.dutyId) store.assignDuty(member.id, fields.dutyId)
    const { dutyId, ...rest } = fields
    if (Object.keys(rest).length > 0 || ('dutyId' in fields && !dutyId)) store.updateMember(member.id, { ...rest, ...('dutyId' in fields && !dutyId ? { dutyId: null } : {}) })
    return demoDelay(null)
  }
  return memberView(await patch(`${base(eventId)}/staff/${member.id}`, { revision: member.revision, ...fields }))
}

export async function decideStaffMember(eventId, member, decision) {
  if (isDemo()) {
    if (decision === 'APPROVED') store.approveMember(member.id)
    else store.rejectMember(member.id)
    return demoDelay(null)
  }
  return memberView(await post(`${base(eventId)}/staff/${member.id}/decision`, { decision, revision: member.revision }))
}

export async function listDuties(eventId) {
  if (isDemo()) return demoDelay(store.readStaffData().duties.map(dutyView))
  return (await get(`${base(eventId)}/staff-duties`)).map(dutyView)
}

export async function createDuty(eventId, { zone, name }) {
  if (isDemo()) return demoDelay(dutyView(store.addDuty({ zone, name, start: '14:00', end: '16:00' })))
  return dutyView(await post(`${base(eventId)}/staff-duties`, { zone, name }))
}

export async function listShifts(eventId, date) {
  if (isDemo()) return demoDelay(store.readStaffData().shifts.filter((s) => s.date === date).map(shiftView))
  return (await get(`${base(eventId)}/staff-shifts${query({ date })}`)).map(shiftView)
}

export async function createShift(eventId, { date, dutyId, start, end, roles }) {
  if (isDemo()) return demoDelay(shiftView(store.addShift({ date, dutyId, start, end, roles })))
  return shiftView(await post(`${base(eventId)}/staff-shifts`, { date, dutyId, start, end, roles }))
}

export async function replaceShiftMembers(eventId, shift, memberIds) {
  if (isDemo()) {
    store.setShiftMembers(shift.id, memberIds)
    return demoDelay(null)
  }
  return shiftView(await put(`${base(eventId)}/staff-shifts/${shift.id}/members`, { memberIds, revision: shift.revision }))
}

// ---------------- staff (the logged-in staff account) ----------------

// The event an invitation code (or the token of an invitation link) opens. 404 for a wrong code.
export async function resolveStaffInvite(code) {
  const value = code.trim()
  if (isDemo()) {
    if (value.length < 4) throw notFound()
    return demoDelay({ eventId: DEMO_EVENT.id, event: DEMO_EVENT })
  }
  const raw = await post('/api/staff-invitations/resolve', { code: value })
  const e = raw.event ?? raw
  return {
    eventId: raw.eventId ?? e.eventId ?? e.id,
    event: {
      id: raw.eventId ?? e.eventId ?? e.id,
      name: e.name ?? e.eventName ?? '',
      organizationName: e.organizationName ?? e.organization?.name ?? '',
      startDate: ymd(e.startDate ?? e.startsAt),
      endDate: ymd(e.endDate ?? e.endsAt),
      venue: e.venue ?? '',
      intro: e.description ?? e.intro ?? '',
      imageUrl: e.posterUrl ?? null,
      hours: null,
      phone: null,
      directions: null,
    },
  }
}

// role: STAFF | LABOR | VOLUNTEER
export async function applyStaff(eventId, { code, role, affiliation }) {
  if (isDemo()) return demoDelay(null)
  return memberView(await post(`${base(eventId)}/staff-applications`, { code, role, ...(affiliation ? { affiliation } : {}) }))
}

// -> [{ eventId, memberId, role, status, eventName, dutyName, ... }]
export async function listMyStaffMemberships() {
  if (isDemo()) return demoDelay(store.demoMemberships())
  const raw = await get('/api/me/staff-memberships')
  return (raw.content ?? raw).map((r) => ({
    eventId: r.eventId ?? r.event?.id,
    memberId: r.memberId ?? r.id,
    role: r.role,
    status: r.status,
    eventName: r.eventName ?? r.event?.name ?? '',
    startDate: ymd(r.startDate ?? r.startsAt ?? r.event?.startsAt),
    endDate: ymd(r.endDate ?? r.endsAt ?? r.event?.endsAt),
    venue: r.venue ?? r.event?.venue ?? '',
    dutyName: r.dutyName ?? r.duty?.name ?? null,
    name: r.name ?? '',
    phone: dashPhone(r.phone ?? r.phoneNumber),
    email: r.email ?? '',
    affiliation: r.affiliation ?? '',
  }))
}

// `selfId` is my own member id: the server lists every person of the shift, me included.
export async function listMySchedule(eventId, date, selfId) {
  if (isDemo()) return demoDelay(store.demoSchedule(date))
  return (await get(`${base(eventId)}/staff/me/schedule${query({ date })}`)).map((r) => {
    const shift = mineView(r)
    return { ...shift, mates: shift.mates.filter((m) => m.id !== selfId) }
  })
}

export async function clockIn(eventId) {
  if (isDemo()) return demoDelay(store.demoClock('in'))
  return recordView(await post(`${base(eventId)}/staff/me/clock-in`))
}

export async function clockOut(eventId) {
  if (isDemo()) return demoDelay(store.demoClock('out'))
  return recordView(await post(`${base(eventId)}/staff/me/clock-out`))
}

// -> { records (newest first), totalMinutes }
export async function listMyAttendance(eventId) {
  if (isDemo()) return demoDelay(store.demoAttendance())
  const raw = await get(`${base(eventId)}/staff/me/attendance${query({ page: 0, size: 100 })}`)
  const records = (raw.content ?? raw.records ?? raw).map(recordView)
  const total = raw.totalMinutes ?? raw.workedMinutes ?? records.reduce((sum, r) => sum + (r.minutes ?? 0), 0)
  return { records, totalMinutes: total }
}

// Notices for staff: the normal announcement API, readable by approved staff (audience STAFF).
const noticeRow = (raw) => ({
  id: raw.id,
  title: raw.title,
  body: raw.body ?? '',
  urgent: Boolean(raw.isUrgent),
  publishedAt: raw.publishedAt,
  author: '',
  attachment: null,
  imageUrl: raw.imageUrl ?? null,
})

export async function listStaffNotices(eventId) {
  if (isDemo()) return demoDelay(DEMO_NOTICES.filter((n) => n.audiences.includes('STAFF')))
  const page = await get(`${base(eventId)}/announcements${query({ view: 'READ', page: 0, size: 100 })}`)
  return page.content.map(noticeRow)
}

export async function getStaffNotice(eventId, noticeId) {
  if (isDemo()) {
    const found = DEMO_NOTICES.find((n) => n.id === noticeId)
    if (!found) throw notFound()
    return demoDelay(found)
  }
  return noticeRow(await get(`${base(eventId)}/announcements/${noticeId}`))
}
