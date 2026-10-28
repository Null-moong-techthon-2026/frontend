// Booth domain constants. The *values* are what the backend sends/receives (stable codes);
// the *labels* are display-only Korean text and never leave the UI.

// Review status of a booth application.
export const BOOTH_STATUS = {
  PENDING: 'PENDING', // 검토 중 (no decision yet)
  APPROVED: 'APPROVED', // 승인
  REJECTED: 'REJECTED', // 반려
}

export const BOOTH_STATUS_LABEL = {
  [BOOTH_STATUS.PENDING]: '검토 중',
  [BOOTH_STATUS.APPROVED]: '승인',
  [BOOTH_STATUS.REJECTED]: '반려',
}

// Order = display order (filters, checkboxes).
export const BOOTH_CATEGORY = {
  FOOD: 'FOOD',
  BEVERAGE: 'BEVERAGE',
  EXPERIENCE: 'EXPERIENCE',
  GAME: 'GAME',
  GOODS: 'GOODS',
  OTHER: 'OTHER',
}

export const BOOTH_CATEGORY_LABEL = {
  [BOOTH_CATEGORY.FOOD]: '음식',
  [BOOTH_CATEGORY.BEVERAGE]: '음료',
  [BOOTH_CATEGORY.EXPERIENCE]: '체험',
  [BOOTH_CATEGORY.GAME]: '게임',
  [BOOTH_CATEGORY.GOODS]: '굿즈',
  [BOOTH_CATEGORY.OTHER]: '기타',
}

// Day-of status of an approved / registered booth (separate from the application status above).
export const BOOTH_OPERATING_STATUS = {
  PREPARING: 'PREPARING', // 준비 중
  OPEN: 'OPEN', // 운영 중
  SOLD_OUT: 'SOLD_OUT', // 품절
  CLOSED: 'CLOSED', // 마감
}

export const BOOTH_OPERATING_STATUS_LABEL = {
  [BOOTH_OPERATING_STATUS.PREPARING]: '준비 중',
  [BOOTH_OPERATING_STATUS.OPEN]: '운영 중',
  [BOOTH_OPERATING_STATUS.SOLD_OUT]: '품절',
  [BOOTH_OPERATING_STATUS.CLOSED]: '마감',
}

// Whether visitors can see the booth (the organizer decides; new booths start hidden).
export const BOOTH_VISIBILITY = {
  HIDDEN: 'HIDDEN',
  PUBLIC: 'PUBLIC',
}

export const BOOTH_VISIBILITY_LABEL = {
  [BOOTH_VISIBILITY.HIDDEN]: '비공개',
  [BOOTH_VISIBILITY.PUBLIC]: '방문객에게 공개',
}

// Stock level of one menu item of a booth (set by the booth operator or the organizer).
export const STOCK_LEVEL = {
  UNLIMITED: 'UNLIMITED', // 무제한
  AVAILABLE: 'AVAILABLE', // 충분
  LOW: 'LOW', // 부족
  SOLD_OUT: 'SOLD_OUT', // 품절
}

// Order = display order (legend and dropdowns), most plentiful first.
export const STOCK_LEVEL_LABEL = {
  [STOCK_LEVEL.UNLIMITED]: '무제한',
  [STOCK_LEVEL.AVAILABLE]: '충분',
  [STOCK_LEVEL.LOW]: '부족',
  [STOCK_LEVEL.SOLD_OUT]: '품절',
}

// A booth's whole stock in one word (the list column). The backend derives it from the items.
export const STOCK_SUMMARY = {
  NOT_TRACKED: 'NOT_TRACKED',
  ...STOCK_LEVEL,
}

export const STOCK_SUMMARY_LABEL = {
  [STOCK_SUMMARY.NOT_TRACKED]: '재고 미등록',
  ...STOCK_LEVEL_LABEL,
}

// Document check of an application (documents are submitted outside the service; the organizer
// only records their state).
export const DOCUMENT_CHECK = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  NEEDS_CORRECTION: 'NEEDS_CORRECTION',
}

export const DOCUMENT_CHECK_LABEL = {
  [DOCUMENT_CHECK.NOT_SUBMITTED]: '미제출',
  [DOCUMENT_CHECK.SUBMITTED]: '제출됨',
  [DOCUMENT_CHECK.VERIFIED]: '확인 완료',
  [DOCUMENT_CHECK.NEEDS_CORRECTION]: '보완 필요',
}

export const BOOTH_NAME_MAX = 100
export const BOOTH_CODE_MAX = 20
