// Map endpoints for the organizer (API_DRAFT.md section 7). An event has at most one DRAFT map
// (being edited) and one PUBLISHED map (what visitors see).
//
//   image    -> { mediaAssetId, widthPx, heightPx, readUrl, expiresAt }
//   map      -> { floorPlanId, versionNo, publicationStatus, revision, image, createdAt, updatedAt, pins? }
//   pin      -> { id, pinType, label, xRatio, yRatio, eventBoothId }     ratios are 0..1 of the image

import { del, get, post, put, query } from './client'

const base = (eventId) => `/api/events/${eventId}`

// GET .../map-editor -> { publishedMap: map-without-pins | null, draftMap: map-with-pins | null }
export const getMapEditor = (eventId) => get(`${base(eventId)}/map-editor`)

// POST .../floor-plans { mediaAssetId } or { sourceFloorPlanId } -> 201 draft map (with pins).
// 409 INVALID_STATE when a draft already exists. A source map is cloned with new pin ids.
export const createFloorPlan = (eventId, body) => post(`${base(eventId)}/floor-plans`, body)

// PUT .../floor-plans/:id { revision, pins } -> draft map. `pins` is the COMPLETE set (max 500);
// pins left out are deleted. Pin ids are chosen by the client (UUID).
export const replacePins = (eventId, floorPlanId, revision, pins) =>
  put(`${base(eventId)}/floor-plans/${floorPlanId}`, { revision, pins })

// DELETE .../floor-plans/:id?revision= -> 204 (drafts only)
export const deleteFloorPlan = (eventId, floorPlanId, revision) =>
  del(`${base(eventId)}/floor-plans/${floorPlanId}${query({ revision })}`)

// POST .../floor-plans/:id/publication { revision } -> the now PUBLISHED map. The previous
// published map is archived.
export const publishFloorPlan = (eventId, floorPlanId, revision) =>
  post(`${base(eventId)}/floor-plans/${floorPlanId}/publication`, { revision })

// GET /api/public/events/:eventId/map -> { floorPlanId, versionNo, revision, image, pins } of the
// published map as visitors see it (only PUBLIC booths). 404 MAP_NOT_PUBLISHED / RESOURCE_NOT_FOUND
// when the event or the map is not published.
export const getPublicMap = (eventId) => get(`/api/public/events/${eventId}/map`)
