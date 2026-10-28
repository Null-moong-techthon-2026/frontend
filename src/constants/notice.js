// Notice domain constants. Values are the codes sent to / received from the backend;
// labels are display-only Korean text.
//
// The backend only knows DRAFT / PUBLISHED. "게시 종료" (closed) is a notice that was published once
// and then taken back to DRAFT; the UI tells it apart from a plain draft by `publishedAt`.

export const NOTICE_STATUS = {
  PUBLISHED: 'published', // 게시 중
  CLOSED: 'closed', // 게시 종료
  DRAFT: 'draft', // 임시 저장
}

export const NOTICE_STATUS_LABEL = {
  [NOTICE_STATUS.PUBLISHED]: '게시 중',
  [NOTICE_STATUS.CLOSED]: '게시 종료',
  [NOTICE_STATUS.DRAFT]: '임시 저장',
}

export const NOTICE_AUDIENCE = {
  STAFF: 'STAFF',
  BOOTH: 'OPERATORS',
  VISITOR: 'PUBLIC',
}

// Order = display order everywhere (checkboxes, list text, filter).
export const NOTICE_AUDIENCE_LABEL = {
  [NOTICE_AUDIENCE.STAFF]: '스태프',
  [NOTICE_AUDIENCE.BOOTH]: '부스 운영자',
  [NOTICE_AUDIENCE.VISITOR]: '일반 방문객',
}

// One optional image per notice (PNG or JPEG). Checked by extension here; the backend checks the
// real file content.
export const NOTICE_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg']
export const NOTICE_IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10MB
export const NOTICE_TITLE_MAX = 200
export const NOTICE_BODY_MAX = 10000
