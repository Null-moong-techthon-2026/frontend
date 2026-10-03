const pad = (n) => String(n).padStart(2, '0')

// Local time as 'YYYY-MM-DDTHH:mm' (the format used for notice timestamps).
export function nowIso() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 'YYYY-MM-DDTHH:mm' -> 'YYYY.MM.DD HH:mm'
export const formatDateTime = (iso) => `${iso.slice(0, 10).replaceAll('-', '.')} ${iso.slice(11, 16)}`

// ('2026-09-22', '2026-09-24') -> '2026.09.22 ~ 09.24'; across years the end keeps its year.
export function formatDateRange(start, end) {
  const dotted = (d) => d.replaceAll('-', '.')
  const endText = start.slice(0, 4) === end.slice(0, 4) ? dotted(end.slice(5)) : dotted(end)
  return `${dotted(start)} ~ ${endText}`
}
