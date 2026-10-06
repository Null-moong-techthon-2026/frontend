import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './menu-select.css'

const OPTION_HEIGHT = 36

// A button that opens a small list of options (used for a booth's operating status and for the
// stock level of a menu item). The list is rendered in a portal with fixed positioning so it is
// never clipped by a scrolling table or panel.
//
//   value / options [{ value, label }] / onChange(value)
//   buttonClassName   extra class(es) for the button, e.g. to colour it by the current value
export default function MenuSelect({
  value,
  options,
  onChange,
  buttonClassName = '',
  disabled = false,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const buttonRef = useRef(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e) => e.key === 'Escape' && close()
    const onDown = (e) => {
      if (buttonRef.current?.contains(e.target) || e.target.closest?.('.ms-popover')) return
      close()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true) // any scroll moves the button away from the list
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  const toggle = (e) => {
    e.stopPropagation() // the button often sits inside a clickable table row
    if (open) return setOpen(false)
    const r = buttonRef.current.getBoundingClientRect()
    const needed = options.length * OPTION_HEIGHT + 12
    const flip = window.innerHeight - r.bottom < needed && r.top > needed
    setPos({
      left: r.left,
      minWidth: Math.max(r.width, 96),
      ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    })
    setOpen(true)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`ms-btn ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
      >
        {current?.label ?? ''}
        <span className="ms-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open &&
        createPortal(
          <ul className="ms-popover" role="listbox" style={pos}>
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={o.value === value ? 'is-current' : ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (o.value !== value) onChange(o.value)
                    setOpen(false)
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
