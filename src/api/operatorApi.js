// What a booth operator (logged in) does: find a recruiting event, apply with a booth profile,
// run the approved booth (status, menu, stock, info), read notices.
//
// Real backend:
//   GET  /api/public/events?recruitmentStatus=OPEN      recruiting events (+ /public/events/:id/recruitment each)
//   POST /api/application-invitations/resolve {code}    recruitment notice behind an invitation code
//   GET/POST/PATCH /api/me/booth-profiles               the operator's reusable booth profiles
//   POST /api/events/:id/applications                   apply
//   GET  /api/me/applications, /api/me/booths           my applications / my booths
//   GET/PATCH /api/events/:id/booths/:boothId[/...]     my booth: detail, info, operation status, menu items
//   GET  /api/events/:id/announcements?view=READ        notices readable by operators
// Not in the backend (docs/BACKEND_REQUESTS.md): booth hours / SNS, extra application questions and
// documents, payments, the event's contact phone. In ?demo mode everything comes from
// src/dummy/demoData.js and changes are kept in memory.
//
// View models:
//   recruitment { eventId, event, introduction, closesAt, targetBoothCount, feeKrw, feeNote,
//                 categories:string[], documents:[{id,name,required,categories}], status }
//   application { id, eventId, eventName, boothName, categoryCode, status, submittedAt,
//                 rejectionReason, boothId, boothCode }
//   myBooth     { id, code, name, categoryCode, operationStatus, visibilityStatus, revision,
//                 eventId, eventName, venue, startDate, endDate }
//   boothDetail { ...booth fields, intro, items:[{id,name,priceKrw,stockStatus,revision}], placement, photos:[{id,url}] }

import {
  DEMO_BOOTHS,
  DEMO_EVENT,
  DEMO_MAP_IMAGE,
  DEMO_MY_APPLICATIONS,
  DEMO_NOTICES,
  DEMO_PAYMENTS,
  DEMO_PROFILES,
  DEMO_RECRUITING,
} from '../dummy/demoData'
import { demoDelay, isDemo, isDemoNewcomer } from '../utils/demo'
import { todayYmd } from '../utils/eventDays'
import { cleanInviteCode } from '../utils/inviteCode'
import { toEvent } from '../utils/event'
import * as boothApi from './boothApi'
import { get, patch, post, put, query } from './client'
import { toAttachments } from '../utils/notice'

const eventFrom = (raw) => ({
  ...toEvent(raw),
  organizationName: raw.organization?.name ?? raw.organizationName ?? '',
  hours: null,
  phone: null,
  directions: null,
})

const recruitmentView = (raw) => ({
  eventId: raw.event?.id ?? raw.eventId,
  event: eventFrom(raw.event),
  introduction: raw.introduction ?? '',
  closesAt: raw.closesAt,
  targetBoothCount: raw.targetBoothCount ?? null,
  feeKrw: raw.participationFeeKrw ?? null,
  feeNote: raw.feeNote ?? '',
  categories: raw.allowedCategoryCodes ?? [],
  documents: (raw.documentRequirements ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    required: d.isRequired,
    categories: d.applicableCategoryCodes ?? [],
  })),
  contactPhone: raw.contactPhone ?? '',
  questions: (raw.additionalQuestions ?? []).map((q) => ({ id: q.id, label: q.question, required: q.isRequired })),
  status: raw.recruitmentStatus ?? 'OPEN',
})

const demoRecruitment = (item) => ({
  eventId: item.event.id,
  event: item.event,
  introduction: item.recruitment.introduction,
  closesAt: item.recruitment.closesAt,
  targetBoothCount: item.recruitment.targetBoothCount,
  feeKrw: item.recruitment.participationFeeKrw,
  feeNote: item.recruitment.feeNote,
  categories: item.recruitment.allowedCategoryCodes,
  documents: item.recruitment.documentRequirements.map((d) => ({
    id: d.id,
    name: d.name,
    required: d.isRequired,
    categories: d.applicableCategoryCodes,
  })),
  contactPhone: '',
  questions: [],
  status: 'OPEN',
})

// ---------------- finding an event ----------------

export async function getRecruitment(eventId) {
  if (isDemo()) {
    const found = DEMO_RECRUITING.find((r) => r.event.id === eventId)
    if (!found) throw Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })
    return demoDelay(demoRecruitment(found))
  }
  return recruitmentView(await get(`/api/public/events/${eventId}/recruitment`))
}

