import { useNavigate, useOutletContext } from 'react-router-dom'
import { listSponsors } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

// 04-3 스폰서 전체 목록 · 일반 사용자
export default function VisitorSponsors() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  const { data: sponsors, error, reload } = useAsync(() => listSponsors(event.id), [event.id])
  const main = (sponsors ?? []).filter((s) => s.main)
  const others = (sponsors ?? []).filter((s) => !s.main)

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate(`${base}/info`)}>
        <MIcon name="back" size={18} />
        행사 정보
      </button>
      <h1 className="mb-title">함께하는 파트너</h1>
      <p className="mb-sub">{event.name}을 함께 만들어가는 후원사입니다.</p>

      {!sponsors ? (
        <LoadingBlock error={error} onRetry={reload} />
      ) : sponsors.length === 0 ? (
        <p className="mb-empty">아직 등록된 후원사가 없어요.</p>
      ) : (
        <>
          {main.length > 0 && <h2 className="mb-h3">메인 파트너</h2>}
          {main.map((s) => (
            <div key={s.id} className="mb-card vs-sponsor">
              <div className="vs-sponsor-head">
                <span className="vs-avatar is-lg">{s.name.slice(-1)}</span>
                <span>
                  <strong>{s.name}</strong>
                  <span className="mb-chip">메인</span>
                </span>
              </div>
              <p className="mb-muted">{s.description}</p>
              <a className="mb-btn is-primary" href={s.url} target="_blank" rel="noreferrer">
                후원사 웹사이트 <MIcon name="external" size={15} />
              </a>
            </div>
          ))}
          {others.length > 0 && <h2 className="mb-h3">일반 파트너</h2>}
          {others.map((s) => (
            <div key={s.id} className="mb-card vs-sponsor">
              <div className="vs-sponsor-head">
                <span className="vs-avatar">{s.name.slice(-1)}</span>
                <span>
                  <strong>{s.name}</strong>
                </span>
              </div>
              <p className="mb-muted">{s.description}</p>
              <a className="mb-btn is-outline is-sm" href={s.url} target="_blank" rel="noreferrer">
                후원사 웹사이트 <MIcon name="external" size={14} />
              </a>
            </div>
          ))}
        </>
      )}
    </>
  )
}
