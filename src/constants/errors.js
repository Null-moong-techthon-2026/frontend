// Backend error `code` -> Korean message for everything except login / signup (see
// constants/auth.js). Unknown codes fall back to a generic message.

export const API_ERROR_MESSAGE = {
  NETWORK_ERROR: '서버에 연결할 수 없어요. 백엔드가 실행 중인지 확인해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요.',
  AUTHENTICATION_REQUIRED: '로그인이 필요해요.',
  VALIDATION_ERROR: '입력한 내용을 다시 확인해 주세요.',
  FORBIDDEN: '이 작업을 할 권한이 없어요.',
  RESOURCE_NOT_FOUND: '찾을 수 없는 항목이에요. 새로고침한 뒤 다시 시도해 주세요.',
  REVISION_CONFLICT: '다른 곳에서 먼저 수정됐어요. 새로고침해 최신 내용을 확인해 주세요.',
  INVALID_STATE: '지금 상태에서는 할 수 없는 작업이에요.',
  DUPLICATE_APPLICATION: '이미 검토 중인 신청이 있어요.',
  BOOTH_CODE_TAKEN: '이미 사용 중인 부스 번호예요.',
  RECRUITMENT_CLOSED: '모집 공고가 공개 중이 아니거나 마감됐어요.',
  DOCUMENTS_NOT_VERIFIED: '필수 서류를 모두 확인 완료로 바꾼 뒤에 승인할 수 있어요.',
  RECRUITMENT_TERMS_LOCKED: '첫 신청이 들어온 뒤에는 카테고리·참가비·필요 서류를 바꿀 수 없어요.',
  FILE_TOO_LARGE: '이미지는 최대 10MB까지 올릴 수 있어요.',
  UNSUPPORTED_MEDIA_TYPE: 'PNG 또는 JPG 이미지만 올릴 수 있어요.',
  MAP_NOT_PUBLISHED: '게시된 지도가 아직 없어요.',
  RATE_LIMITED: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  MEDIA_STORAGE_ERROR: '이미지를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

export const apiErrorMessage = (error) =>
  API_ERROR_MESSAGE[error?.code] ?? '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
