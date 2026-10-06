// Booth recruitment (부스 모집) constants.
//
// The status is NOT stored: it is derived from `published` and the deadline (utils/recruit.js).
export const RECRUIT_STATUS = {
  OPEN: 'open', // 모집 중: published and before the deadline
  CLOSED: 'closed', // 모집 마감: published but the deadline has passed
  PRIVATE: 'private', // 비공개: not published (operators cannot see it)
}

export const RECRUIT_STATUS_LABEL = {
  [RECRUIT_STATUS.OPEN]: '모집 중',
  [RECRUIT_STATUS.CLOSED]: '모집 마감',
  [RECRUIT_STATUS.PRIVATE]: '비공개',
}

// Input limits (shown in the form; the backend should enforce the same).
export const RECRUIT_INTRO_MAX = 300
export const RECRUIT_FEE_MAX = 60
export const RECRUIT_CONTACT_MAX = 80
export const RECRUIT_DOC_LABEL_MAX = 30
export const RECRUIT_DOC_MAX = 10 // required-document rows, defaults included
export const RECRUIT_TARGET_MAX = 999

export const RECRUIT_FEE_NOTE = '납부 방식과 시기는 승인된 운영자에게 별도 안내'
