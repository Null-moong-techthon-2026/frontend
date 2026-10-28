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
export const issueInvitation = (eventId, expiresAt) =>
  post(`/api/events/${eventId}/application-invitation`, { expiresAt })

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
