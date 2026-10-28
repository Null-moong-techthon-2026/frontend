import { EVENT_PROGRESS } from '../constants/event'
import { instantToLocalDate } from './date'

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

// Backend event -> the Event model the screens use (see src/types.js).
// The dates become local 'YYYY-MM-DD' strings, so the screens never deal with time zones.
export function toEvent(raw) {
  return {
    id: raw.id,
    name: raw.name,
    organizationName: raw.organization?.name ?? '',
    startDate: instantToLocalDate(raw.startsAt),
    endDate: instantToLocalDate(raw.endsAt),
    venue: raw.venue ?? '',
    intro: raw.description ?? '',
    imageUrl: raw.posterUrl ?? null,
    imageAssetId: raw.posterAssetId ?? null,
    publicationStatus: raw.publicationStatus,
    revision: raw.revision,
    // TODO(visitor app): there is no visitor screen yet; this is where its link would point.
    visitorUrl: `${window.location.origin}/e/${raw.id}`,
  }
}
