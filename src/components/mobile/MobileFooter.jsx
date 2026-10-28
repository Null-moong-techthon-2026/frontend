import './mobile-ui.css'

// The main action button of a screen, stuck to the bottom of the scrolling content (right above
// the tab bar), like the "신청하기" / "지도에서 보기" bars of the wireframes.
export default function MobileFooter({ children }) {
  return <div className="mb-sticky">{children}</div>
}
