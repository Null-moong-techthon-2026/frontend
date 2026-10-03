import { useNavigate } from 'react-router-dom'
import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'

// Stand-in for screens that live outside the 5 auth wireframes
// (e.g. where 시작하기 leads once the main app exists).
export default function PlaceholderPage({ title = '메인 화면' }) {
  const navigate = useNavigate()

  return (
    <ScreenShell>
      <AuthHeader backTo="/" />
      <div className="auth-body placeholder-body">
        <p>{title} 화면은 준비 중이에요.</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
          처음으로
        </button>
      </div>
    </ScreenShell>
  )
}
