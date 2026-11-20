// Event endpoints of the backend (backend-main/docs/API_DRAFT.md sections 3-4). Every call needs a
// logged-in session. Writes carry the resource `revision` the page last saw (409 REVISION_CONFLICT
// when it is stale).
//
//   event -> { id, name, organization:{id,name}, venue, startsAt, endsAt, scheduleStatus,
//              publicationStatus, description, posterUrl, posterAssetId, revision, capabilities }

import { del, get, patch, post, query } from './client'

// GET /api/me/events -> { content: event[], page, size, totalElements, totalPages }
export const listMyEvents = (participation = 'ORGANIZER', page = 0, size = 20) =>
  get(`/api/me/events${query({ participation, page, size })}`)

// POST /api/event-openings -> 201 { id, status:'PENDING', createdAt, revision }. The application waits for
// the 부스럭 team: nothing is created until it is approved (then the organization, the event and an empty
// recruitment appear and the account becomes the organization's OWNER).
// body: { orgName, orgType, eventName, startsAt, endsAt, venue }
export const openEvent = (body) => post('/api/event-openings', body)

//   opening -> { id, applicantAccountId, orgName, orgType, eventName, startsAt, endsAt, venue,
//                status:'PENDING'|'APPROVED'|'REJECTED', createdAt, reviewedAt, reviewedBy, rejectionReason,
//                eventId, organizationId, revision }
// GET /api/me/event-openings -> { content: opening[], page, size, totalElements, totalPages } (the account's own)
export const listMyOpenings = () => get(`/api/me/event-openings${query({ page: 0, size: 20 })}`)

// Administrator only (the account's /api/me role is ADMIN; other accounts get 403):
// GET /api/admin/event-openings?status&page&size, GET .../:id, POST .../:id/decision
//   decision body { decision:'APPROVED'|'REJECTED', rejectionReason?, revision }
export const listAdminOpenings = (params) => get(`/api/admin/event-openings${query(params)}`)
export const getAdminOpening = (id) => get(`/api/admin/event-openings/${id}`)
// 시연 데이터 초기화 (ADMIN only; the server must have DEMO_RESET_ENABLED=true). Restores the demo event
// to its saved starting state; accounts, passwords and event ids stay. The requestId is made per click and
// reused when the same click is retried after a network error.
export const DEMO_EVENT_ID = 'd3e02026-1111-4000-8000-000000000200'
export const resetDemo = (body) => post('/api/admin/demo/reset', { confirmation: 'RESET_DEMO', ...body })
export const decideOpening = (id, body) => post(`/api/admin/event-openings/${id}/decision`, body)

// The operations office's phone number: the contact of the published recruitment (`contactPhone`, read
// from the public recruitment page). null when there is none or the recruitment is not public.
export async function getEventContactPhone(eventId) {
  try {
    const recruitment = await get(`/api/public/events/${eventId}/recruitment`)
    return recruitment.contactPhone || null
  } catch {
    return null
  }
}

// GET /api/events/:eventId
export const getEvent = (eventId) => get(`/api/events/${eventId}`)

// PATCH /api/events/:eventId -> event. body: revision + any of name, venue, startsAt, endsAt,
// description, posterAssetId, publicationStatus. Omitted fields stay as they are.
export const updateEvent = (eventId, body) => patch(`/api/events/${eventId}`, body)

// GET /api/events/:eventId/dashboard
//   -> { boothSummary:{total,preparing,open,soldOut,closed}, recentAnnouncements: announcement[], asOf }
export const getDashboard = (eventId) => get(`/api/events/${eventId}/dashboard`)

// GET /api/events/:eventId/application-invitation -> { invitation: { id, createdAt, expiresAt, active } | null }
export const getInvitation = (eventId) => get(`/api/events/${eventId}/application-invitation`)

// POST .../application-invitation -> 201 { id, code, inviteUrl, expiresAt }. The raw code is only
// returned here; the previous invitation stops working.
// The server builds `inviteUrl` from a setting of its own; the link is made here from the code and this
// site's address, so it opens this site whatever the server is configured with.
export const inviteLink = (code) => `${window.location.origin}/invite/${code}`

export const issueInvitation = async (eventId, expiresAt) => {
  const issued = await post(`/api/events/${eventId}/application-invitation`, { expiresAt })
  return { ...issued, inviteUrl: inviteLink(issued.code) }
}

// DELETE .../application-invitation -> 204
export const revokeInvitation = (eventId) => del(`/api/events/${eventId}/application-invitation`)

// POST /api/events/:eventId/media-assets (multipart `file`, PNG/JPEG up to 10 MiB)
//   -> 201 { mediaAssetId, widthPx, heightPx, readUrl, expiresAt }
// Used for the event image, the notice image and the floor plan.
export function uploadImage(eventId, file) {
  const form = new FormData()
  form.append('file', file)
  return post(`/api/events/${eventId}/media-assets`, form)
}
