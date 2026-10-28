import { Outlet, useParams } from 'react-router-dom'
import { getPublicEvent } from '../../api/visitorApi'
import MobileLayout from '../../components/mobile/MobileLayout'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { useAsync } from '../../utils/useAsync'

// The visitor app (/e/:eventId/...): no login. Loads the event once and hands it to the screens
// through the outlet context ({ event }); the top bar's pill is the event name.
export default function VisitorLayout() {
  const { eventId } = useParams()
  const { data: event, error, reload } = useAsync(() => getPublicEvent(eventId), [eventId])
  const base = `/e/${eventId}`

  const tabs = [
    { to: base, end: true, label: '홈', icon: 'home' },
    { to: `${base}/booths`, label: '부스', icon: 'store' },
    { to: `${base}/map`, label: '지도', icon: 'map' },
    { to: `${base}/info`, label: '행사 정보', icon: 'info' },
  ]

  return (
    <MobileLayout chip={event?.name ?? ''} tabs={tabs} bellTo={`${base}/info/notices`}>
      {event ? <Outlet context={{ event, base }} /> : <LoadingBlock error={error} onRetry={reload} />}
    </MobileLayout>
  )
}
