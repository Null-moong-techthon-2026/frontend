import { useMemo } from 'react'
import * as boothApi from '../api/boothApi'
import { BoothsContext } from './BoothsContext'
import { useEvent } from './useEvent'
import { useEventData } from './useEventData'

const EMPTY_SUMMARY = { total: 0, pending: 0, approved: 0, rejected: 0 }

// Application counts of the event (all applications, whatever the list filters are). 부스 관리 and
// 부스 모집 and the dashboard read the same numbers, so they always agree; 부스 관리 calls
// refreshSummary() after every decision.
//
// The lists themselves (applications, booths) are fetched by the screens that show them, page by
// page, because the backend pages and filters them.
//
//   summary          { total, pending, approved, rejected }   (zeros until loaded)
//   refreshSummary() loads the numbers again
export default function BoothsProvider({ children }) {
  const { event } = useEvent()
  const { data, loading, error, reload } = useEventData(
    event?.id ?? null,
    boothApi.getApplicationSummary,
  )

  const value = useMemo(
    () => ({ summary: data ?? EMPTY_SUMMARY, loading, error, refreshSummary: reload }),
    [data, loading, error, reload],
  )
  return <BoothsContext.Provider value={value}>{children}</BoothsContext.Provider>
}
