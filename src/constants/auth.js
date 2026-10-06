// Auth constants. Validation rules mirror the backend DTOs (SignupRequest / LoginRequest);
// the backend re-validates everything, these only give instant feedback.

// Signup type: sent to the backend as `onboardingType`.
export const ONBOARDING_TYPE = {
  ORGANIZER: 'ORGANIZER', // 축제 주최자
  OPERATOR: 'OPERATOR', // 부스 운영자
}

export const LOGIN_ID_PATTERN = /^[a-z0-9_]{4,30}$/
export const PASSWORD_MIN = 8
export const PASSWORD_MAX_BYTES = 72 // the backend limits the UTF-8 byte length
export const NICKNAME_MAX = 100
export const PHONE_PATTERN = /^\+?[0-9]{8,15}$/ // digits only (dashes are removed before sending)
export const EMAIL_MAX = 254

// Where everyone lands after login. The backend does not store the signup type (organizer /
// operator) and /api/me does not return it, so accounts cannot be told apart yet.
// TODO(backend): route by role once /api/me returns one.
export const HOME_PATH = '/organizer/dashboard'

// Backend error `code` -> Korean message shown to the user.
export const AUTH_ERROR_MESSAGE = {
  INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않아요.',
  LOGIN_ID_TAKEN: '이미 사용 중인 아이디예요.',
  VALIDATION_ERROR: '입력한 내용을 다시 확인해 주세요.',
  ACCOUNT_UNAVAILABLE: '사용할 수 없는 계정이에요.',
  NETWORK_ERROR: '서버에 연결할 수 없어요. 백엔드가 실행 중인지 확인해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요.',
}

export const authErrorMessage = (error) =>
  AUTH_ERROR_MESSAGE[error?.code] ?? '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
