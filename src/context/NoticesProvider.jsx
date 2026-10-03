import { useCallback, useRef, useState } from 'react'
import { NOTICE_STATUS } from '../constants/notice'
import { MOCK_NOTICES } from '../mocks/notices'
import { nowIso } from '../utils/date'
import { NoticesContext } from './NoticesContext'

// Single source of truth for notices. Pages only use the actions below, so wiring the backend
// means changing this file only.
//
// TODO(backend): replace MOCK_NOTICES with the fetched Notice[] and call the API in each action
// (see "Where to connect" in BACKEND_INTEGRATION.md). Ids are client-made here; the server
// should issue them.
export default function NoticesProvider({ children }) {
  const [notices, setNotices] = useState(MOCK_NOTICES)
  const nextId = useRef(Math.max(...MOCK_NOTICES.map((n) => n.id)) + 1)

  // fields: { title, body, attachments, audiences, urgent }; status: a NOTICE_STATUS value.
  // Creates when `id` is null, otherwise updates. Returns the notice id.
  // TODO(backend): POST /notices (create) or PUT /notices/:id (update).
  const saveNotice = useCallback((id, fields, status) => {
    const now = nowIso()
    const savedId = id ?? nextId.current++
    setNotices((prev) => {
      const existing = prev.find((n) => n.id === savedId)
      const next = {
        ...existing,
        ...fields,
        id: savedId,
        status,
        // First time it goes live, stamp the publish time; keep it on later edits.
        publishedAt:
          status === NOTICE_STATUS.PUBLISHED
            ? (existing?.publishedAt ?? now)
            : (existing?.publishedAt ?? null),
        updatedAt: now,
      }
      return existing ? prev.map((n) => (n.id === savedId ? next : n)) : [...prev, next]
    })
    return savedId
  }, [])

  // TODO(backend): PATCH /notices/:id/status { status }.
  const setStatus = useCallback((id, status) => {
    const now = nowIso()
    setNotices((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              status,
              publishedAt: status === NOTICE_STATUS.PUBLISHED ? (n.publishedAt ?? now) : n.publishedAt,
              updatedAt: now,
            }
          : n,
      ),
    )
  }, [])

  const closeNotice = useCallback((id) => setStatus(id, NOTICE_STATUS.CLOSED), [setStatus])
  const reopenNotice = useCallback((id) => setStatus(id, NOTICE_STATUS.PUBLISHED), [setStatus])

  // TODO(backend): DELETE /notices/:id.
  const deleteNotice = useCallback((id) => {
    setNotices((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NoticesContext.Provider
      value={{ notices, saveNotice, closeNotice, reopenNotice, deleteNotice }}
    >
      {children}
    </NoticesContext.Provider>
  )
}
