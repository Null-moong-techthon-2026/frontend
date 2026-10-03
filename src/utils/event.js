import { EVENT_PROGRESS } from '../constants/event'

const pad = (n) => String(n).padStart(2, '0')
const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Progress from the dates alone: before start -> upcoming, within [start, end] -> ongoing,
// after end -> ended. `now` is injectable for tests; the end date counts as a full day.
export function getEventProgress(startDate, endDate, now = new Date()) {
  const today = toDateString(now)
  if (today < startDate) return EVENT_PROGRESS.UPCOMING
  if (today > endDate) return EVENT_PROGRESS.ENDED
  return EVENT_PROGRESS.ONGOING
}
