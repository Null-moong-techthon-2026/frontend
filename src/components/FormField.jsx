import { useId, useState } from 'react'

// Reusable labeled input row.
//
// - `value` / `onChange(value)`: make it a controlled field. Without `value` it stays an
//   uncontrolled, UI-only input.
// - `error` / `hint`: a red message or a neutral note shown under the input (error wins).
// - `action`: optional trailing chip (중복 확인 / 인증 요청 / 인증 확인). It only does something
//   when `onAction` is given; `actionDisabled` greys it out while a request is running.
// - `type="password"`: gets a 보기/숨기기 visibility toggle, matching the wireframe. The
//   browser's own native reveal-password icon is hidden via CSS so it doesn't double up.
export default function FormField({
  label,
  type = 'text',
  placeholder,
  action,
  onAction,
  actionDisabled = false,
  autoComplete = 'off',
  value,
  onChange,
  error = '',
  hint = '',
  maxLength,
  inputMode,
}) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword ? (revealed ? 'text' : 'password') : type
  const controlled = value !== undefined
  const note = error || hint

  return (
    <div className="form-field">
      <div className="form-field-head">
        <label htmlFor={id}>{label}</label>
        {action && (
          <button
            type="button"
            className="field-chip"
            onClick={onAction}
            disabled={actionDisabled}
          >
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
          maxLength={maxLength}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          {...(controlled ? { value, onChange: (e) => onChange?.(e.target.value) } : {})}
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
      {note && <p className={`form-field-note${error ? ' is-error' : ''}`}>{note}</p>}
    </div>
  )
}
