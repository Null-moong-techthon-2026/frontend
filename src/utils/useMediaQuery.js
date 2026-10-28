import { useSyncExternalStore } from 'react'

// true while the viewport matches the CSS media query, e.g. useMediaQuery('(min-width: 1024px)').
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
