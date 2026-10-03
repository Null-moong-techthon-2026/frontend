import { useCallback, useState } from 'react'
import { MOCK_EVENT } from '../mocks/event'
import { EventContext } from './EventContext'

// Single source of truth for the event being managed. The sidebar card, the dashboard and the
// booth-invite link all read it, so editing here updates every screen at once.
//
// TODO(backend): replace MOCK_EVENT with the fetched Event and save in updateEvent
// (see "Where to connect" in BACKEND_INTEGRATION.md).
export default function EventProvider({ children }) {
  const [event, setEvent] = useState(MOCK_EVENT)

  // fields: any subset of the Event model, e.g. { name, startDate, endDate, venue, intro, status }.
  // TODO(backend): PUT /event.
  const updateEvent = useCallback((fields) => {
    setEvent((prev) => ({ ...prev, ...fields }))
  }, [])

  return <EventContext.Provider value={{ event, updateEvent }}>{children}</EventContext.Provider>
}
