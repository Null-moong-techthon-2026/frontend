import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkLoginId, signUp } from '../api/authApi'
import { authErrorMessage } from '../constants/auth'
import {
  normalizePhone,
  validateEmail,
  validateLoginId,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from '../utils/validators'
import FormField from './FormField'

// Signup form shared by the organizer and booth-operator screens.
//   type                'ORGANIZER' | 'OPERATOR' (sent as onboardingType)
//   title / submitLabel texts
//   phoneVerification   show the 인증 요청 / 인증번호 fields (UI only: the backend has no phone
//                       verification yet, so they are disabled and do not block signup)
export default function SignupForm({ type, title, submitLabel, phoneVerification = false }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    loginId: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    phone: '',
    email: '',
  })
  // 'idle' | 'checking' | 'available' | 'taken' — result of the 중복 확인 button
  const [idCheck, setIdCheck] = useState('idle')
  const [showErrors, setShowErrors] = useState(false) // show field errors after the first submit
  const [serverError, setServerError] = useState('')
  const [serverIdError, setServerIdError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setServerError('')
    if (key === 'loginId') {
      setIdCheck('idle')
      setServerIdError(false)
    }
  }

  const errors = {
    loginId: validateLoginId(form.loginId),
    password: validatePassword(form.password),
    passwordConfirm: validatePasswordConfirm(form.password, form.passwordConfirm),
    nickname: validateNickname(form.nickname),
    phone: validatePhone(form.phone),
    email: validateEmail(form.email),
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const shown = (key) => (showErrors ? errors[key] : '')

  const runIdCheck = async () => {
    if (errors.loginId) {
      setShowErrors(true)
      return
    }
    setIdCheck('checking')
    try {
      const { available } = await checkLoginId(form.loginId)
      setIdCheck(available ? 'available' : 'taken')
    } catch (err) {
      setIdCheck('idle')
      setServerError(authErrorMessage(err))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setShowErrors(true)
    if (hasErrors) return
    if (idCheck === 'taken') return

    setServerError('')
    setSubmitting(true)
    try {
      await signUp({
        onboardingType: type,
        loginId: form.loginId,
        password: form.password,
        nickname: form.nickname.trim(),
        phoneNumber: normalizePhone(form.phone),
        email: form.email.trim(),
      })
      navigate('/login', { replace: true, state: { signedUp: true } })
    } catch (err) {
      if (err.code === 'LOGIN_ID_TAKEN') {
        setIdCheck('taken')
        setServerIdError(true)
      } else {
        setServerError(authErrorMessage(err))
      }
      setSubmitting(false)
    }
  }

  const idError =
    shown('loginId') ||
    (idCheck === 'taken' || serverIdError ? '이미 사용 중인 아이디예요.' : '')

  return (
    <form className="auth-body" onSubmit={submit} noValidate>
      <div className="auth-title">
        <h2>{title}</h2>
      </div>

      {serverError && (
        <p className="auth-alert" role="alert">
          {serverError}
        </p>
      )}

      <div className="auth-fields">
        <FormField
          label="아이디"
          placeholder="아이디를 입력해 주세요"
          action={idCheck === 'checking' ? '확인 중…' : idCheck === 'available' ? '사용 가능' : '중복 확인'}
          onAction={runIdCheck}
          actionDisabled={idCheck === 'checking' || idCheck === 'available'}
          autoComplete="username"
          maxLength={30}
          value={form.loginId}
          onChange={set('loginId')}
          error={idError}
          hint={
            idCheck === 'available'
              ? '사용할 수 있는 아이디예요.'
              : '영문 소문자, 숫자, _ 로 4~30자'
          }
        />
        <FormField
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해 주세요"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={shown('password')}
          hint="8자 이상"
        />
        <FormField
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력해 주세요"
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={set('passwordConfirm')}
          error={shown('passwordConfirm')}
        />
        <FormField
          label="닉네임"
          placeholder="닉네임을 입력해 주세요"
          maxLength={100}
          value={form.nickname}
          onChange={set('nickname')}
          error={shown('nickname')}
        />
        <FormField
          label={phoneVerification ? '전화번호' : '전화번호 (필수)'}
          placeholder="01000000000"
          maxLength={16}
          action={phoneVerification ? '인증 요청' : undefined}
          actionDisabled
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          // Hyphens/spaces/letters are dropped as you type or paste, so only digits remain.
          onChange={(v) => set('phone')(normalizePhone(v))}
          error={shown('phone')}
          hint={
            phoneVerification
              ? '하이픈(-) 없이 숫자만 입력해 주세요. 전화번호 인증은 준비 중이에요.'
              : '하이픈(-) 없이 숫자만 입력해 주세요.'
          }
        />
        {phoneVerification && (
          <FormField
            label="인증번호"
            placeholder="인증번호를 입력해 주세요"
            action="인증 확인"
            actionDisabled
          />
        )}
        <FormField
          label="이메일"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          maxLength={254}
          value={form.email}
          onChange={set('email')}
          error={shown('email')}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? '가입 중…' : submitLabel}
      </button>
    </form>
  )
}
