// Event-opening applications ("행사 개설 신청"): an organizer applies, a platform administrator
// approves or rejects, and approving opens the event for the applicant.
//
//   application -> { id, status:'PENDING'|'APPROVED'|'REJECTED', revision, submittedAt, reviewedAt,
//                    rejectionReason, createdEventId, applicantAccountId, applicantNickname,
//                    orgName, orgType, orgEmail, businessNumber, affiliation, representative, website,
//                    contactName, contactEmail, contactPhone, contactRole,
//                    eventName, eventKind, startDate, endDate, venue, boothCount, handover,
//                    paymentPlan, paymentMethod, receiptType, agreements:string[] }
//   page        -> { content: application[], page, size, totalElements, totalPages }

import { get, post, query } from './client'
import { AGREEMENTS } from '../constants/eventApplication'

// The form keeps the agreements as { terms: true, ... }; the backend wants the list of keys.
const toRequest = (form) => ({
  orgName: form.orgName,
  orgType: form.orgType,
  orgEmail: form.orgEmail,
  businessNumber: form.businessNumber,
  affiliation: form.affiliation,
  representative: form.representative,
  website: form.website,
  contactName: form.contactName,
  contactEmail: form.contactEmail,
  contactPhone: form.contactPhone,
  contactRole: form.contactRole,
  eventName: form.eventName,
  eventKind: form.eventKind,
  startDate: form.startDate,
  endDate: form.endDate,
  venue: form.venue,
  boothCount: form.boothCount,
  handover: form.handover,
  paymentPlan: form.paymentPlan,
  paymentMethod: form.paymentMethod,
  receiptType: form.receiptType,
  agreements: AGREEMENTS.filter((a) => form.agreements[a.key]).map((a) => a.key),
})

// POST /api/event-applications -> 201 application. 409 DUPLICATE_APPLICATION while another one of
// this account is still waiting for review.
export const submitEventApplication = (form) => post('/api/event-applications', toRequest(form))

// GET /api/me/event-applications -> page, newest first (the first one is the latest).
export const listMyEventApplications = () => get(`/api/me/event-applications${query({ page: 0, size: 20 })}`)

// ---- platform administrator only (403 FORBIDDEN for everyone else) ----

// GET /api/admin/event-applications?status&page&size -> page + { summary:{total,pending,approved,rejected} }
export const listEventApplicationsForAdmin = (params) => get(`/api/admin/event-applications${query(params)}`)

// POST /api/admin/event-applications/:id/decision { revision, decision:'APPROVED'|'REJECTED', rejectionReason? }
//   -> application. Approving opens the event (organization + draft event owned by the applicant) in
//   the same step. A decision cannot be changed afterwards.
export const decideEventApplication = (id, body) =>
  post(`/api/admin/event-applications/${id}/decision`, body)
