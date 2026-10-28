import { useCallback, useMemo, useState } from 'react'
import * as eventApi from '../api/eventApi'
import { localDateTimeToInstant } from '../utils/date'
import { InvitationContext } from './InvitationContext'
import { useEvent } from './useEvent'
import { useEventData } from './useEventData'
import { useRecruit } from './useRecruit'

// The invitation code booth operators use to apply (대시보드 / 부스 관리의 초대 링크).
//
// The backend only keeps a hash of the code, so the code and link are readable exactly once: in
// the response that issues them. This provider keeps that response in memory (`issued`) until the
// page is reloaded; afterwards only the state of the invitation is known.
//
//   invitation  null (no invitation yet) | { id, createdAt, expiresAt, active }
//   issued      null | { code, inviteUrl, expiresAt }    the last code issued in this session
//   loading
//   issue()     issues a new code that lasts until the recruitment deadline; the old one stops
//               working. Throws ApiError, or Error('NO_DEADLINE') when no deadline is saved yet.
//   revoke()    ends the current invitation
export default function InvitationProvider({ children }) {
  const { event } = useEvent()
  const { recruit } = useRecruit()
  const eventId = event?.id ?? null
  const deadline = recruit?.deadline ?? ''
  const [issuedState, setIssued] = useState({ eventId: null, value: null })
  const { data, loading, setData } = useEventData(eventId, eventApi.getInvitation)

  const issued = issuedState.eventId === eventId ? issuedState.value : null

  const issue = useCallback(async () => {
    if (!deadline) throw new Error('NO_DEADLINE')
    const result = await eventApi.issueInvitation(eventId, localDateTimeToInstant(deadline))
    setIssued({ eventId, value: result })
    setData({
      invitation: {
        id: result.id,
        createdAt: new Date().toISOString(),
        expiresAt: result.expiresAt,
        active: true,
      },
    })
    return result
  }, [eventId, deadline, setData])

  const revoke = useCallback(async () => {
    await eventApi.revokeInvitation(eventId)
    setIssued({ eventId: null, value: null })
    setData({ invitation: null })
  }, [eventId, setData])

  const value = useMemo(
    () => ({ invitation: data?.invitation ?? null, issued, loading, issue, revoke }),
    [data, issued, loading, issue, revoke],
  )
  return <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>
}
