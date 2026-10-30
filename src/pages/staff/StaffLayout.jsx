import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getEvent } from '../../api/eventApi'
import { listMyStaffMemberships } from '../../api/staffApi'
import MobileLayout from '../../components/mobile/MobileLayout'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { useAuth } from '../../context/useAuth'
import { DEMO_EVENT } from '../../dummy/demoData'
import { STAFF_STATUS, setDemoNewcomer } from '../../dummy/staffStore'
import { isDemo, isDemoNewcomer } from '../../utils/demo'
import { toEvent } from '../../utils/event'
import { useAsync } from '../../utils/useAsync'
import './staff-app.css'

// What the staff app shows of the event: the event itself when the account may read it, else what
// the membership says about it.
async function loadEvent(mine) {
  if (isDemo()) return DEMO_EVENT
  const fallback = {
    id: mine.eventId,
    name: mine.eventName,
    organizationName: '',
    startDate: mine.startDate,
    endDate: mine.endDate,
    venue: mine.venue,
    intro: '',
    imageUrl: null,
    hours: null,
    phone: null,
    directions: null,
  }
  try {
    return { ...fallback, ...toEvent(await getEvent(mine.eventId)), hours: null, phone: null, directions: null }
  } catch {
    return fallback
  }
}

// The staff app (/staff/...). Tabs: 홈 / 일정 / 공지 / 프로필. A staff account joins an event with an
// invitation code and waits for the organizer's approval. Hands these to the screens through the
// outlet context:
//   { user, mine (the membership or null), state, event, reload }
// where state is 'none' (not joined) | 'pending' (waiting for approval) | 'rejected' | 'approved'.
export default function StaffLayout() {
  const { user } = useAuth()
  // Preview mode: ?demo=1 is an approved staff member, ?demo=2 a newcomer.
  useState(() => {
    if (isDemo()) setDemoNewcomer(isDemoNewcomer())
    return null
  })
  const { data: memberships, error, reload } = useAsync(listMyStaffMemberships, [user.id])
  const mine = memberships?.[0] ?? null
  const { data: event } = useAsync(() => (mine ? loadEvent(mine) : null), [mine?.eventId])

  const state = !mine
    ? 'none'
    : mine.status === STAFF_STATUS.PENDING
      ? 'pending'
      : mine.status === STAFF_STATUS.REJECTED
        ? 'rejected'
        : 'approved'

  const tabs = [
    { to: '/staff/home', label: '홈', icon: 'home' },
    { to: '/staff/schedule', label: '일정', icon: 'calendar' },
    { to: '/staff/notices', label: '공지', icon: 'bell' },
    { to: '/staff/profile', label: '프로필', icon: 'user' },
  ]

  return (
    <MobileLayout chip="스태프" tabs={tabs} bellTo="/staff/notices">
      {memberships && (state === 'none' || event) ? (
        <Outlet context={{ user, mine, state, event, reload }} />
      ) : (
        <LoadingBlock error={error} onRetry={reload} />
      )}
    </MobileLayout>
  )
}
