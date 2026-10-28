// Booth-recruitment endpoints (API_DRAFT.md section 5, organizer side only).
//
//   recruitment -> { eventId, introduction, publicationStatus:'DRAFT'|'PUBLISHED', closesAt,
//                    targetBoothCount, allowedCategoryCodes, participationFeeKrw, feeNote, revision,
//                    recruitmentStatus:'DRAFT'|'OPEN'|'CLOSED',
//                    documentRequirements:[{ id, name, isRequired, applicableCategoryCodes, sortOrder }] }

import { get, put } from './client'

// GET /api/events/:eventId/recruitment
export const getRecruitment = (eventId) => get(`/api/events/${eventId}/recruitment`)

// PUT /api/events/:eventId/recruitment -> recruitment. The whole form plus the current `revision`.
// Documents keep the `id` the server gave them; new ones have no id. After the first application
// the categories, fee and documents are locked (409 RECRUITMENT_TERMS_LOCKED).
export const saveRecruitment = (eventId, body) => put(`/api/events/${eventId}/recruitment`, body)
