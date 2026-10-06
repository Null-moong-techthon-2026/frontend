import { useCallback, useState } from 'react'
import { BOOTH_OPERATING_STATUS, BOOTH_STATUS } from '../constants/booth'
import { MOCK_BOOTHS } from '../mocks/booths'
import { nowIso } from '../utils/date'
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

  // status: a BOOTH_STATUS value. Leaving 'approved' also clears boothNo and operatingStatus;
  // a newly approved booth starts as 'preparing'.
  // TODO(backend): PATCH booth status.
  const setStatus = useCallback(
    (id, status) => {
      setBooths((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status,
                boothNo: status === BOOTH_STATUS.APPROVED ? b.boothNo : null,
                operatingStatus:
                  status === BOOTH_STATUS.APPROVED
                    ? (b.operatingStatus ?? BOOTH_OPERATING_STATUS.PREPARING)
                    : null,
              }
            : b,
        ),
      )
    },
    [],
  )

  // Review memo / reject reason edits.
  // TODO(backend): PATCH booth notes (call on blur, not on every keystroke).
  const editNotes = useCallback((id, fields) => patch(id, fields), [patch])

  // Day-of operating status of an APPROVED booth (준비 중/운영 중/품절/마감).
  // TODO(backend): PATCH /booths/:id/operating-status.
  const setOperatingStatus = useCallback((id, operatingStatus) => {
    setBooths((prev) =>
      prev.map((b) =>
        b.id === id && b.status === BOOTH_STATUS.APPROVED
          ? { ...b, operatingStatus, statusChangedAt: nowIso() }
          : b,
      ),
    )
  }, [])

  // Stock level of one menu item (a STOCK_LEVEL value).
  // TODO(backend): PATCH /booths/:id/menus/:menuId { stock }.
  const setMenuStock = useCallback((id, menuId, stock) => {
    setBooths((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              menus: b.menus.map((m) => (m.id === menuId ? { ...m, stock } : m)),
              statusChangedAt: nowIso(),
            }
          : b,
      ),
    )
  }, [])

  return (
    <BoothsContext.Provider
      value={{ booths, setStatus, editNotes, setOperatingStatus, setMenuStock }}
    >
      {children}
    </BoothsContext.Provider>
  )
}
