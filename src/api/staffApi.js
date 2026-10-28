// What a staff account (a person who helps run an event) reads from the server.
//
// There is NO staff backend yet (docs/BACKEND_REQUESTS.md): the invitation code, the event it opens,
// the notices for staff and the schedule are all dummy data here (the schedule lives in
// dummy/staffStore.js, shared with the organizer's 스태프 screens). When the backend gets staff
// APIs, replace the bodies below; the shapes stay.

import { DEMO_EVENT, DEMO_NOTICES } from '../dummy/demoData'
import { STAFF_INVITE, readStaffData } from '../dummy/staffStore'
import { demoDelay, isDemo } from '../utils/demo'

const notFound = () => Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })

// The event an invitation code (or the token of an invitation link) opens. 404 for a wrong code.
// Dummy: only the code the organizer sees in "스태프 초대" works, and it opens the organizer's event
// (known once the organizer opened the 스태프 screen in this browser).
export async function resolveStaffInvite(codeOrToken) {
  const value = codeOrToken.trim().toLowerCase()
  const known = [STAFF_INVITE.code, STAFF_INVITE.token].map((c) => c.toLowerCase())
  if (!known.includes(value) && !(isDemo() && value.length >= 4)) throw notFound()
  if (isDemo()) return demoDelay(DEMO_EVENT)
  // The event the organizer's staff screen announced (same browser); none yet = nothing to join.
  const event = readStaffData().event
  if (!event) throw notFound()
  return demoDelay(event)
}

// Notices for staff. Only in preview mode: without a backend a staff account has no event to read from.
export async function listStaffNotices() {
  return isDemo() ? demoDelay(DEMO_NOTICES.filter((n) => n.audiences.includes('STAFF'))) : []
}

export async function getStaffNotice(noticeId) {
  const found = (await listStaffNotices()).find((n) => n.id === noticeId)
  if (!found) throw notFound()
  return found
}
