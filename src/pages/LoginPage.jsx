import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import FormField from '../components/FormField'
import SignupTypeModal from '../components/SignupTypeModal'
import { AUTH_ERROR_MESSAGE, LOGIN_ID_PATTERN, authErrorMessage } from '../constants/auth'
import { peekAfterLogin } from '../utils/afterLogin'
import { homePathFor } from '../utils/role'
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
  const [soon, setSoon] = useState(false) // 아이디·비밀번호 찾기 was tapped

  // Logged in (just now, or /login was opened again): go back to the page they asked for, or
  // to the dashboard. A successful login() fills `user`, which triggers this redirect.
  const target = location.state?.from ?? peekAfterLogin()
  if (ready && user) return <Navigate to={target ?? homePathFor(user)} replace />

  const signedUp = location.state?.signedUp // set by the signup pages after success
  // Came from an invitation link: say which kind of account it is for.
  const inviteHint = target?.startsWith('/invite/staff/')
    ? '스태프 초대 링크로 오셨어요. 로그인하거나 스태프로 회원가입해 주세요.'
    : target?.startsWith('/invite/')
      ? '부스 운영자 초대 링크로 오셨어요. 로그인하거나 부스 운영자로 회원가입해 주세요.'
      : ''

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
          <p>계정으로 로그인해 주세요.</p>
        </div>

        {inviteHint && !signedUp && <p className="auth-notice">{inviteHint}</p>}
        {soon && <p className="auth-notice">아이디·비밀번호 찾기는 아직 준비 중이에요.</p>}
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
          <button type="button" className="auth-link" onClick={() => setSoon(true)}>
            아이디 찾기
          </button>
          <span className="auth-links-sep" aria-hidden="true">
            |
          </span>
          <button type="button" className="auth-link" onClick={() => setSoon(true)}>
            비밀번호 찾기
          </button>
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
