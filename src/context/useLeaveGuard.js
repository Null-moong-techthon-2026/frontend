import { useContext, useEffect } from 'react'
import { NavGuardContext } from './NavGuardContext'

// A screen with unsaved changes registers itself here:
//   dirty    true while there are unsaved changes
//   save()   saves them; resolves true when saved, false when it could not be (the user stays)
//   discard() throws the unsaved changes away (only needed when they live outside the screen)
export function useLeaveGuard(guard) {
  const { guardRef } = useContext(NavGuardContext)
  useEffect(() => {
    guardRef.current = guard
    return () => {
      if (guardRef.current === guard) guardRef.current = null
    }
  })
}

export function useNavGuardRef() {
  return useContext(NavGuardContext).guardRef
}
