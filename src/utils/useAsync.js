import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async loader when the screen opens (and again when `deps` change or reload() is called).
//   returns { data, error, loading, reload, setData }
// `data` stays the last loaded value while a reload runs (so the screen does not flash empty).
// Stale answers (the screen closed or the deps changed meanwhile) are dropped.
// `deps` must be primitives (ids, strings): they are joined into the key of the load.
export function useAsync(loader, deps = []) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const loaderRef = useRef(loader)
  const key = [...deps, version].join('|')

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let alive = true
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((error) => alive && setState((s) => ({ key, data: s.data, error })))
    return () => {
      alive = false
    }
  }, [key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), [])
  return { data: state.data, error: state.key === key ? state.error : null, loading: state.key !== key, reload, setData }
}
