// MOCK DATA — placeholder notices. Delete when the real data comes from the backend;
// the shape is the Notice model (see BACKEND_INTEGRATION.md).

import { NOTICE_AUDIENCE as A, NOTICE_STATUS as S } from '../constants/notice'

// Timestamps are local ISO strings: YYYY-MM-DDTHH:mm
export const MOCK_NOTICES = [
  {
    id: 1,
    title: '기상 악화에 따른 운영 안내',
    body: '현재 강한 바람이 예보되어 있습니다. 부스 운영자는 구조물을 점검하고 방문객은 현장 안내를 따라주세요.\n\n상황이 변경되면 이 공지를 통해 다시 안내하겠습니다.',
    attachments: [],
    audiences: [A.STAFF, A.BOOTH, A.VISITOR],
    urgent: true,
    status: S.PUBLISHED,
    publishedAt: '2026-09-23T14:20',
    updatedAt: '2026-09-23T14:20',
  },
  {
    id: 2,
    title: '부스 운영 종료 시간 안내',
    body: '오늘 부스 운영은 21시에 종료됩니다. 정리 및 철수는 22시까지 완료해 주세요.',
    attachments: [],
    audiences: [A.STAFF, A.BOOTH],
    urgent: false,
    status: S.PUBLISHED,
    publishedAt: '2026-09-23T11:40',
    updatedAt: '2026-09-23T11:40',
  },
  {
    id: 3,
    title: '메인 무대 공연 일정 변경',
    body: '메인 무대 공연이 18시에서 19시로 변경되었습니다. 이용에 참고해 주세요.',
    attachments: [],
    audiences: [A.VISITOR],
    urgent: false,
    status: S.CLOSED,
    publishedAt: '2026-09-22T18:05',
    updatedAt: '2026-09-23T09:00',
  },
  {
    id: 4,
    title: '행사장 안전 수칙 안내',
    body: '행사장 내에서는 지정된 통로로만 이동하고, 비상구 앞에는 물건을 두지 말아 주세요.',
    attachments: [],
    audiences: [A.STAFF, A.BOOTH, A.VISITOR],
    urgent: false,
    status: S.PUBLISHED,
    publishedAt: '2026-09-22T09:00',
    updatedAt: '2026-09-22T09:00',
  },
  {
    id: 5,
    title: '부스 입장 동선 공지',
    body: '부스 운영자는 동문 게이트로 입장해 주세요. 차량 진입은 오전 9시 이전까지만 가능합니다.',
    attachments: [],
    audiences: [A.BOOTH],
    urgent: false,
    status: S.DRAFT,
    publishedAt: null,
    updatedAt: '2026-09-21T16:30',
  },
]
