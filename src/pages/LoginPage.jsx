import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import FormField from '../components/FormField'
import SignupTypeModal from '../components/SignupTypeModal'
import { AUTH_ERROR_MESSAGE, HOME_PATH, LOGIN_ID_PATTERN, authErrorMessage } from '../constants/auth'
import { useAuth } from '../context/useAuth'

// Screens 2 & 3 — login screen, optionally with the "회원가입 유형 선택"
// modal (screen 3) layered on top. Which one is shown is driven purely by
// the route: /login renders the bare form, /signup renders the same form
// with the modal open over it.
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, ready, login } = useAuth()
  const showTypeModal = location.pathname === '/signup'

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Logged in (just now, or /login was opened again): go back to the page they asked for, or
  // to the dashboard. A successful login() fills `user`, which triggers this redirect.
  if (ready && user) return <Navigate to={location.state?.from ?? HOME_PATH} replace />

  const signedUp = location.state?.signedUp // set by the signup pages after success

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const id = loginId.trim()
    if (!id || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.')
      return
    }
    // A malformed ID can never exist, so don't bother the server.
    if (!LOGIN_ID_PATTERN.test(id)) {
      setError(AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS)
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await login(id, password)
    } catch (err) {
      setError(authErrorMessage(err.code === 'VALIDATION_ERROR' ? { code: 'INVALID_CREDENTIALS' } : err))
      setSubmitting(false)
    }
  }

  return (
    <ScreenShell>
      <AuthHeader backTo="/" />

      <form className="auth-body" onSubmit={submit} noValidate>
        <div className="auth-title">
          <h2>로그인</h2>
          <p>운영자 계정으로 로그인해 주세요.</p>
        </div>

        {signedUp && !error && (
          <p className="auth-notice">회원가입이 완료됐어요. 로그인해 주세요.</p>
        )}
        {error && (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        )}

        <div className="auth-fields">
          <FormField
            label="아이디"
            placeholder="아이디를 입력해 주세요"
            autoComplete="username"
            value={loginId}
            onChange={setLoginId}
          />
          <FormField
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
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
      </form>

      {showTypeModal && <SignupTypeModal onClose={() => navigate('/login')} />}
    </ScreenShell>
  )
}