export async function listRecruitingEvents() {
  if (isDemo()) return demoDelay(DEMO_RECRUITING.map(demoRecruitment))
  const page = await get(`/api/public/events${query({ recruitmentStatus: 'OPEN', page: 0, size: 50 })}`)
  const results = await Promise.allSettled(page.content.map((e) => getRecruitment(e.id)))
  const today = todayYmd()
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((r) => !r.event.endDate || r.event.endDate >= today) // an event that is over takes no applications
}

// The recruitment notice behind an invitation code (404 when the code is wrong, expired or ended).
export async function resolveInvitation(code) {
  const trimmed = cleanInviteCode(code)
  if (isDemo()) {
    if (trimmed.length < 4) throw Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })
    return demoDelay(demoRecruitment(DEMO_RECRUITING[0]))
  }
  return recruitmentView(await post('/api/application-invitations/resolve', { code: trimmed }))
}

// ---------------- my booth profiles / applications ----------------

const profileView = (p) => ({
  id: p.id,
  name: p.name,
  categoryCode: p.categoryCode,
  introduction: p.introduction ?? '',
  revision: p.revision ?? 0,
})

let demoProfiles = null
const demoProfileList = () => (demoProfiles ??= DEMO_PROFILES.map((p) => ({ ...p })))

export async function listBoothProfiles() {
  if (isDemo()) return demoDelay(isDemoNewcomer() ? demoProfileList().slice(0, 0) : demoProfileList())
  const page = await get(`/api/me/booth-profiles${query({ page: 0, size: 50 })}`)
  return page.content.map(profileView)
}

export async function createBoothProfile({ name, categoryCode, introduction }) {
  if (isDemo()) {
    const created = { id: `demo-profile-${Date.now()}`, name, categoryCode, introduction, revision: 0 }
    demoProfileList().push(created)
    return demoDelay(created)
  }
  return profileView(await post('/api/me/booth-profiles', { name, categoryCode, introduction }))
}

export async function updateBoothProfile(profile, fields) {
  if (isDemo()) {
    Object.assign(profile, fields)
    return demoDelay({ ...profile })
  }
  return profileView(await patch(`/api/me/booth-profiles/${profile.id}`, { revision: profile.revision, ...fields }))
}

const applicationView = (a) => ({
  id: a.applicationId,
  eventId: a.eventId,
  eventName: a.eventName,
  boothName: a.boothName,
  categoryCode: a.categoryCode,
  status: a.reviewStatus,
  submittedAt: a.submittedAt,
  rejectionReason: a.rejectionReason ?? null,
  cancelReason: a.cancelReason ?? null,
  boothId: a.eventBoothId ?? null,
  boothCode: a.boothCode ?? null,
})

let demoApplications = null
const demoApplicationList = () => (demoApplications ??= DEMO_MY_APPLICATIONS.map(applicationView))

export async function listMyApplicationViews() {
  if (isDemo()) return demoDelay(isDemoNewcomer() ? [] : demoApplicationList())
  const page = await get(`/api/me/applications${query({ page: 0, size: 50 })}`)
  return page.content.map(applicationView)
}

// body: { boothProfileId, applicantName, applicantPhone, applicantEmail, invitationCode? }
export async function submitBoothApplication(eventId, body, recruitment) {
  if (isDemo()) {
    const profile = demoProfileList().find((p) => p.id === body.boothProfileId)
    const created = applicationView({
      applicationId: `demo-app-${Date.now()}`,
      eventId,
      eventName: recruitment?.event.name ?? '',
      boothName: profile?.name ?? '',
      categoryCode: profile?.categoryCode ?? 'OTHER',
      reviewStatus: 'PENDING',
      submittedAt: new Date().toISOString(),
    })
    demoApplicationList().unshift(created)
    return demoDelay(created)
  }
  return post(`/api/events/${eventId}/applications`, body)
}

// A required (or optional) document of the application: one file per requirement of the recruitment.
// POST .../applications/:applicationId/documents?requirementId=:id (multipart `file`); uploading again
// replaces the file (the call then also needs the document's `revision`).
export async function uploadApplicationDocument(eventId, applicationId, requirementId, file, revision) {
  if (isDemo()) return demoDelay(null)
  const form = new FormData()
  form.append('file', file)
  return post(`/api/events/${eventId}/applications/${applicationId}/documents${query({ requirementId, revision })}`, form)
}

