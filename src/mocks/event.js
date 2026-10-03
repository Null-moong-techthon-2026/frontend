// MOCK DATA — the event (festival) this organizer is running. Replace with the fetched Event
// when the backend exists (see BACKEND_INTEGRATION.md). Used by the sidebar and the dashboard.

export const MOCK_EVENT = {
  name: '비룡제 2026',
  startDate: '2026-09-22',
  endDate: '2026-09-24',
  venue: '인하대학교 대운동장',
  imageUrl: null, // cover image; null shows the placeholder illustration
  intro: '인하대학교 구성원이 함께하는 가을 축제.\n다양한 먹거리와 체험 부스를 만나보세요.',
  recruitDeadline: '2026-09-24T18:00',
  recruitTarget: 20, // 모집 부스 수 (teams)
  inviteCode: 'BRY-2026-8K2M',
  inviteUrl: 'https://boothluck.kr/invite/BRY-2026-8K2M',
  visitorUrl: 'https://boothluck.kr/e/biryong2026',
}
