import { useContext } from 'react'
import { EventContext } from './EventContext'

// { event, updateEvent } — see EventProvider.
export function useEvent() {
  const value = useContext(EventContext)
  if (!value) throw new Error('useEvent must be used inside <EventProvider>')
  return value
}
