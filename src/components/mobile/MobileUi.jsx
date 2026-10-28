import { BOOTH_OPERATING_STATUS as OP, BOOTH_OPERATING_STATUS_LABEL, STOCK_LEVEL, STOCK_LEVEL_LABEL } from '../../constants/booth'
import MIcon from './MobileIcons'
import './mobile-ui.css'

// Pieces shared by the mobile screens.

// The little tent picture used wherever an uploaded image is missing (event / booth).
export function TentArt({ className = '' }) {
  return (
    <svg className={`mb-tent ${className}`} viewBox="0 0 320 130" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="130" fill="#dfeae5" />
      <circle cx="268" cy="30" r="16" fill="#e9f3b8" />
      <path d="M0 105c40-26 80-26 120-8s90 14 200-14v47H0z" fill="#c8dbd3" />
      <g>
        <path d="M52 52h64l8 22H44z" fill="#d9f58a" />
        <path d="M60 52l-4 22M76 52l-2 22M92 52v22M108 52l2 22" stroke="#3d7b70" strokeWidth="3" />
        <rect x="54" y="74" width="60" height="30" fill="#fff" />
        <path d="M128 52h64l8 22h-80z" fill="#9db8ae" />
        <rect x="130" y="74" width="60" height="30" fill="#f1f5f3" />
        <path d="M204 52h64l8 22h-80z" fill="#d9f58a" />
        <path d="M212 52l-4 22M228 52l-2 22M244 52v22M260 52l2 22" stroke="#3d7b70" strokeWidth="3" />
        <rect x="206" y="74" width="60" height="30" fill="#fff" />
      </g>
    </svg>
  )
}

// The picture of an event: the one the organizer uploaded, else the tent picture.
export function EventPicture({ event, className = '' }) {
  return (
    <div className={`mb-pic ${className}`}>
      {event?.imageUrl ? <img src={event.imageUrl} alt={`${event.name} 대표 이미지`} /> : <TentArt />}
    </div>
  )
}

// A booth's photo (the backend has none yet): a tinted square with a store icon.
export function BoothThumb({ booth, className = '' }) {
  if (booth.imageUrl) {
    return (
      <div className={`mb-thumb ${className}`}>
        <img src={booth.imageUrl} alt="" />
      </div>
    )
  }
  return (
    <div className={`mb-thumb is-empty ${className}`} aria-hidden="true">
      <MIcon name="store" size={26} />
    </div>
  )
}

// 운영 중 (lime) / 품절 (red) / 준비 중 · 마감 (gray)
export function OperationChip({ status }) {
  const tone = status === OP.OPEN ? '' : status === OP.SOLD_OUT ? ' is-red' : ' is-gray'
  return <span className={`mb-chip${tone}`}>{BOOTH_OPERATING_STATUS_LABEL[status] ?? ''}</span>
}

// 충분 / 부족 / 품절 / 무제한
export function StockChip({ status }) {
  const tone = status === STOCK_LEVEL.LOW ? '' : status === STOCK_LEVEL.SOLD_OUT ? ' is-gray' : ' is-outline'
  return <span className={`mb-chip${tone}`}>{STOCK_LEVEL_LABEL[status] ?? ''}</span>
}

export function LoadingBlock({ error, onRetry, children = '불러오는 중…' }) {
  if (error) {
    return (
      <div className="mb-empty">
        <p>{error.status === 404 ? '찾을 수 없어요.' : '불러오지 못했어요. 잠시 후 다시 시도해 주세요.'}</p>
        {onRetry && (
          <button type="button" className="mb-btn is-outline is-sm" onClick={onRetry}>
            다시 시도
          </button>
        )}
      </div>
    )
  }
  return <div className="mb-loading">{children}</div>
}
