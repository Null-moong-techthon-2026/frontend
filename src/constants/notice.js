// Notice domain constants. Values are the codes sent to / received from the backend;
// labels are display-only Korean text.

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
  STAFF: 'staff',
  BOOTH: 'booth',
  VISITOR: 'visitor',
}

// Order = display order everywhere (checkboxes, list text, filter).
export const NOTICE_AUDIENCE_LABEL = {
  [NOTICE_AUDIENCE.STAFF]: '스태프',
  [NOTICE_AUDIENCE.BOOTH]: '부스 운영자',
  [NOTICE_AUDIENCE.VISITOR]: '일반 방문객',
}

// Attachments: checked by file extension (browsers report no reliable MIME type for hwp, etc.).
export const NOTICE_ATTACHMENT_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'webp', // images (shown inline)
  'pdf',
  'hwp', 'hwpx', // 한글
  'doc', 'docx',
  'ppt', 'pptx',
  'xls', 'xlsx', 'csv',
  'txt', 'zip',
]
export const NOTICE_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
export const NOTICE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024 // 10MB per file
export const NOTICE_ATTACHMENT_MAX_COUNT = 5
