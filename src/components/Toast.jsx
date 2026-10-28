// Renders the message of useToast() at the bottom of the screen; nothing when there is none.
export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div
      key={toast.id}
      className={`om-toast${toast.tone === 'error' ? ' is-error' : ''}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
    >
      {toast.message}
    </div>
  )
}
