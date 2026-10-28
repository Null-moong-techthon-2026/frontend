import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import MobileLayout from '../../components/mobile/MobileLayout'
import { useAuth } from '../../context/useAuth'
import { STAFF_STATUS, ensureDemoStaff, memberOfAccount, useStaffData } from '../../dummy/staffStore'
import { isDemo, isDemoNewcomer } from '../../utils/demo'
import './staff-app.css'

// The staff app (/staff/...). Tabs: 홈 / 일정 / 공지 / 프로필. A staff account is one member of the
// staff data (dummy/staffStore.js): none yet -> enters an invitation code, then waits for approval.
// Hands { user, data, me, state } to the screens through the outlet context, where state is
//   'none' (no member yet) | 'pending' (waiting for approval) | 'rejected' | 'approved'
export default function StaffLayout() {
  const { user } = useAuth()
  const data = useStaffData()
  const demoStaff = isDemo() && !isDemoNewcomer()

  // Preview mode: the demo account is an approved staff member (?demo=2 stays a newcomer).
  useEffect(() => {
    if (demoStaff) ensureDemoStaff(user)
  }, [demoStaff, user])

  const me = memberOfAccount(data, user.id)
  const state = !me
    ? 'none'
    : me.status === STAFF_STATUS.PENDING
      ? 'pending'
      : me.status === STAFF_STATUS.REJECTED
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
      <Outlet context={{ user, data, me, state }} />
    </MobileLayout>
  )
}