// ---------------- my booth ----------------

const myBoothView = (b) => ({
  id: b.eventBoothId,
  code: b.boothCode ?? '',
  name: b.name,
  categoryCode: b.categoryCode,
  operationStatus: b.operationStatus,
  visibilityStatus: b.visibilityStatus,
  revision: b.revision,
  eventId: b.eventId,
  eventName: b.eventName,
  venue: b.venue ?? '',
  startDate: toEvent({ startsAt: b.startsAt, endsAt: b.endsAt }).startDate,
  endDate: toEvent({ startsAt: b.startsAt, endsAt: b.endsAt }).endDate,
})

// Demo: one mutable booth so changes made on the screens stick while previewing.
let demoBooth = null
const demoState = () =>
  (demoBooth ??= (() => {
    const source = DEMO_BOOTHS[0]
    return {
      id: source.id,
      code: source.code,
      name: source.name,
      categoryCode: source.categoryCode,
      operationStatus: source.operationStatus,
      visibilityStatus: 'PUBLIC',
      revision: 0,
      eventId: DEMO_EVENT.id,
      eventName: DEMO_EVENT.name,
      venue: DEMO_EVENT.venue,
      startDate: DEMO_EVENT.startDate,
      endDate: DEMO_EVENT.endDate,
      intro: source.intro,
      items: source.items.map((i) => ({ ...i, revision: 0 })),
      placement: {
        pinId: source.placement.pinId,
        xRatio: source.placement.xRatio,
        yRatio: source.placement.yRatio,
        imageUrl: DEMO_MAP_IMAGE.url,
        widthPx: DEMO_MAP_IMAGE.widthPx,
        heightPx: DEMO_MAP_IMAGE.heightPx,
        label: '중앙광장 먹거리 구역',
      },
      photos: [],
    }
  })())

export async function listMyBoothViews() {
  if (isDemo()) {
    if (isDemoNewcomer()) return demoDelay([])
    const { id, code, name, categoryCode, operationStatus, visibilityStatus, revision, eventId, eventName, venue, startDate, endDate } = demoState()
    return demoDelay([{ id, code, name, categoryCode, operationStatus, visibilityStatus, revision, eventId, eventName, venue, startDate, endDate }])
  }
  const page = await get(`/api/me/booths${query({ page: 0, size: 50 })}`)
  return page.content.map(myBoothView)
}

// The booth's photos (first = the cover): `photos:[{mediaAssetId, sortOrder, imageUrl}]`.
const photosOf = (raw) => (raw.photos ?? []).map((p) => ({ id: p.mediaAssetId, url: p.imageUrl ?? null }))

const detailView = (raw, eventId) => ({
  id: raw.eventBoothId,
  code: raw.boothCode ?? '',
  name: raw.name,
  categoryCode: raw.categoryCode,
  operationStatus: raw.operationStatus,
  visibilityStatus: raw.visibilityStatus,
  revision: raw.revision,
  eventId,
  intro: raw.description ?? '',
  items: (raw.items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    priceKrw: i.priceKrw ?? null,
    stockStatus: i.stockStatus,
    revision: i.revision,
  })),
  placement: raw.mapPlacement
    ? {
        pinId: raw.mapPlacement.pinId,
        xRatio: Number(raw.mapPlacement.xRatio),
        yRatio: Number(raw.mapPlacement.yRatio),
        imageUrl: raw.mapPlacement.imageUrl,
        widthPx: raw.mapPlacement.widthPx,
        heightPx: raw.mapPlacement.heightPx,
        label: raw.mapPlacement.label ?? '',
      }
    : null,
  photos: photosOf(raw),
})

export async function getMyBoothDetail(booth) {
  if (isDemo()) return demoDelay({ ...demoState(), items: demoState().items.map((i) => ({ ...i })) })
  return detailView(await boothApi.getBooth(booth.eventId, booth.id), booth.eventId)
}

// Every write below resolves with the fresh booth detail.
const reread = (booth) => getMyBoothDetail(booth)

export async function changeOperationStatus(booth, status) {
  if (isDemo()) {
    demoState().operationStatus = status
    return reread(booth)
  }
  await boothApi.setOperationStatus(booth.eventId, booth.id, booth.revision, status)
  return reread(booth)
}

