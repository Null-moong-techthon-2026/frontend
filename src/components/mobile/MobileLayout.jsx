import { NavLink, useNavigate } from 'react-router-dom'
import boothLogo from '../../assets/booth-logo.png'
import MIcon from './MobileIcons'
import './mobile.css'

// The frame of every mobile screen (booth operator, staff, visitor):
// top bar (logo, role chip, bell) + scrolling content + bottom tabs.
// On a phone it fills the screen; on a wider screen it is a centered phone-sized card.
//
//   chip      text of the pill in the top bar ('부스 운영자', '스태프', the event name, ...)
//   tabs      [{ to, label, icon, end? }]  bottom tab bar (left out when there are none)
//   back      { to, label } shows a "< label" row at the top of the content
//   bellTo    where the bell goes (omit for a bell that does nothing yet)
//   footer    a sticky bar above the tabs (the main action button of a screen)
export default function MobileLayout({ chip, tabs = [], back, bellTo, footer, children }) {
  const navigate = useNavigate()
  return (
    <div className="mb-stage">
      <div className="mb-frame">
        <header className="mb-top">
          <div className="mb-brand">
            <img src={boothLogo} alt="" />
            <span>부스럭</span>
          </div>
          <div className="mb-top-right">
            {chip && <span className="mb-role">{chip}</span>}
            <button
              type="button"
              className="mb-bell"
              aria-label="알림"
              onClick={() => bellTo && navigate(bellTo)}
            >
              <MIcon name="bell" size={20} />
            </button>
          </div>
        </header>

        <main className="mb-scroll">
          {back && (
            <button type="button" className="mb-back" onClick={() => navigate(back.to)}>
              <MIcon name="back" size={18} />
              {back.label}
            </button>
          )}
          {children}
        </main>

        {footer && <div className="mb-footer">{footer}</div>}

        {tabs.length > 0 && (
          <nav className="mb-tabs">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) => `mb-tab${isActive ? ' is-active' : ''}`}
              >
                <MIcon name={t.icon} size={22} />
                <span>{t.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
