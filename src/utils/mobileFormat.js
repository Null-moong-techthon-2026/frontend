import { BOOTH_CATEGORY_LABEL } from '../constants/booth'
import { instantToLocalDateTime } from './date'

// Small formatters shared by the mobile screens. Dates come as 'YYYY-MM-DD' or as ISO instants.

const pad = (n) => String(n).padStart(2, '0')

// 'YYYY-MM-DD' -> '2026.11.02'
export const dotDate = (ymd) => (ymd ? ymd.replaceAll('-', '.') : '')

// '2026-11-02' + '2026-11-04' -> '2026.11.02 – 11.04' (the end drops the year when it is the same)
export function dateRange(startYmd, endYmd) {
  if (!startYmd) return ''
  const start = dotDate(startYmd)
  if (!endYmd || endYmd === startYmd) return start
  const end = dotDate(endYmd)
  return `${start} – ${end.slice(0, 4) === start.slice(0, 4) ? end.slice(5) : end}`
}

// ISO instant -> { ymd, hm } in the browser's time zone
const parts = (iso) => {
  const local = instantToLocalDateTime(iso) // 'YYYY-MM-DDTHH:mm'
  return { ymd: local.slice(0, 10), hm: local.slice(11, 16) }
}

// -> '11.02 14:20'
export function shortDateTime(iso) {
  if (!iso) return ''
  const { ymd, hm } = parts(iso)
  return `${ymd.slice(5, 7)}.${ymd.slice(8, 10)} ${hm}`
}

// -> '2026.11.02 14:20'
export function longDateTime(iso) {
  if (!iso) return ''
  const { ymd, hm } = parts(iso)
  return `${dotDate(ymd)} ${hm}`
}

// -> '11.02'
export function shortDate(iso) {
  if (!iso) return ''
  const { ymd } = parts(iso)
  return `${ymd.slice(5, 7)}.${ymd.slice(8, 10)}`
}

// Days until a 'YYYY-MM-DD' / ISO date from today (negative when past). 0 = today.
export function daysUntil(dateLike, now = new Date()) {
  if (!dateLike) return null
  const target = new Date(dateLike.length === 10 ? `${dateLike}T00:00:00` : dateLike)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((day - today) / 86400000)
}

// 'D-2' ('D-day' on the last day)
export function dDayLabel(dateLike) {
  const days = daysUntil(dateLike)
  if (days === null) return ''
  return days <= 0 ? 'D-day' : `D-${days}`
}

// 5000 -> '5,000원'; null -> ''
export const won = (n) => (n == null ? '' : `${Number(n).toLocaleString('ko-KR')}원`)

export const twoDigits = pad

// '1번 · 음식'
export const boothSubtitle = (booth) =>
  [booth.code ? `${booth.code}번` : '', BOOTH_CATEGORY_LABEL[booth.categoryCode] ?? ''].filter(Boolean).join(' · ')

// '11:00 – 21:00' (or '')
export const hoursText = (hours) => (hours ? `${hours.start} – ${hours.end}` : '')
