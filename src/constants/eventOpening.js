// 행사 개설 (opening an event): the kinds of organization the form offers.
// The values are what the backend stores as `orgType`.

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
