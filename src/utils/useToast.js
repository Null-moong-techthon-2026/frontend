import { useCallback, useEffect, useRef, useState } from 'react'

const SHOW_MS = 4000

// A short message that disappears by itself (see components/Toast.jsx).
//   const { toast, notify } = useToast()
//   notify('저장했어요')                 neutral / success
//   notify('저장하지 못했어요', 'error')   red
//   <Toast toast={toast} />
export function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const notify = useCallback((message, tone = 'ok') => {
    clearTimeout(timer.current)
    setToast({ message, tone, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), SHOW_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { toast, notify }
}
