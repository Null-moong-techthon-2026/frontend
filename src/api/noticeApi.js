// Announcement endpoints for the organizer (API_DRAFT.md section 9).
//
//   announcement -> { id, eventId, title, body, isUrgent, publicationStatus:'DRAFT'|'PUBLISHED',
//                     audiences:('STAFF'|'OPERATORS'|'PUBLIC')[], publishedAt, createdAt, updatedAt,
//                     revision, imageAssetId, imageUrl }          (list rows have no body / image)

import { del, get, post, put, query } from './client'

const base = (eventId) => `/api/events/${eventId}/announcements`

// GET .../announcements?view=MANAGE&page&size -> page of announcement summaries
export const listAnnouncements = (eventId, params) =>
  get(`${base(eventId)}${query({ view: 'MANAGE', ...params })}`)

export const getAnnouncement = (eventId, id) => get(`${base(eventId)}/${id}`)

// POST .../announcements { title, body, imageAssetId?, audiences, isUrgent, publicationStatus } -> 201 announcement
export const createAnnouncement = (eventId, body) => post(base(eventId), body)

// PUT .../announcements/:id { revision, ...all fields } -> announcement. Replaces everything, so
// send the full set even to flip only the publication status.
export const updateAnnouncement = (eventId, id, body) => put(`${base(eventId)}/${id}`, body)

// DELETE .../announcements/:id?revision= -> 204 (cannot be restored)
export const deleteAnnouncement = (eventId, id, revision) =>
  del(`${base(eventId)}/${id}${query({ revision })}`)

// Loads every page of the manage list (at most 100 per page).
export async function listAllAnnouncements(eventId) {
  const all = []
  for (let page = 0; ; page++) {
    const result = await listAnnouncements(eventId, { page, size: 100 })
    all.push(...result.content)
    if (page + 1 >= result.totalPages) return all
  }
}
