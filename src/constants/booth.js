// Booth domain constants. The *values* are what the backend sends/receives (stable codes);
// the *labels* are display-only Korean text and never leave the UI.

export const BOOTH_STATUS = {
  PENDING: 'pending', // 검토 중 (no decision yet)
  APPROVED: 'approved', // 승인
  REJECTED: 'rejected', // 반려
}

export const BOOTH_STATUS_LABEL = {
  [BOOTH_STATUS.PENDING]: '검토 중',
  [BOOTH_STATUS.APPROVED]: '승인',
  [BOOTH_STATUS.REJECTED]: '반려',
}

export const BOOTH_CATEGORY = {
  FOOD: 'food',
  DRINK: 'drink',
  EXPERIENCE: 'experience',
  GOODS: 'goods',
}

export const BOOTH_CATEGORY_LABEL = {
  [BOOTH_CATEGORY.FOOD]: '음식',
  [BOOTH_CATEGORY.DRINK]: '음료',
  [BOOTH_CATEGORY.EXPERIENCE]: '체험',
  [BOOTH_CATEGORY.GOODS]: '굿즈',
}

// Day-of status of an APPROVED booth (separate from the application status above).
export const BOOTH_OPERATING_STATUS = {
  PREPARING: 'preparing', // 준비 중
  OPEN: 'open', // 운영 중
  SOLD_OUT: 'soldout', // 품절
  CLOSED: 'closed', // 마감
}

export const BOOTH_OPERATING_STATUS_LABEL = {
  [BOOTH_OPERATING_STATUS.PREPARING]: '준비 중',
  [BOOTH_OPERATING_STATUS.OPEN]: '운영 중',
  [BOOTH_OPERATING_STATUS.SOLD_OUT]: '품절',
  [BOOTH_OPERATING_STATUS.CLOSED]: '마감',
}
