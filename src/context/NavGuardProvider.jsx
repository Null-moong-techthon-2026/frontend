import { useEffect, useMemo, useRef } from 'react'
import { NavGuardContext } from './NavGuardContext'

// Lets a screen with a 저장하기 button ask the organizer menu to confirm before leaving it with
// unsaved changes (see useLeaveGuard). The current screen's guard lives in a ref.
export default function NavGuardProvider({ children }) {
  const guardRef = useRef(null)
  const value = useMemo(() => ({ guardRef }), [])

  // Closing or reloading the tab with unsaved changes: the browser's own confirmation.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!guardRef.current?.dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return <NavGuardContext.Provider value={value}>{children}</NavGuardContext.Provider>
}
