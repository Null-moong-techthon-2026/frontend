// What a visitor (no login) reads: the event, its booths, map, notices, sponsors.
//
// Real backend (all public, no login):
//   GET /api/public/events/:id                      event
//   GET /api/public/events/:id/booths               booth list (PUBLIC booths only)
//   GET /api/public/events/:id/booths/:boothId      booth detail + menu + map position
//   GET /api/public/events/:id/map                  published map
//   GET /api/public/events/:id/announcements[/:id]  notices for the public
// Without a backend (docs/BACKEND_REQUESTS.md): operating hours, contact phone, directions, booth
// photo / SNS / hours and sponsors. They are empty here, and filled with sample content in
// ?demo=1 preview mode (which shows the sample event instead of calling the backend at all).
//
// View models:
//   event   { id, name, organizationName, startDate, endDate, venue, intro, imageUrl, hours, phone, directions }
//   booth   { id, code, name, categoryCode, operationStatus, stockSummary, intro, hours, imageUrl,
//             snsUrl, items:[{id,name,priceKrw,stockStatus}], placement: null | { pinId, xRatio, yRatio } }
//   map     null | { image:{url,widthPx,heightPx}, pins:[{id,pinType,label,xRatio,yRatio,boothId}] }
//   notice  { id, title, body, urgent, publishedAt, author, attachment, imageUrl }

import {
  DEMO_AD,
  DEMO_BOOTHS,
  DEMO_EVENT,
  DEMO_FACILITY_PINS,
  DEMO_MAP_IMAGE,
  DEMO_NOTICES,
  DEMO_SPONSORS,
} from '../dummy/demoData'
import { demoDelay, isDemo } from '../utils/demo'
import { toEvent } from '../utils/event'
import { get, query } from './client'

const base = (eventId) => `/api/public/events/${eventId}`

const eventView = (raw) => ({
  ...toEvent(raw),
  hours: null,
  phone: null,
  directions: null,
})

const boothView = (raw) => ({
  id: raw.eventBoothId,
  code: raw.boothCode ?? '',
  name: raw.name,
  categoryCode: raw.categoryCode,
  operationStatus: raw.operationStatus,
  stockSummary: raw.stockSummary ?? null,
  intro: raw.description ?? '',
  hours: null,
  imageUrl: null,
  snsUrl: null,
  items: (raw.items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    priceKrw: i.priceKrw ?? null,
    stockStatus: i.stockStatus,
  })),
  placement: raw.mapPlacement ? { pinId: raw.mapPlacement.pinId, xRatio: Number(raw.mapPlacement.xRatio), yRatio: Number(raw.mapPlacement.yRatio) } : null,
})

const noticeView = (raw, author = '') => ({
  id: raw.id,
  title: raw.title,
  body: raw.body ?? '',
  urgent: Boolean(raw.isUrgent),
  publishedAt: raw.publishedAt,
  author,
  attachment: null,
  imageUrl: raw.imageUrl ?? null,
})

export async function getPublicEvent(eventId) {
  if (isDemo()) return demoDelay(DEMO_EVENT)
  return eventView(await get(base(eventId)))
}

export async function listPublicBooths(eventId) {
  if (isDemo()) return demoDelay(DEMO_BOOTHS)
  const page = await get(`${base(eventId)}/booths${query({ page: 0, size: 100 })}`)
  return page.content.map(boothView)
}

export async function getPublicBooth(eventId, boothId) {
  if (isDemo()) {
    const found = DEMO_BOOTHS.find((b) => b.id === boothId)
    if (!found) throw Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })
    return demoDelay(found)
  }
  return boothView(await get(`${base(eventId)}/booths/${boothId}`))
}

// null when the organizer has not published a map yet.
export async function getPublicMapView(eventId) {
  if (isDemo()) {
    const boothPins = DEMO_BOOTHS.map((b) => ({
      id: b.placement.pinId,
      pinType: 'BOOTH',
      label: b.name,
      xRatio: b.placement.xRatio,
      yRatio: b.placement.yRatio,
      boothId: b.id,
    }))
    const facilityPins = DEMO_FACILITY_PINS.map((p) => ({ ...p, boothId: null }))
    return demoDelay({ image: DEMO_MAP_IMAGE, pins: [...boothPins, ...facilityPins] })
  }
  try {
    const raw = await get(`${base(eventId)}/map`)
    return {
      image: { url: raw.image.readUrl, widthPx: raw.image.widthPx, heightPx: raw.image.heightPx },
      pins: raw.pins.map((p) => ({
        id: p.id,
        pinType: p.pinType,
        label: p.label,
        xRatio: Number(p.xRatio),
        yRatio: Number(p.yRatio),
        boothId: p.eventBoothId ?? null,
      })),
    }
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

export async function listPublicNotices(eventId, organizationName = '') {
  if (isDemo()) return demoDelay(DEMO_NOTICES.filter((n) => n.audiences.includes('PUBLIC')))
  const page = await get(`${base(eventId)}/announcements${query({ page: 0, size: 100 })}`)
  return page.content.map((n) => noticeView(n, organizationName))
}

export async function getPublicNotice(eventId, noticeId, organizationName = '') {
  if (isDemo()) {
    const found = DEMO_NOTICES.find((n) => n.id === noticeId)
    if (!found) throw Object.assign(new Error('not found'), { status: 404, code: 'RESOURCE_NOT_FOUND' })
    return demoDelay(found)
  }
  return noticeView(await get(`${base(eventId)}/announcements/${noticeId}`), organizationName)
}

// 후원사 and the home banner: no backend yet -> only in preview mode.
export const listSponsors = async () => (isDemo() ? demoDelay(DEMO_SPONSORS) : [])
export const getHomeAd = async () => (isDemo() ? demoDelay(DEMO_AD) : null)
