// Event-opening applications ("행사 개설 신청"): an organizer applies, a platform administrator
// approves or rejects.
//
// DUMMY DATA: the deployed backend has no event-application API yet (no /api/event-applications,
// no /api/admin/**), so these functions keep the applications in this browser's localStorage and
// pretend to be the API. Approving only changes the status here: no organization or event is
// created. For now a submitted application is APPROVED at once and the organizer's dashboard shows
// a local dummy event made from it (see getDummyEvent). When the backend gets the API, replace the bodies below with the real calls:
//   POST /api/event-applications            GET /api/me/event-applications
//   GET  /api/admin/event-applications      POST /api/admin/event-applications/:id/decision
// The exported functions and the shapes they resolve with stay the same.
//
//   application -> { id, status:'PENDING'|'APPROVED'|'REJECTED', revision, submittedAt, reviewedAt,
//                    rejectionReason, createdEventId, applicantAccountId, applicantNickname,
//                    orgName, orgType, orgEmail, businessNumber, affiliation, representative, website,
//                    contactName, contactEmail, contactPhone, contactRole,
//                    eventName, eventKind, startDate, endDate, venue, boothCount, handover,
//                    paymentPlan, paymentMethod, receiptType, agreements:string[] }
//   page        -> { content: application[], page, size, totalElements, totalPages }

import { ApiError, get } from './client'
import { AGREEMENTS, APPLICATION_STATUS } from '../constants/eventApplication'
import { endOfLocalDate, startOfLocalDate } from '../utils/date'

const STORAGE_KEY = 'boothluck.dummy.eventApplications'
const EVENT_EDITS_KEY = 'boothluck.dummy.eventEdits'

export const DUMMY_EVENT_PREFIX = 'dummy-event-'

// The form keeps the agreements as { terms: true, ... }; the list wants the keys.
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

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

// Other people's applications, so the administrator screen has something to show.
const SEED = [
  {
    id: 'dummy-1',
    status: 'PENDING',
    submittedAt: daysAgo(1),
    applicantAccountId: 'dummy-account-1',
    applicantNickname: '김하늘',
    orgName: '인하대학교 총학생회',
    orgType: 'STUDENT',
    orgEmail: 'council@inha.example',
    businessNumber: '',
    affiliation: '인하대학교',
    representative: '김하늘',
    website: '',
    contactName: '김하늘',
    contactEmail: 'sky@inha.example',
    contactPhone: '01011112222',
    contactRole: '총학생회장',
    eventName: '비룡제 2026',
    eventKind: 'UNIVERSITY',
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    venue: '인하대학교',
    boothCount: 40,
    handover: '',
    paymentPlan: 'PREPAID',
    paymentMethod: 'TRANSFER',
    receiptType: 'TAX_INVOICE',
  },
  {
    id: 'dummy-2',
    status: 'PENDING',
    submittedAt: daysAgo(3),
    applicantAccountId: 'dummy-account-2',
    applicantNickname: '이도윤',
    orgName: '도윤마켓',
    orgType: 'COMPANY',
    orgEmail: 'hello@doyun.example',
    businessNumber: '123-45-67890',
    affiliation: '',
    representative: '이도윤',
    website: 'https://doyun.example',
    contactName: '이도윤',
    contactEmail: 'doyun@doyun.example',
    contactPhone: '01033334444',
    contactRole: '대표',
    eventName: '도윤 플리마켓',
    eventKind: 'FLEA',
    startDate: '2026-12-12',
    endDate: '2026-12-13',
    venue: '송도 센트럴파크',
    boothCount: 25,
    handover: '',
    paymentPlan: 'BASE_PLUS_SLOT',
    paymentMethod: 'CARD',
    receiptType: 'CASH_RECEIPT',
  },
  {
    id: 'dummy-3',
    status: 'APPROVED',
    submittedAt: daysAgo(8),
    reviewedAt: daysAgo(7),
    applicantAccountId: 'dummy-account-3',
    applicantNickname: '박서연',
    orgName: '미추홀구청',
    orgType: 'PUBLIC',
    orgEmail: 'culture@michuhol.example',
    businessNumber: '',
    affiliation: '미추홀구청 문화과',
    representative: '박서연',
    website: '',
    contactName: '박서연',
    contactEmail: 'seoyeon@michuhol.example',
    contactPhone: '01055556666',
    contactRole: '주무관',
    eventName: '미추홀 가을 축제',
    eventKind: 'LOCAL',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    venue: '미추홀구 문화광장',
    boothCount: 60,
    handover: '',
    paymentPlan: 'PREPAID',
    paymentMethod: 'TRANSFER',
    receiptType: 'TAX_INVOICE',
  },
].map((a) => ({
  revision: 0,
  reviewedAt: null,
  rejectionReason: null,
  createdEventId: null,
  agreements: AGREEMENTS.map((g) => g.key),
  ...a,
}))

// The dummy list lives in localStorage; it can be unavailable (private window, blocked data), then
// it only lasts until the page is reloaded.
let memory = null

