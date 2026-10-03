import { useId, useState } from 'react'

// Reusable labeled input row.
//
// - `action`: optional trailing button for things like 중복확인 / 인증요청 /
//   인증확인. These are backend-dependent, so they are rendered as inert
//   UI-only buttons (no handler wired up) until the real API exists.
// - `type="password"`: gets a 보기/숨기기 visibility toggle, matching the
//   wireframe. The browser's own native reveal-password icon is hidden via
//   CSS so it doesn't double up with this toggle.
export default function FormField({
  label,
  type = 'text',
  placeholder,
  action,
  autoComplete = 'off',
}) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword ? (revealed ? 'text' : 'password') : type

  return (
    <div className="form-field">
      <div className="form-field-head">
        <label htmlFor={id}>{label}</label>
        {action && (
          <button type="button" className="field-chip">
            {action}
          </button>
        )}
      </div>
      <div className={`form-field-row${isPassword ? ' form-field-row--merged' : ''}`}>
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? '숨기기' : '보기'}
          </button>
        )}
      </div>
    </div>
  )
}
