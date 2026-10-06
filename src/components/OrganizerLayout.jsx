import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import boothLogo from '../assets/booth-logo.png'
import { HOME_PATH } from '../constants/auth'
import { EVENT_PROGRESS, EVENT_PROGRESS_LABEL } from '../constants/event'
import { useAuth } from '../context/useAuth'
import { useEvent } from '../context/useEvent'
import { formatDateRange } from '../utils/date'
import { getEventProgress } from '../utils/event'
import '../pages/organizer-map.css'

const NAV = [
  { key: 'dashboard', label: '대시보드', icon: 'grid', to: '/organizer/dashboard' },
  { key: 'map', label: '지도 제작', icon: 'map', to: '/organizer/map' },
  { key: 'booths', label: '부스 관리', icon: 'store', to: '/organizer/booths' },
  { key: 'recruit', label: '부스 모집', icon: 'megaphone', to: '/organizer/recruit' },
  { key: 'live', label: '실시간 운영 현황', icon: 'chart', to: '/organizer/live' },
  { key: 'notice', label: '공지사항', icon: 'bell', to: '/organizer/notices' },
  { key: 'settle', label: '정산 관리', icon: 'won', badge: '준비중' },
]


export function Icon({ name }) {
  const paths = {
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
    store: <path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />,
    megaphone: <path d="M3 10v4h4l9 5V5L7 10H3Zm16-1a3 3 0 0 1 0 6" />,
    chart: <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />,
    bell: <path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4h4" />,
    won: <path d="M4 8h16M4 12h16M7 4l3 16 2-10 2 10 3-16" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
    info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v5m0-8v.5" />,
    'plus-cross': <path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5Z" />,
    upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />,
    image: <path d="M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01" />,
    plus: <path d="M12 5v14M5 12h14" />,
    calendar: <path d="M5 6h14v14H5zM5 10h14M9 4v4m6-4v4" />,
    search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    trash: <path d="M4 7h16M9 7V4h6v3m-7 0 1 13h8l1-13" />,
    pin: <path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Z" />,
    cursor: <path d="M5 3l14 8-6 1.5L10 20 5 3Z" />,
    hand: <path d="M8 13V5a1.5 1.5 0 0 1 3 0v5m0-3a1.5 1.5 0 0 1 3 0v3m0-2a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3a1.5 1.5 0 0 1 2.5-1.6L8 13" />,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

// Shared organizer chrome: sidebar + white top bar + page header. Pages render their body as children.
export default function OrganizerLayout({ active, crumb, title, subtitle, actions, children }) {
  const navigate = useNavigate()
  const { event } = useEvent()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const userMenuRef = useRef(null)

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => !userMenuRef.current?.contains(e.target) && setMenuOpen(false)
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }
  const progress = getEventProgress(event.startDate, event.endDate)

  return (
    <div className="om-app">
      <aside className="om-sidebar">
        <button
          type="button"
          className="om-brand"
          aria-label="대시보드로 이동"
          onClick={() => navigate(HOME_PATH)}
        >
          <img src={boothLogo} alt="" className="om-brand-logo" />
          <span className="om-brand-name">부스럭</span>
        </button>

        <div className="om-event-card">
          <p className="om-event-name">{event.name}</p>
          <p className="om-event-date">{formatDateRange(event.startDate, event.endDate)}</p>
          <span className={`om-badge${progress === EVENT_PROGRESS.ONGOING ? '' : ' is-muted'}`}>
            {EVENT_PROGRESS_LABEL[progress]}
          </span>
        </div>

        <nav className="om-nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`om-nav-item${item.key === active ? ' is-active' : ''}`}
              onClick={() => item.to && navigate(item.to)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="om-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="om-main">
        <header className="om-topbar">
          <p className="om-crumb">행사 운영 / {crumb}</p>
          <div className="om-topbar-right">
            <button type="button" className="om-icon-btn" aria-label="알림">
              <Icon name="bell" />
            </button>
            <div className="om-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="om-user"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="om-avatar">{user?.nickname?.slice(0, 1)}</span>
                {user?.nickname ?? ''}님
                <Icon name="chevron" />
              </button>
              {menuOpen && (
                <div className="om-user-popover" role="menu">
                  <div className="om-user-info">
                    <strong>{user?.nickname}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    className="om-user-logout"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? '로그아웃 중…' : '로그아웃'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="om-page-head">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="om-page-actions">{actions}</div>
        </div>

        {children}
      </main>
    </div>
  )
}
