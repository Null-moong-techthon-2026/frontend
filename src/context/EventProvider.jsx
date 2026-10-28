import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as eventApi from '../api/eventApi'
import { endOfLocalDate, startOfLocalDate } from '../utils/date'
import { toEvent } from '../utils/event'
import { EventContext } from './EventContext'
import { useAuth } from './useAuth'

// The event being managed (sidebar card, dashboard, every other screen's event id).
//
// After login it loads the organizer's events and works with the first one. Value:
//   status        'idle' (logged out) | 'loading' | 'ready' | 'none' (no event yet) | 'error'
//                 Events are created by the 부스럭 team after reviewing an application, never here.
//   event         null unless status is 'ready'; see toEvent() in utils/event.js
//   error         the ApiError when status is 'error'
//   reload()                 loads again
//   updateEvent(fields)      saves any subset of { name, startDate, endDate, venue, intro,
//                            imageAssetId, publicationStatus } and resolves with the new event.
//                            Throws ApiError (e.g. REVISION_CONFLICT) when the backend refuses.
export default function EventProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [loaded, setLoaded] = useState({ userId: null, status: 'loading', event: null, error: null })
  const [version, setVersion] = useState(0) // bump to load the events again
  const eventRef = useRef(null)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!userId) return
    let alive = true
    eventApi
      .listMyEvents('ORGANIZER', 0, 20)
      .then((page) => {
        const first = page.content[0]
        if (alive) {
          setLoaded({ userId, status: first ? 'ready' : 'none', event: first ? toEvent(first) : null, error: null })
        }
      })
      .catch((error) => alive && setLoaded({ userId, status: 'error', event: null, error }))
    return () => {
      alive = false
    }
  }, [userId, version])

  const current = userId && loaded.userId === userId ? loaded : null
  const status = !userId ? 'idle' : (current?.status ?? 'loading')
  const event = current?.event ?? null

  useEffect(() => {
    eventRef.current = event
  })

  const updateEvent = useCallback(
    async (fields) => {
      const base = eventRef.current
      const body = { revision: base.revision }
      if ('name' in fields) body.name = fields.name
      if ('venue' in fields) body.venue = fields.venue
      if ('intro' in fields) body.description = fields.intro
      if ('startDate' in fields) body.startsAt = startOfLocalDate(fields.startDate)
      if ('endDate' in fields) body.endsAt = endOfLocalDate(fields.endDate)
      if ('imageAssetId' in fields && fields.imageAssetId) body.posterAssetId = fields.imageAssetId
      if ('publicationStatus' in fields) body.publicationStatus = fields.publicationStatus
      const next = toEvent(await eventApi.updateEvent(base.id, body))
      eventRef.current = next
      setLoaded((prev) => ({ ...prev, event: next }))
      return next
    },
    [],
  )

  const value = useMemo(
    () => ({ status, event, error: current?.error ?? null, reload, updateEvent }),
    [status, event, current?.error, reload, updateEvent],
  )
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}
