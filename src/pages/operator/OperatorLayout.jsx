import { Outlet } from 'react-router-dom'
import { listMyBoothViews } from '../../api/operatorApi'
import MobileLayout from '../../components/mobile/MobileLayout'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { useAuth } from '../../context/useAuth'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// The booth operator app (/operator/...). Before the operator has a booth the tabs are
// 홈 / 부스 모집 / 상태&초대 / 프로필; once a booth is approved they are 홈 / 내 부스 / 공지 / 프로필.
// Loads the operator's booths once and hands them to the screens through the outlet context:
//   { user, booths, booth (the first one or null), joined, reload }
export default function OperatorLayout() {
  const { user } = useAuth()
  const { data: booths, error, reload } = useAsync(listMyBoothViews, [user.id])
  const joined = (booths?.length ?? 0) > 0

  const tabs = joined
    ? [
        { to: '/operator/home', label: '홈', icon: 'home' },
        { to: '/operator/booth', label: '내 부스', icon: 'store' },
        { to: '/operator/notices', label: '공지', icon: 'bell' },
        { to: '/operator/profile', label: '프로필', icon: 'user' },
      ]
    : [
        { to: '/operator/home', label: '홈', icon: 'home' },
        { to: '/operator/recruits', label: '부스 모집', icon: 'doc' },
        { to: '/operator/invite', label: '상태&초대', icon: 'link' },
        { to: '/operator/profile', label: '프로필', icon: 'user' },
      ]

  return (
    <MobileLayout chip="부스 운영자" tabs={tabs} bellTo={joined ? '/operator/notices' : undefined}>
      {booths ? (
        <Outlet context={{ user, booths, booth: booths[0] ?? null, joined, reload }} />
      ) : (
        <LoadingBlock error={error} onRetry={reload} />
      )}
    </MobileLayout>
  )
}
