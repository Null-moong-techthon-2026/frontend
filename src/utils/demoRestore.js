import { del, get, patch, post, put, query } from '../api/client'
import { DEMO_BASELINE as B, DEMO_MAP_BASELINE as MAP } from '../constants/demoBaseline'

// 시연 초기화 (front-end only): puts the demo event "[시연] 부스럭 캠퍼스 페스티벌" back to its starting
// state as far as the organizer's own API allows. Run by the organizer account of that event.
//   Removed:  notices, staff duties, shifts that have not started, booth menu items, and staff
//             applications that were not there at the start (rejected, so the roster hides them).
//   Restored: the floor map (image and pins), event name / venue / description, notice texts, duty names, booth info, operation
//             status and menu items (name, price, stock), staff role / duty / memo / status.
//   Cannot be undone (no API): approved or cancelled booth applications, clock-in records, shifts that
//   already started, staff approved after the start, booths added by hand.
// Every step runs on its own: one that fails is reported and the others still run.

export const isDemoEvent = (eventId) => eventId === B.eventId

const DATES = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const page = async (path) => {
  const r = await get(path)
  return Array.isArray(r) ? r : (r.content ?? [])
}

export async function restoreDemo(eventId, onStep = () => {}) {
  const base = `/api/events/${eventId}`
  const report = []
  const step = async (label, fn) => {
    onStep(label)
    try {
      const note = await fn()
      report.push({ label, ok: true, note: note || '' })
    } catch (err) {
      report.push({ label, ok: false, note: `${err.status ?? ''} ${err.code ?? err.message}`.trim() })
    }
  }

  await step('행사 정보', async () => {
    const ev = await get(base)
    const want = B.event
    if (ev.name === want.name && ev.venue === want.venue && ev.description === want.description) return '그대로'
    await patch(base, { revision: ev.revision, ...want })
    return '되돌림'
  })

  await step('공지', async () => {
    let removed = 0
    let fixed = 0
    let made = 0
    const rows = await page(`${base}/announcements?view=MANAGE&page=0&size=100`)
    for (const r of rows) {
      if (!B.notices.some((n) => n.id === r.id)) {
        await del(`${base}/announcements/${r.id}${query({ revision: r.revision })}`)
        removed++
      }
    }
    for (const n of B.notices) {
      const row = rows.find((r) => r.id === n.id)
      if (!row) {
        await post(`${base}/announcements`, { title: n.title, body: n.body, audiences: n.audiences, isUrgent: n.isUrgent, publicationStatus: n.publicationStatus })
        made++
        continue
      }
      const cur = await get(`${base}/announcements/${n.id}`)
      if (cur.title !== n.title || cur.body !== n.body || cur.isUrgent !== n.isUrgent || cur.publicationStatus !== n.publicationStatus || !same([...cur.audiences].sort(), [...n.audiences].sort())) {
        await put(`${base}/announcements/${n.id}`, { revision: cur.revision, title: n.title, body: n.body, audiences: n.audiences, isUrgent: n.isUrgent, publicationStatus: n.publicationStatus, imageAssetId: null })
        fixed++
      }
    }
    return `지움 ${removed} · 고침 ${fixed} · 다시 만듦 ${made}`
  })

  await step('근무표', async () => {
    let removed = 0
    let kept = 0
    for (const date of DATES) {
      const shifts = await page(`${base}/staff-shifts${query({ date })}`)
      for (const s of shifts) {
        if (B.shiftIds.includes(s.id)) continue
        try {
          await del(`${base}/staff-shifts/${s.id}${query({ revision: s.revision })}`)
          removed++
        } catch {
          kept++ // already started or ended: the server keeps it
        }
      }
    }
    return `지움 ${removed}${kept ? ` · 이미 시작해서 못 지움 ${kept}` : ''}`
  })

  await step('스태프 업무', async () => {
    let removed = 0
    let fixed = 0
    let kept = 0
    const rows = await page(`${base}/staff-duties`)
    for (const r of rows) {
      if (B.duties.some((d) => d.id === r.id)) continue
      try {
        await del(`${base}/staff-duties/${r.id}${query({ revision: r.revision })}`)
        removed++
      } catch {
        kept++
      }
    }
    for (const d of B.duties) {
      const row = rows.find((r) => r.id === d.id)
      if (!row) {
        await post(`${base}/staff-duties`, { zone: d.zone, name: d.name })
      } else if (row.zone !== d.zone || row.name !== d.name) {
        await put(`${base}/staff-duties/${d.id}`, { revision: row.revision, zone: d.zone, name: d.name })
        fixed++
      }
    }
    return `지움 ${removed} · 고침 ${fixed}${kept ? ` · 쓰는 중이라 못 지움 ${kept}` : ''}`
  })

  await step('부스·메뉴', async () => {
    let touched = 0
    for (const b of B.booths) {
      let cur = await get(`${base}/booths/${b.id}`)
      if (cur.name !== b.name || cur.categoryCode !== b.categoryCode || (cur.description ?? '') !== (b.description ?? '') || cur.visibilityStatus !== b.visibilityStatus) {
        cur = await patch(`${base}/booths/${b.id}`, { revision: cur.revision, name: b.name, categoryCode: b.categoryCode, description: b.description, visibilityStatus: b.visibilityStatus })
        touched++
      }
      if (cur.operationStatus !== b.operationStatus) {
        cur = await patch(`${base}/booths/${b.id}/operation-status`, { revision: cur.revision, operationStatus: b.operationStatus })
        touched++
      }
      for (const it of cur.items ?? []) {
        if (!b.items.some((x) => x.id === it.id)) {
          await del(`${base}/booths/${b.id}/items/${it.id}${query({ revision: it.revision })}`)
          touched++
        }
      }
      for (const want of b.items) {
        const it = (cur.items ?? []).find((x) => x.id === want.id)
        if (!it) {
          await post(`${base}/booths/${b.id}/items`, { name: want.name, description: want.description, priceKrw: want.priceKrw, stockStatus: want.stockStatus, sortOrder: want.sortOrder })
          touched++
        } else if (it.name !== want.name || (it.description ?? '') !== (want.description ?? '') || it.priceKrw !== want.priceKrw || it.stockStatus !== want.stockStatus) {
          await patch(`${base}/booths/${b.id}/items/${it.id}`, { revision: it.revision, name: want.name, description: want.description, priceKrw: want.priceKrw, stockStatus: want.stockStatus })
          touched++
        }
      }
    }
    return touched ? `고침 ${touched}` : '그대로'
  })

  await step('지도', async () => {
    const pinKey = (p) => [p.pinType, p.label, p.xRatio, p.yRatio].join('|')
    const wantKeys = MAP.pins.map(pinKey).sort()
    const pub = await get(`/api/public/events/${eventId}/map`)
    const nowKeys = (pub.pins ?? []).map(pinKey).sort()
    if (pub.image?.mediaAssetId === MAP.mediaAssetId && same(nowKeys, wantKeys)) return '그대로'
    const editor = await get(`${base}/map-editor`)
    if (editor.draftMap) await del(`${base}/floor-plans/${editor.draftMap.floorPlanId}${query({ revision: editor.draftMap.revision })}`)
    let draft = await post(`${base}/floor-plans`, { mediaAssetId: MAP.mediaAssetId })
    draft = await put(`${base}/floor-plans/${draft.floorPlanId}`, { revision: draft.revision, pins: MAP.pins.map((p) => ({ id: crypto.randomUUID(), ...p })) })
    await post(`${base}/floor-plans/${draft.floorPlanId}/publication`, { revision: draft.revision })
    return '되돌려 다시 게시함'
  })

  await step('스태프', async () => {
    let fixed = 0
    let rejected = 0
    const rows = await page(`${base}/staff${query({ page: 0, size: 100 })}`)
    for (const m of rows) {
      const id = m.memberId ?? m.id
      const want = B.staff.find((s) => s.id === id)
      if (!want) {
        if (m.status === 'PENDING') {
          await post(`${base}/staff/${id}/decision`, { decision: 'REJECTED', revision: m.revision })
          rejected++
        }
        continue
      }
      const fields = {}
      if (m.role !== want.role) fields.role = want.role
      if ((m.dutyId ?? null) !== (want.dutyId ?? null)) fields.dutyId = want.dutyId ?? null
      if ((m.memo ?? '') !== (want.memo ?? '')) fields.memo = want.memo ?? ''
      const fixable = ['WAITING', 'ABSENT']
      if (m.status !== want.status && fixable.includes(want.status) && fixable.includes(m.status)) fields.status = want.status
      if (Object.keys(fields).length) {
        await patch(`${base}/staff/${id}`, { revision: m.revision, ...fields })
        fixed++
      }
    }
    return `고침 ${fixed} · 새 신청 정리 ${rejected}`
  })

  return report
}
