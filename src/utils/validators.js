import {
  EMAIL_MAX,
  LOGIN_ID_PATTERN,
  NICKNAME_MAX,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN,
  PHONE_PATTERN,
} from '../constants/auth'

// Each validator returns an error message, or '' when the value is fine.

export const validateLoginId = (v) =>
  LOGIN_ID_PATTERN.test(v) ? '' : '아이디는 영문 소문자, 숫자, _ 로 4~30자여야 해요.'

export function validatePassword(v) {
  if (v.length < PASSWORD_MIN) return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`
  if (new TextEncoder().encode(v).length > PASSWORD_MAX_BYTES) return '비밀번호가 너무 길어요.'
  return ''
}

export const validatePasswordConfirm = (password, confirm) =>
  password === confirm ? '' : '비밀번호가 서로 달라요.'

export function validateNickname(v) {
  if (!v.trim()) return '닉네임을 입력해 주세요.'
  return v.trim().length > NICKNAME_MAX ? `닉네임은 ${NICKNAME_MAX}자 이하여야 해요.` : ''
}

// Digits only, as the backend stores them: '010-1234-5678' -> '01012345678'.
// A leading + is kept ('+82 10-1234-5678' -> '+821012345678'); any other + is dropped.
export const normalizePhone = (v) => {
  const digits = v.replace(/\D/g, '')
  return v.trimStart().startsWith('+') ? `+${digits}` : digits
}

export const validatePhone = (v) =>
  PHONE_PATTERN.test(normalizePhone(v)) ? '' : '전화번호를 숫자 8~15자리로 입력해 주세요.'

export function validateEmail(v) {
  const value = v.trim()
  if (!value) return '이메일을 입력해 주세요.'
  if (value.length > EMAIL_MAX || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return '이메일 형식이 올바르지 않아요.'
  }
  return ''
}
