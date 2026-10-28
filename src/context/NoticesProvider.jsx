import { useCallback, useMemo } from 'react'
import * as noticeApi from '../api/noticeApi'
import { NOTICE_STATUS } from '../constants/notice'
import { toNotice } from '../utils/notice'
import { NoticesContext } from './NoticesContext'
import { useEvent } from './useEvent'
import { useEventData } from './useEventData'

// Single source of truth for notices. Value:
//   notices        Notice[] (list rows: no body / image yet) - empty until loaded
//   loading, error, reload
//   loadNotice(id)               resolves with the full notice (body and image included)
//   saveNotice(id, fields, status)  creates (id null) or updates; resolves with the saved notice.
//                                fields: { title, body, image: {assetId}|null, audiences, urgent };
//                                status: a NOTICE_STATUS value (closed is stored as a draft)
//   setStatus(id, status)        publishes / unpublishes without touching the text
//   closeNotice(id) / reopenNotice(id) / deleteNotice(id)
// Writes throw ApiError (e.g. REVISION_CONFLICT) and refresh the list on success.
export default function NoticesProvider({ children }) {
  const { event } = useEvent()
  const eventId = event?.id ?? null
  const { data, loading, error, reload } = useEventData(eventId, noticeApi.listAllAnnouncements)
  const notices = useMemo(() => (data ?? []).map(toNotice), [data])

  const loadNotice = useCallback(
    async (id) => toNotice(await noticeApi.getAnnouncement(eventId, id)),
    [eventId],
  )

  const body = (fields, status, revision) => ({
    ...(revision === undefined ? {} : { revision }),
    title: fields.title,
    body: fields.body,
    imageAssetId: fields.image?.assetId ?? null,
    audiences: fields.audiences,
    isUrgent: fields.urgent,
    publicationStatus: status === NOTICE_STATUS.PUBLISHED ? 'PUBLISHED' : 'DRAFT',
  })

  const saveNotice = useCallback(
    async (id, fields, status) => {
      let saved
      if (id === null) {
        saved = await noticeApi.createAnnouncement(eventId, body(fields, status))
      } else {
        // The revision the list last showed: a stale one means someone else saved first (409).
        const revision = notices.find((n) => n.id === id)?.revision
        saved = await noticeApi.updateAnnouncement(eventId, id, body(fields, status, revision))
      }
      await reload()
      return toNotice(saved)
    },
    [eventId, notices, reload],
  )

  const setStatus = useCallback(
    async (id, status) => {
      const current = await noticeApi.getAnnouncement(eventId, id)
      const notice = toNotice(current)
      const saved = await noticeApi.updateAnnouncement(
        eventId,
        id,
        body(notice, status, current.revision),
      )
      await reload()
      return toNotice(saved)
    },
    [eventId, reload],
  )

  const closeNotice = useCallback((id) => setStatus(id, NOTICE_STATUS.CLOSED), [setStatus])
  const reopenNotice = useCallback((id) => setStatus(id, NOTICE_STATUS.PUBLISHED), [setStatus])

  const deleteNotice = useCallback(
    async (id) => {
      const revision = notices.find((n) => n.id === id)?.revision
      await noticeApi.deleteAnnouncement(eventId, id, revision)
      await reload()
    },
    [eventId, notices, reload],
  )

  const value = useMemo(
    () => ({
      notices,
      loading,
      error,
      reload,
      loadNotice,
      saveNotice,
      setStatus,
      closeNotice,
      reopenNotice,
      deleteNotice,
    }),
    [notices, loading, error, reload, loadNotice, saveNotice, setStatus, closeNotice, reopenNotice, deleteNotice],
  )
  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>
}
