// MOCK DATA — the booth-recruitment announcement. Replace with the fetched Recruitment when the
// backend exists (see BACKEND_INTEGRATION.md). The deadline and target count live on the Event
// (event.recruitDeadline / event.recruitTarget) because the dashboard shows them too.

import { BOOTH_CATEGORY as C } from '../constants/booth'

export const MOCK_RECRUIT = {
  published: true, // visible to booth operators
  intro:
    '비룡제 2026에서 함께할 부스를 모집합니다. 먹거리와 체험, 굿즈 부스가 어우러지는 축제를 함께 만들어 주세요.',
  imageUrl: null,
  categories: [C.FOOD, C.DRINK, C.EXPERIENCE, C.GOODS], // which booth categories may apply
  feeInfo: '50,000원 / 부스',
  // `required` = applicants must submit it (the checkbox on the form).
  documents: [
    { id: 'plan', label: '운영계획서', required: true },
    { id: 'health', label: '보건증(식음료)', required: true },
  ],
  contact: '',
}
