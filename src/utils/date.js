const pad = (n) => String(n).padStart(2, '0')

const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Local time as 'YYYY-MM-DDTHH:mm' (the format used for notice timestamps).
export function nowIso() {
  const d = new Date()
  return `${localDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 'YYYY-MM-DDTHH:mm' -> 'YYYY.MM.DD HH:mm' ('' stays '')
export const formatDateTime = (iso) =>
  iso ? `${iso.slice(0, 10).replaceAll('-', '.')} ${iso.slice(11, 16)}` : ''

// ('2026-09-22', '2026-09-24') -> '2026.09.22 ~ 09.24'; across years the end keeps its year.
export function formatDateRange(start, end) {
  if (!start || !end) return '일정 미정'
  const dotted = (d) => d.replaceAll('-', '.')
  const endText = start.slice(0, 4) === end.slice(0, 4) ? dotted(end.slice(5)) : dotted(end)
  return `${dotted(start)} ~ ${endText}`
}

// Local time as 'HH:mm:ss' (the "최근 갱신" clock).
export function nowTime() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ---- backend timestamps (ISO instants like '2026-11-10T00:00:00Z') <-> the UI's local strings ----

// '2026-11-10T00:00:00Z' -> '2026-11-10' in the browser's time zone ('' for null).
export const instantToLocalDate = (instant) => (instant ? localDate(new Date(instant)) : '')

// '2026-11-10T00:00:00Z' -> '2026-11-10T09:00' in the browser's time zone ('' for null).
export function instantToLocalDateTime(instant) {
  if (!instant) return ''
  const d = new Date(instant)
  return `${localDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// '2026-11-10T09:00' (local) -> ISO instant. null for ''.
export const localDateTimeToInstant = (value) => (value ? new Date(value).toISOString() : null)

// An event covers its dates inclusively: the start date at 00:00, the end date until 23:59:59.
export const startOfLocalDate = (date) => new Date(`${date}T00:00:00`).toISOString()
export const endOfLocalDate = (date) => new Date(`${date}T23:59:59`).toISOString()
