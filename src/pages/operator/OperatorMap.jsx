import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import MIcon from '../../components/mobile/MobileIcons'
import { EventMap } from '../visitor/VisitorMap'

// 지도에서 보기 · 부스 운영자: the event's floor map inside the booth operator's own app (with the
// operator's tab bar), with the operator's booth picked. Address: /operator/map?event=<id>&booth=<id>
export default function OperatorMap() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const eventId = params.get('event')
  const boothId = params.get('booth')
  if (!eventId) return <Navigate to="/operator/booth" replace />

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate('/operator/booth')}>
        <MIcon name="back" size={18} />
        내 부스
      </button>
      <EventMap
        eventId={eventId}
        action={(booth) =>
          booth.id === boothId ? (
            <button type="button" className="mb-btn is-primary" onClick={() => navigate('/operator/booth')}>
              내 부스 관리
            </button>
          ) : null
        }
      />
    </>
  )
}
