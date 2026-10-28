// 행사 개설 신청 (event-opening application). Option lists follow the product spec; labels are the
// Korean text shown to the user, values are what is stored.
//
// The applications themselves live in the backend (api/eventApplicationApi.js).

export const ORG_TYPE = {
  COMPANY: 'COMPANY',
  STUDENT: 'STUDENT',
  PUBLIC: 'PUBLIC',
  NONPROFIT: 'NONPROFIT',
  OTHER: 'OTHER',
}

export const ORG_TYPE_LABEL = {
  [ORG_TYPE.COMPANY]: '기업 · 개인사업자',
  [ORG_TYPE.STUDENT]: '학생회 · 동아리',
  [ORG_TYPE.PUBLIC]: '공공기관',
  [ORG_TYPE.NONPROFIT]: '비영리단체',
  [ORG_TYPE.OTHER]: '기타',
}

// Which extra field an organization type must fill in.
export const NEEDS_BUSINESS_NUMBER = [ORG_TYPE.COMPANY]
export const NEEDS_AFFILIATION = [ORG_TYPE.STUDENT, ORG_TYPE.PUBLIC]

export const EVENT_KIND = {
  UNIVERSITY: 'UNIVERSITY',
  FLEA: 'FLEA',
  POPUP: 'POPUP',
  EXPO: 'EXPO',
  LOCAL: 'LOCAL',
  OTHER: 'OTHER',
}

export const EVENT_KIND_LABEL = {
  [EVENT_KIND.UNIVERSITY]: '대학 축제',
  [EVENT_KIND.FLEA]: '플리마켓',
  [EVENT_KIND.POPUP]: '팝업',
  [EVENT_KIND.EXPO]: '박람회',
  [EVENT_KIND.LOCAL]: '지역 축제',
  [EVENT_KIND.OTHER]: '기타',
}

export const PAYMENT_PLAN = {
  PREPAID: 'PREPAID', // A. 일괄 선결제
  BASE_PLUS_SLOT: 'BASE_PLUS_SLOT', // B. 서비스 기본 사용료 + 부스 슬롯 추가
}

export const PAYMENT_PLAN_INFO = {
  [PAYMENT_PLAN.PREPAID]: {
    title: 'A. 일괄 선결제',
    text: '예상 부스 수에 맞춰 이용료를 한 번에 결제해요.',
  },
  [PAYMENT_PLAN.BASE_PLUS_SLOT]: {
    title: 'B. 서비스 기본 사용료 + 부스 슬롯 추가',
    text: '기본 사용료를 먼저 내고, 부스가 늘어날 때 슬롯을 추가해요.',
  },
}

export const PAYMENT_METHOD = {
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  OTHER: 'OTHER',
}

export const PAYMENT_METHOD_LABEL = {
  [PAYMENT_METHOD.CARD]: '카드',
  [PAYMENT_METHOD.TRANSFER]: '무통장 입금',
  [PAYMENT_METHOD.OTHER]: '기타',
}

export const RECEIPT_TYPE = {
  TAX_INVOICE: 'TAX_INVOICE',
  CASH_RECEIPT: 'CASH_RECEIPT',
  NONE: 'NONE',
}

export const RECEIPT_TYPE_LABEL = {
  [RECEIPT_TYPE.TAX_INVOICE]: '세금계산서',
  [RECEIPT_TYPE.CASH_RECEIPT]: '현금영수증',
  [RECEIPT_TYPE.NONE]: '필요 없음',
}

// The five agreements, in the order of the spec. The full texts are not written yet.
export const AGREEMENTS = [
  { key: 'terms', label: '이용약관에 동의합니다.' },
  { key: 'privacy', label: '개인정보 수집·이용에 동의합니다.' },
  { key: 'outsourcing', label: '개인정보 처리위탁에 동의합니다.' },
  { key: 'billing', label: '과금 기준에 동의합니다. (부스 수수료를 제때 납부하지 않으면 불이익이 있을 수 있어요.)' },
  { key: 'refund', label: '환불 규정에 동의합니다.' },
]

// Review state of an application.
export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

export const APPLICATION_STATUS_LABEL = {
  [APPLICATION_STATUS.PENDING]: '검토 중',
  [APPLICATION_STATUS.APPROVED]: '승인',
  [APPLICATION_STATUS.REJECTED]: '반려',
}
