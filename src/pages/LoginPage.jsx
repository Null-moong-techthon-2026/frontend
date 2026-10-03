import { useLocation, useNavigate } from 'react-router-dom'
import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import FormField from '../components/FormField'
import SignupTypeModal from '../components/SignupTypeModal'

// Screens 2 & 3 — login screen, optionally with the "회원가입 유형 선택"
// modal (screen 3) layered on top. Which one is shown is driven purely by
// the route: /login renders the bare form, /signup renders the same form
// with the modal open over it.
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const showTypeModal = location.pathname === '/signup'

  return (
    <ScreenShell>
      <AuthHeader backTo="/" />

      <div className="auth-body">
        <div className="auth-title">
          <h2>로그인</h2>
          <p>운영자 계정으로 로그인해 주세요.</p>
        </div>

        <div className="auth-fields">
          <FormField label="아이디" placeholder="아이디를 입력해 주세요" autoComplete="username" />
          <FormField
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="current-password"
          />
        </div>

        <button type="button" className="btn btn-primary">
          로그인
        </button>

        <p className="auth-links">
          <span className="auth-link">아이디 찾기</span>
          <span className="auth-links-sep" aria-hidden="true">
            |
          </span>
          <span className="auth-link">비밀번호 찾기</span>
        </p>

        <div className="auth-footer">
          <p>아직 계정이 없으신가요?</p>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/signup')}>
            회원가입
          </button>
        </div>
      </div>

      {showTypeModal && <SignupTypeModal onClose={() => navigate('/login')} />}
    </ScreenShell>
  )
}
