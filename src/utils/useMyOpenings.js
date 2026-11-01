import { useEffect, useState } from 'react'
import { listMyOpenings } from '../api/eventApi'

// The logged-in account's event-opening applications (행사 개설 신청), newest first.
//   openings   null until loaded; then the array (the first one is the latest)
//   error      the ApiError when the load failed
//   reload()   loads again
export function useMyOpenings(accountId) {
  const [state, setState] = useState({ key: null, list: null, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    listMyOpenings()
      .then((page) => alive && setState({ key: accountId, list: page.content, error: null }))
      .catch((error) => alive && setState({ key: accountId, list: null, error }))
    return () => {
      alive = false
    }
  }, [accountId, version])

  const current = state.key === accountId ? state : null
  return {
    openings: current?.list ?? null,
    error: current?.error ?? null,
    reload: () => setVersion((v) => v + 1),
  }
}
