import { useCallback, useMemo } from 'react'
import * as recruitApi from '../api/recruitApi'
import { EVENT_PUBLICATION } from '../constants/event'
import { toRecruit, toRecruitRequest } from '../utils/recruit'
import { RecruitContext } from './RecruitContext'
import { useEvent } from './useEvent'
import { useEventData } from './useEventData'

// Single source of truth for the booth-recruitment announcement. The recruit page edits it and
// the dashboard reads its status, so both always agree. Value:
//   recruit        null while loading, otherwise the Recruitment model (utils/recruit.js toRecruit)
//   loading, error
//   saveRecruit(fields)    saves any subset of { intro, categories, feeKrw, feeNote, documents,
//                          deadline, target }; resolves with the saved recruit
//   setPublished(bool)     opens / closes the announcement to booth operators. Opening also
//                          publishes the event itself, because the public recruitment page only
//                          exists for published events.
// Both throw ApiError when the backend refuses (e.g. RECRUITMENT_TERMS_LOCKED after the first
// application, REVISION_CONFLICT when someone else saved first).
export default function RecruitProvider({ children }) {
  const { event, updateEvent } = useEvent()
  const eventId = event?.id ?? null
  const publicationStatus = event?.publicationStatus
  const { data: raw, error, loading, setData, reload } = useEventData(
    eventId,
    recruitApi.getRecruitment,
  )
  const recruit = useMemo(() => (raw ? toRecruit(raw) : null), [raw])

  const saveRecruit = useCallback(
    async (fields) => {
      const next = { ...recruit, ...fields }
      const saved = await recruitApi.saveRecruitment(eventId, toRecruitRequest(next, recruit.revision))
      setData(saved)
      return toRecruit(saved)
    },
    [eventId, recruit, setData],
  )

  const setPublished = useCallback(
    async (published) => {
      if (published && publicationStatus !== EVENT_PUBLICATION.PUBLISHED) {
        await updateEvent({ publicationStatus: EVENT_PUBLICATION.PUBLISHED })
      }
      return saveRecruit({ published })
    },
    [publicationStatus, saveRecruit, updateEvent],
  )

  const value = useMemo(
    () => ({ recruit, loading, error, reload, saveRecruit, setPublished }),
    [recruit, loading, error, reload, saveRecruit, setPublished],
  )
  return <RecruitContext.Provider value={value}>{children}</RecruitContext.Provider>
}
