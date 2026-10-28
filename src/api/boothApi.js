// Booth endpoints for the organizer (API_DRAFT.md sections 6 and 8): reviewing applications, the
// approved / manually registered booths, and their day-of operation.
//
//   page  -> { content: [], page, size, totalElements, totalPages }
//   application row    -> { applicationId, boothName, submittedAt, categoryCode, applicantName,
//                           reviewStatus, eventBoothId, boothCode }
//   application detail -> { applicationId, revision, submittedAt, reviewStatus,
//                           booth:{name,categoryCode,introduction}, applicant:{name,phoneNumber,email},
//                           documents:[{requirementId,name,isRequired,checkStatus,revision,reviewNote,checkedAt}],
//                           reviewNote, rejectionReason, reviewedAt, eventBoothId, boothCode }
//   booth row    -> { eventBoothId, boothCode, name, categoryCode, operationStatus, stockSummary,
//                     placementStatus, lastChangedAt, source, visibilityStatus, revision }
//   booth detail -> row fields + { description, items:[{id,name,description,priceKrw,stockStatus,sortOrder,revision,updatedAt}],
//                     mapPlacement: null | { floorPlanId, versionNo, revision, imageUrl, widthPx, heightPx, pinId, label, xRatio, yRatio } }

import { del, get, patch, post, query } from './client'

const base = (eventId) => `/api/events/${eventId}`

// ---- applications ----

// GET .../applications?page&size&q&categoryCode&reviewStatus&sort=submittedAt,desc|asc
export const listApplications = (eventId, params) =>
  get(`${base(eventId)}/applications${query(params)}`)

// GET .../applications/summary -> { total, pending, approved, rejected } (whole event, no filters)
export const getApplicationSummary = (eventId) => get(`${base(eventId)}/applications/summary`)

export const getApplication = (eventId, applicationId) =>
  get(`${base(eventId)}/applications/${applicationId}`)

// PATCH .../review-note { revision, reviewNote } -> { applicationId, revision }
export const saveReviewNote = (eventId, applicationId, revision, reviewNote) =>
  patch(`${base(eventId)}/applications/${applicationId}/review-note`, { revision, reviewNote })

// PATCH .../document-checks/:requirementId { revision, checkStatus, reviewNote? }
//   -> { requirementId, checkStatus, revision }   (the revision of that document check)
export const checkDocument = (eventId, applicationId, requirementId, body) =>
  patch(`${base(eventId)}/applications/${applicationId}/document-checks/${requirementId}`, body)

// POST .../decision { revision, decision:'APPROVED'|'REJECTED', boothCode?, rejectionReason?, reviewNote? }
//   -> { applicationId, reviewStatus, eventBoothId, boothCode, revision }
// Approving needs every required document VERIFIED (409 DOCUMENTS_NOT_VERIFIED); rejecting needs a
// reason. A decision cannot be changed afterwards.
export const decideApplication = (eventId, applicationId, body) =>
  post(`${base(eventId)}/applications/${applicationId}/decision`, body)

// ---- booths (approved applications + booths registered by the organizer) ----

// GET .../booths?page&size&q&categoryCode&operationStatus&stockSummary&placementStatus&source&visibilityStatus&sort
export const listBooths = (eventId, params) => get(`${base(eventId)}/booths${query(params)}`)

// GET .../operations?... (default size 8) -> { summary:{total,preparing,open,soldOut,closed}, booths: page, asOf }
export const getOperations = (eventId, params) => get(`${base(eventId)}/operations${query(params)}`)

export const getBooth = (eventId, boothId) => get(`${base(eventId)}/booths/${boothId}`)

// POST .../booths { name, categoryCode, description?, boothCode? } -> 201 booth detail
export const createBooth = (eventId, body) => post(`${base(eventId)}/booths`, body)

// PATCH .../booths/:boothId { revision, name?, categoryCode?, description?, visibilityStatus? } -> booth detail
export const patchBooth = (eventId, boothId, body) => patch(`${base(eventId)}/booths/${boothId}`, body)

// PATCH .../booths/:boothId/operation-status { revision, operationStatus } -> booth detail
export const setOperationStatus = (eventId, boothId, revision, operationStatus) =>
  patch(`${base(eventId)}/booths/${boothId}/operation-status`, { revision, operationStatus })

// PATCH .../booths/:boothId/items/:itemId { revision, stockStatus?, name?, priceKrw?, ... } -> the item
export const patchItem = (eventId, boothId, itemId, body) =>
  patch(`${base(eventId)}/booths/${boothId}/items/${itemId}`, body)

// POST .../booths/:boothId/items { name, description?, priceKrw?, stockStatus?, sortOrder? } -> 201 the item
export const createItem = (eventId, boothId, body) =>
  post(`${base(eventId)}/booths/${boothId}/items`, body)

// DELETE .../booths/:boothId/items/:itemId?revision= -> 204
export const deleteItem = (eventId, boothId, itemId, revision) =>
  del(`${base(eventId)}/booths/${boothId}/items/${itemId}${query({ revision })}`)

// GET /api/me/applications, /api/me/booths -> page. Operator side; the organizer screens only use
// them to recognise an operator account (one that applied or runs a booth).
export const listMyApplications = () => get(`/api/me/applications${query({ page: 0, size: 1 })}`)
export const listMyBooths = () => get(`/api/me/booths${query({ page: 0, size: 1 })}`)

// Loads every page of a booth list (the backend allows at most 100 per page).
export async function listAllBooths(eventId, params = {}) {
  const all = []
  for (let page = 0; ; page++) {
    const result = await listBooths(eventId, { ...params, page, size: 100 })
    all.push(...result.content)
    if (page + 1 >= result.totalPages) return all
  }
}
