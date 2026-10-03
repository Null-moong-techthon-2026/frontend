// MOCK DATA — placeholder rows so the UI has something to show. Delete this file when the real
// data comes from the backend; the shape below is the Booth model (see BACKEND_INTEGRATION.md).

import { BOOTH_CATEGORY_LABEL, BOOTH_CATEGORY as C, BOOTH_STATUS as S } from '../constants/booth'

// [name, appliedAt, category, applicant name, status, boothNo]
const ROWS = [
  ['달빛 떡볶이', '2026-09-18', C.FOOD, '김민서', S.PENDING, null],
  ['오늘의 커피', '2026-09-18', C.DRINK, '이도윤', S.APPROVED, 1],
  ['캠퍼스 포토', '2026-09-17', C.EXPERIENCE, '박서연', S.APPROVED, 5],
  ['행운상점', '2026-09-17', C.GOODS, '최지우', S.PENDING, null],
  ['달콤 와플', '2026-09-16', C.FOOD, '정하린', S.REJECTED, null],
  ['작은 공방', '2026-09-16', C.EXPERIENCE, '한유진', S.APPROVED, 6],
  ['여름 레몬', '2026-09-15', C.DRINK, '윤서준', S.PENDING, null],
  ['비룡 닭꼬치', '2026-09-15', C.FOOD, '강지호', S.APPROVED, 2],
  ['별빛 키링', '2026-09-14', C.GOODS, '오세린', S.APPROVED, 8],
  ['레트로 오락실', '2026-09-14', C.EXPERIENCE, '장하준', S.PENDING, null],
  ['보리차 하우스', '2026-09-13', C.DRINK, '임나윤', S.APPROVED, 3],
  ['손뜨개 마켓', '2026-09-13', C.GOODS, '송예진', S.REJECTED, null],
  ['한입 꼬치', '2026-09-12', C.FOOD, '배도현', S.APPROVED, 4],
  ['타로 마녀', '2026-09-12', C.EXPERIENCE, '문서아', S.APPROVED, 7],
  ['모카 로스터스', '2026-09-11', C.DRINK, '조민재', S.PENDING, null],
  ['캐리커처 공방', '2026-09-11', C.EXPERIENCE, '신유나', S.APPROVED, 9],
  ['청춘 에이드', '2026-09-10', C.DRINK, '황지안', S.REJECTED, null],
  ['수제 쿠키 하우스', '2026-09-10', C.FOOD, '노현우', S.APPROVED, 10],
]

export const MOCK_BOOTHS = ROWS.map(([name, appliedAt, category, applicantName, status, boothNo], i) => ({
  id: i + 1,
  name,
  category,
  status,
  appliedAt, // ISO date (YYYY-MM-DD)
  boothNo, // number | null — assigned once the booth is placed on the map
  intro: `${name}에서 간단한 ${BOOTH_CATEGORY_LABEL[category]} 관련 상품을 판매합니다.`,
  applicant: {
    name: applicantName,
    phone: `010-${String(1000 + i * 37).slice(-4)}-${String(2000 + i * 53).slice(-4)}`,
    email: `booth${i + 1}@example.com`,
  },
  documents: [
    { id: `${i + 1}-1`, name: '보건증.pdf', url: null },
    { id: `${i + 1}-2`, name: '운영계획서.pdf', url: null },
  ],
  reviewMemo: '', // organizer-only
  rejectReason: '', // visible to organizer and booth operator
}))