const load = () => {
  if (memory) return memory
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(stored)) return (memory = stored)
  } catch {
    // fall through to the seed
  }
  return (memory = SEED)
}

const save = (list) => {
  memory = list
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // keep it in memory only
  }
}

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 150))

const asPage = (list, page = 0, size = 20) => ({
  content: list.slice(page * size, (page + 1) * size),
  page,
  size,
  totalElements: list.length,
  totalPages: Math.max(1, Math.ceil(list.length / size)),
})

const newestFirst = (list) => [...list].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

// Resolves with the saved application. 409 DUPLICATE_APPLICATION while another one of this
// account is still waiting for review.
export const submitEventApplication = async (form) => {
  const me = await get('/api/me')
  const list = load()
  if (list.some((a) => a.applicantAccountId === me.id && a.status === APPLICATION_STATUS.PENDING)) {
    throw new ApiError(409, 'DUPLICATE_APPLICATION', '이미 검토 중인 신청이 있어요.')
  }
  const id = `dummy-${Date.now()}`
  const application = {
    ...toRequest(form),
    id,
    // Dummy: no review step for now, a submitted application is approved at once.
    status: APPLICATION_STATUS.APPROVED,
    revision: 1,
    submittedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    rejectionReason: null,
    createdEventId: `${DUMMY_EVENT_PREFIX}${id}`,
    applicantAccountId: me.id,
    applicantNickname: me.nickname,
  }
  save([application, ...list])
  return delay(application)
}

// The logged-in account's applications, newest first (the first one is the latest).
export const listMyEventApplications = async () => {
  const me = await get('/api/me')
  return delay(asPage(newestFirst(load().filter((a) => a.applicantAccountId === me.id))))
}

// ---- administrator ----

// params: { status, page, size } -> page + { summary:{total,pending,approved,rejected} }
export const listEventApplicationsForAdmin = (params = {}) => {
  const all = load()
  const count = (status) => all.filter((a) => a.status === status).length
  const shown = newestFirst(params.status ? all.filter((a) => a.status === params.status) : all)
  return delay({
    ...asPage(shown, Number(params.page) || 0, Number(params.size) || 20),
    summary: {
      total: all.length,
      pending: count(APPLICATION_STATUS.PENDING),
      approved: count(APPLICATION_STATUS.APPROVED),
      rejected: count(APPLICATION_STATUS.REJECTED),
    },
  })
}

// body: { revision, decision:'APPROVED'|'REJECTED', rejectionReason? } -> the decided application.
// A decision cannot be changed afterwards. (Dummy: approving does not create an event.)
export const decideEventApplication = async (id, body) => {
  const list = load()
  const current = list.find((a) => a.id === id)
  if (!current) throw new ApiError(404, 'RESOURCE_NOT_FOUND', '신청을 찾을 수 없어요.')
  if (current.status !== APPLICATION_STATUS.PENDING) {
    throw new ApiError(409, 'INVALID_STATE', '이미 처리된 신청이에요.')
  }
  const decided = {
    ...current,
    status: body.decision,
    revision: current.revision + 1,
    reviewedAt: new Date().toISOString(),
    rejectionReason: body.decision === 'REJECTED' ? (body.rejectionReason ?? '') : null,
  }
  save(list.map((a) => (a.id === id ? decided : a)))
  return delay(decided)
}

// ---- the dummy event ----

const loadEdits = () => {
  try {
    return JSON.parse(localStorage.getItem(EVENT_EDITS_KEY)) ?? {}
  } catch {
    return {}
  }
}

// The event the dashboard works with while the backend cannot create one: made from the account's
// latest approved application, in the shape of the backend's event (utils/event.js toEvent), with
// the organizer's later edits applied. null when the account has no approved application.
export const getDummyEvent = (accountId) => {
  const app = newestFirst(load().filter((a) => a.applicantAccountId === accountId && a.createdEventId))[0]
  if (!app || app.status !== APPLICATION_STATUS.APPROVED) return null
  return {
    id: app.createdEventId,
    name: app.eventName,
    organization: { name: app.orgName },
    venue: app.venue,
    startsAt: startOfLocalDate(app.startDate),
    endsAt: endOfLocalDate(app.endDate),
    description: '',
    posterUrl: null,
    posterAssetId: null,
    publicationStatus: 'DRAFT',
    revision: 0,
    ...(loadEdits()[app.createdEventId] ?? {}),
  }
}

// fields: any of { name, venue, description, startsAt, endsAt } -> the updated dummy event.
export const updateDummyEvent = (accountId, eventId, fields) => {
  const edits = { ...loadEdits(), [eventId]: { ...(loadEdits()[eventId] ?? {}), ...fields } }
  try {
    localStorage.setItem(EVENT_EDITS_KEY, JSON.stringify(edits))
  } catch {
    // keep going: the screen shows the new values until the page is reloaded
  }
  return { ...getDummyEvent(accountId), ...fields }
}
