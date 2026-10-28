import AuthHeader from '../components/AuthHeader'
import ScreenShell from '../components/ScreenShell'
import { useAuth } from '../context/useAuth'

// Shown to booth-operator accounts: their own screens (apply, run my booth) do not exist yet and
// the organizer screens are not for them.
export default function OperatorPreparingPage() {
  const { user, logout } = useAuth()
  return (
    <ScreenShell>
      <AuthHeader showBack={false} />
      <div className="auth-body placeholder-body">
        <p>
          <strong>{user?.nickname}님은 부스 운영자 계정이에요.</strong>
          <br />
          부스 운영자 전용 화면은 아직 준비 중이에요. 조금만 기다려 주세요.
        </p>
        <button type="button" className="btn btn-outline" onClick={logout}>
          로그아웃
        </button>
      </div>
    </ScreenShell>
  )
}
