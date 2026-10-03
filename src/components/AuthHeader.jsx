import { useNavigate } from 'react-router-dom'
import { IconChevronLeft } from './icons'

// Header bar shared by every screen except the landing page:
// back button (optional) + centered app title + bottom divider.
export default function AuthHeader({ title = '부스럭', showBack = true, backTo }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <header className="auth-header">
      {showBack ? (
        <button
          type="button"
          className="auth-header-back"
          onClick={handleBack}
          aria-label="뒤로 가기"
        >
          <IconChevronLeft />
        </button>
      ) : (
        <span />
      )}
      <h1 className="auth-header-title">{title}</h1>
      <span />
    </header>
  )
}
