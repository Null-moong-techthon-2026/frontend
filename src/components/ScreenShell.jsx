// Shared responsive frame for every auth screen.
//
// - On phone-width viewports the card fills the whole viewport (edge-to-edge),
//   just like a native app screen.
// - On wider (desktop/tablet) viewports the same content is shown as a
//   centered, phone-proportioned card floating on a neutral background,
//   so the exact same markup works for both form factors.
export default function ScreenShell({ children, className = '' }) {
  return (
    <div className="screen-shell">
      <div className={`screen-card ${className}`.trim()}>{children}</div>
    </div>
  )
}
