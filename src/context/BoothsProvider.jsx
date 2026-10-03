import { useCallback, useState } from 'react'
import { BOOTH_STATUS } from '../constants/booth'
import { MOCK_BOOTHS } from '../mocks/booths'
import { BoothsContext } from './BoothsContext'

// Single source of truth for booth applications, shared by 부스 관리 and 지도 제작.
// Pages only use the actions below, so wiring the backend means changing this file only.
//
// TODO(backend): replace MOCK_BOOTHS with the fetched Booth[] and call the API inside each action
// (see "Where to connect" in BACKEND_INTEGRATION.md).
export default function BoothsProvider({ children }) {
  const [booths, setBooths] = useState(MOCK_BOOTHS)

  const patch = useCallback((id, fields) => {
    setBooths((prev) => prev.map((b) => (b.id === id ? { ...b, ...fields } : b)))
  }, [])

  // status: a BOOTH_STATUS value. Leaving 'approved' also clears boothNo.
  // TODO(backend): PATCH booth status.
  const setStatus = useCallback(
    (id, status) => {
      setBooths((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status, boothNo: status === BOOTH_STATUS.APPROVED ? b.boothNo : null }
            : b,
        ),
      )
    },
    [],
  )

  // Review memo / reject reason edits.
  // TODO(backend): PATCH booth notes (call on blur, not on every keystroke).
  const editNotes = useCallback((id, fields) => patch(id, fields), [patch])

  return (
    <BoothsContext.Provider value={{ booths, setStatus, editNotes }}>
      {children}
    </BoothsContext.Provider>
  )
}
