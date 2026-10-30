// The days of an event as 'YYYY-MM-DD' (start to end date, at most two weeks) - what the schedule
// is laid out by. `event` is the event model (startDate / endDate as local dates).

const MAX_DAYS = 14

export function eventDays(event) {
  const days = []
  if (!event?.startDate || !event?.endDate) return days
  const cursor = new Date(`${event.startDate}T00:00:00`)
  const end = new Date(`${event.endDate}T00:00:00`)
  while (cursor <= end && days.length < MAX_DAYS) {
    const p = (n) => String(n).padStart(2, '0')
    days.push(`${cursor.getFullYear()}-${p(cursor.getMonth() + 1)}-${p(cursor.getDate())}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

// Today as 'YYYY-MM-DD' (this browser's time zone).
export function todayYmd() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// The day a schedule opens on: today when it is a day of the event, else the first day.
export function scheduleDay(event) {
  const days = eventDays(event)
  const today = todayYmd()
  return days.includes(today) ? today : (days[0] ?? today)
}
