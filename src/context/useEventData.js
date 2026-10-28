import { useCallback, useEffect, useRef, useState } from 'react'

// Loads one thing that belongs to an event (recruitment, notices, ...) as soon as the event is
// known, and again whenever `reload()` is called.
//
//   fetcher   (eventId) => Promise<data>      called with the current event id
//   returns   { data, error, loading, reload, setData }
//     data       the last loaded value for THIS event (null before the first load / without event)
//     loading    true until the first load for this event finishes
//     reload()   fetches again and resolves with the data (null when it failed; `error` is set)
//     setData    replaces the data locally, e.g. with the response of a write call
//
// Data of another event (or of another logged-in user) is never shown: it is keyed by event id.
export function useEventData(eventId, fetcher) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const reload = useCallback(async () => {
    if (!eventId) return null
    try {
      const data = await fetcherRef.current(eventId)
      setState({ key: eventId, data, error: null })
      return data
    } catch (error) {
      setState((prev) => ({
        key: eventId,
        data: prev.key === eventId ? prev.data : null,
        error,
      }))
      return null
    }
  }, [eventId])

  useEffect(() => {
    reload()
  }, [reload])

  const setData = useCallback(
    (next) =>
      setState((prev) => ({
        key: eventId,
        error: null,
        data: typeof next === 'function' ? next(prev.key === eventId ? prev.data : null) : next,
      })),
    [eventId],
  )

  const current = eventId && state.key === eventId ? state : null
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: Boolean(eventId) && !current,
    reload,
    setData,
  }
}
