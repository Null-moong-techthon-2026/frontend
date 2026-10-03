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
