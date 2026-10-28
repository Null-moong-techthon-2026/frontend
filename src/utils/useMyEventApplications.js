import { useEffect, useState } from 'react'
import { listMyEventApplications } from '../api/eventApplicationApi'

// The logged-in account's event-opening applications, newest first, loaded from the backend.
//   applications  null until loaded; then the array (the first one is the latest)
//   loading       true until the first load for this account finishes
//   error         the ApiError when the load failed
//   reload()      loads again
export function useMyEventApplications(accountId) {
  const [state, setState] = useState({ key: null, list: null, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    listMyEventApplications()
      .then((page) => alive && setState({ key: accountId, list: page.content, error: null }))
      .catch((error) => alive && setState({ key: accountId, list: null, error }))
    return () => {
      alive = false
    }
  }, [accountId, version])

  const current = state.key === accountId ? state : null
  return {
    applications: current?.list ?? null,
    error: current?.error ?? null,
    loading: !current,
    reload: () => setVersion((v) => v + 1),
  }
}