export async function changeBoothInfo(booth, fields) {
  if (isDemo()) {
    const state = demoState()
    if ('name' in fields) state.name = fields.name
    if ('description' in fields) state.intro = fields.description
    return reread(booth)
  }
  await boothApi.patchBooth(booth.eventId, booth.id, { revision: booth.revision, ...fields })
  return reread(booth)
}

export async function changeItemStock(booth, item, stockStatus) {
  if (isDemo()) {
    demoState().items.find((i) => i.id === item.id).stockStatus = stockStatus
    return reread(booth)
  }
  await boothApi.patchItem(booth.eventId, booth.id, item.id, { revision: item.revision, stockStatus })
  return reread(booth)
}

export async function changeItem(booth, item, fields) {
  if (isDemo()) {
    Object.assign(demoState().items.find((i) => i.id === item.id), fields)
    return reread(booth)
  }
  await boothApi.patchItem(booth.eventId, booth.id, item.id, { revision: item.revision, ...fields })
  return reread(booth)
}

// Photos: upload one file (-> its media asset id), then save the whole ordered list of ids (first =
// cover, at most 10). Both resolve with the fresh booth detail.
export async function addBoothPhoto(booth, file, currentIds) {
  if (isDemo()) {
    demoState().photos = [...demoState().photos, { id: `demo-photo-${Date.now()}`, url: URL.createObjectURL(file) }]
    return reread(booth)
  }
  const form = new FormData()
  form.append('file', file)
  const asset = await post(`/api/events/${booth.eventId}/booths/${booth.id}/media-assets`, form)
  const id = asset.mediaAssetId ?? asset.id
  await put(`/api/events/${booth.eventId}/booths/${booth.id}/photos`, { revision: booth.revision, mediaAssetIds: [...currentIds, id] })
  return reread(booth)
}

export async function saveBoothPhotos(booth, ids) {
  if (isDemo()) {
    const state = demoState()
    state.photos = ids.map((id) => state.photos.find((p) => p.id === id)).filter(Boolean)
    return reread(booth)
  }
  await put(`/api/events/${booth.eventId}/booths/${booth.id}/photos`, { revision: booth.revision, mediaAssetIds: ids })
  return reread(booth)
}

export async function addItem(booth, fields, sortOrder) {
  if (isDemo()) {
    demoState().items.push({ id: `demo-item-${Date.now()}`, stockStatus: 'AVAILABLE', revision: 0, ...fields, sortOrder })
    return reread(booth)
  }
  await boothApi.createItem(booth.eventId, booth.id, { stockStatus: 'AVAILABLE', ...fields, sortOrder })
  return reread(booth)
}

export async function removeItem(booth, item) {
  if (isDemo()) {
    const state = demoState()
    state.items = state.items.filter((i) => i.id !== item.id)
    return reread(booth)
  }
  await boothApi.deleteItem(booth.eventId, booth.id, item.id, item.revision)
  return reread(booth)
}

// ---------------- notices / payments ----------------

const noticeRow = (raw, author = '') => ({
  id: raw.id,
  title: raw.title,
  body: raw.body ?? '',
  urgent: Boolean(raw.isUrgent),
  publishedAt: raw.publishedAt,
  author,
  attachment: null,
  attachments: toAttachments(raw.attachments),
  imageUrl: raw.imageUrl ?? null,
})

export async function listOperatorNotices(eventId) {
  if (isDemo()) return demoDelay(DEMO_NOTICES.filter((n) => n.audiences.includes('OPERATORS')))
  const page = await get(`/api/events/${eventId}/announcements${query({ view: 'READ', page: 0, size: 100 })}`)
  return page.content.map((n) => noticeRow(n))
}

export async function getOperatorNotice(eventId, noticeId) {
  if (isDemo()) {
    const found = DEMO_NOTICES.find((n) => n.id === noticeId)
    if (!found) throw Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })
    return demoDelay(found)
  }
  return noticeRow(await get(`/api/events/${eventId}/announcements/${noticeId}`))
}

// 결제 내역: no backend yet -> only in preview mode.
export const listMyPayments = async () => (isDemo() && !isDemoNewcomer() ? demoDelay(DEMO_PAYMENTS) : [])
