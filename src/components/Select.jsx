import { Icon } from './OrganizerLayout'
import './select.css'

// Styled native <select>; children are <option>s.
export default function Select({ value, onChange, children }) {
  return (
    <label className="ui-select">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <Icon name="chevron" />
    </label>
  )
}
