// Sample content of the wireframes, shown in ?demo=1 preview mode (see utils/demo.js) and used as
// the starting content of the dummy features that have no backend yet (후원사, 스태프, 통계, ...).
// Shapes follow the view models of the api/*Api.js modules, not the raw backend responses.

export const DEMO_EVENT_ID = 'demo-event'

export const DEMO_EVENT = {
  id: DEMO_EVENT_ID,
  name: '비룡제 2026',
  organizationName: '총학생회',
  startDate: '2026-11-02',
  endDate: '2026-11-04',
  venue: '인하대학교 대운동장',
  intro: '다양한 먹거리와 체험, 굿즈 부스가 함께하는 가을 축제입니다. 행사 지도를 보며 나만의 즐길 거리를 찾아보세요.',
  imageUrl: null,
  hours: { start: '11:00', end: '21:00' },
  phone: '010-0000-0000',
  directions:
    '행사장 입구에서 안내요원의 안내를 따라주세요. 행사장 안에서의 위치는 지도에서 확인할 수 있습니다.',
}

// A floor plan drawn as an SVG so the preview needs no image file.
const planSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="720" viewBox="0 0 900 720">
<rect width="900" height="720" fill="#e9efec"/>
<rect x="250" y="30" width="400" height="80" rx="6" fill="#d3dcd8" stroke="#c4cfca"/>
<text x="450" y="78" font-size="26" text-anchor="middle" fill="#5d716b" font-family="sans-serif">무대</text>
<rect x="150" y="190" width="600" height="190" rx="6" fill="#f7faf9" stroke="#d7e1dd"/>
<rect x="150" y="410" width="600" height="190" rx="6" fill="#f7faf9" stroke="#d7e1dd"/>
<rect x="350" y="620" width="200" height="80" rx="6" fill="#dde5e1" stroke="#c4cfca"/>
<text x="450" y="668" font-size="24" text-anchor="middle" fill="#5d716b" font-family="sans-serif">입구</text>
</svg>`

export const DEMO_MAP_IMAGE = {
  url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(planSvg)}`,
  widthPx: 900,
  heightPx: 720,
}

const items = (list) =>
  list.map(([name, priceKrw, stockStatus], i) => ({
    id: `demo-item-${name}`,
    name,
    priceKrw,
    stockStatus,
    sortOrder: i,
  }))

const booth = (n, name, categoryCode, operationStatus, intro, itemList, xRatio, yRatio) => ({
  id: `demo-booth-${n}`,
  code: String(n),
  name,
  categoryCode,
  operationStatus,
  intro,
  hours: { start: '11:00', end: '21:00' },
  imageUrl: null,
  snsUrl: 'https://example.com',
  items: items(itemList),
  placement: { pinId: `demo-pin-${n}`, xRatio, yRatio },
})

export const DEMO_BOOTHS = [
  booth(1, '달빛 떡볶이', 'FOOD', 'OPEN', '매콤달콤한 떡볶이와 따뜻한 어묵을 판매합니다.', [['떡볶이', 5000, 'AVAILABLE'], ['어묵', 3000, 'LOW'], ['음료', 2000, 'SOLD_OUT']], 0.27, 0.34),
  booth(2, '오늘의 커피', 'BEVERAGE', 'OPEN', '직접 내린 핸드드립 커피와 시원한 음료를 판매합니다.', [['아메리카노', 3000, 'AVAILABLE'], ['라떼', 3500, 'AVAILABLE']], 0.42, 0.34),
  booth(3, '캠퍼스 포토', 'EXPERIENCE', 'PREPARING', '축제의 순간을 인생네컷으로 남겨보세요.', [['포토 촬영', 4000, 'UNLIMITED']], 0.57, 0.34),
  booth(4, '행운상점', 'GOODS', 'CLOSED', '뽑기와 소품을 판매하는 행운 가득한 상점입니다.', [['뽑기', 1000, 'SOLD_OUT']], 0.72, 0.34),
  booth(5, '작은 공방', 'EXPERIENCE', 'OPEN', '나만의 키링을 만드는 체험 부스입니다.', [['키링 만들기', 6000, 'AVAILABLE']], 0.27, 0.66),
  booth(6, '여름 레몬', 'BEVERAGE', 'OPEN', '상큼한 레몬 에이드를 판매합니다.', [['레몬 에이드', 3500, 'AVAILABLE'], ['자몽 에이드', 3500, 'LOW']], 0.42, 0.66),
  booth(7, '인하 굿즈', 'GOODS', 'PREPARING', '학교 굿즈와 문구를 판매합니다.', [['에코백', 8000, 'AVAILABLE']], 0.57, 0.66),
  booth(8, '동아리 홍보관', 'OTHER', 'CLOSED', '동아리 활동을 소개하고 신입 부원을 모집합니다.', [], 0.72, 0.66),
]

export const DEMO_FACILITY_PINS = [
  { id: 'demo-pin-wc', pinType: 'TOILET', label: '화장실', xRatio: 0.1, yRatio: 0.2 },
  { id: 'demo-pin-med', pinType: 'MEDICAL', label: '의무실', xRatio: 0.9, yRatio: 0.2 },
  { id: 'demo-pin-info', pinType: 'INFO', label: '안내소', xRatio: 0.1, yRatio: 0.8 },
  { id: 'demo-pin-etc', pinType: 'OTHER_FACILITY', label: '기타 시설', xRatio: 0.9, yRatio: 0.8 },
]

export const DEMO_NOTICES = [
  {
    id: 'demo-notice-1',
    title: '강풍 예보에 따른 행사 운영 안내',
    body: '현재 강한 바람이 예보되어 있습니다. 행사장에서는 현장 안내요원의 안내를 따라주세요.\n\n현장 상황에 따라 일부 부스의 운영이 일시 변경될 수 있습니다. 부스와 지도에서 운영 상태를 확인해 주세요.\n\n상황이 변경되면 이 공지를 통해 다시 안내하겠습니다.',
    urgent: true,
    audiences: ['PUBLIC', 'OPERATORS', 'STAFF'],
    author: '총학생회',
    publishedAt: '2026-11-02T14:20:00+09:00',
    attachment: '행사장 이용 안내.pdf',
  },
  {
    id: 'demo-notice-2',
    title: '부스 운영 종료 시간 안내',
    body: '부스 운영 종료 시간은 오후 9시입니다. 정리 시간을 포함해 9시 30분까지 철수를 마쳐 주세요.',
    urgent: false,
    audiences: ['OPERATORS', 'STAFF'],
    author: '총학생회',
    publishedAt: '2026-11-02T11:40:00+09:00',
    attachment: null,
  },
  {
    id: 'demo-notice-3',
    title: '메인 무대 공연 일정 변경',
    body: '메인 무대 공연 일정이 일부 변경되었습니다. 변경된 시간표는 무대 앞 안내판에서 확인할 수 있습니다.',
    urgent: false,
    audiences: ['PUBLIC'],
    author: '총학생회',
    publishedAt: '2026-11-02T12:30:00+09:00',
    attachment: null,
  },
  {
    id: 'demo-notice-4',
    title: '행사장 안전 수칙 안내',
    body: '행사장에서는 지정된 통로로 이동해 주세요. 위험 상황이 생기면 가까운 안내요원에게 알려 주세요.',
    urgent: false,
    audiences: ['PUBLIC', 'OPERATORS', 'STAFF'],
    author: '총학생회',
    publishedAt: '2026-11-01T18:00:00+09:00',
    attachment: null,
  },
  {
    id: 'demo-notice-5',
    title: '분리수거함 위치 안내',
    body: '분리수거함은 행사장 곳곳과 입구 옆에 마련되어 있습니다. 깨끗한 행사장을 함께 만들어 주세요.',
    urgent: false,
    audiences: ['PUBLIC'],
    author: '총학생회',
    publishedAt: '2026-11-01T10:00:00+09:00',
    attachment: null,
  },
]

// 후원사: there is no backend for them yet (docs/BACKEND_REQUESTS.md).
export const DEMO_SPONSORS = [
  { id: 'sp-a', name: '후원사 A', main: true, description: '현장 혜택은 후원사 안내를 확인해 주세요.', url: 'https://example.com' },
  { id: 'sp-b', name: '후원사 B', main: false, description: '행사 운영을 함께합니다.', url: 'https://example.com' },
  { id: 'sp-c', name: '후원사 C', main: false, description: '행사 운영을 함께합니다.', url: 'https://example.com' },
]

export const DEMO_AD = {
  sponsor: '후원사 A',
  title: '행사장에서 만나는 특별한 혜택',
  linkLabel: '현장 혜택 확인하기',
  url: 'https://example.com',
}

// ---- booth operator ----

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString()

// Events that are recruiting booths (public list + each one's recruitment notice).
export const DEMO_RECRUITING = [
  {
    event: { ...DEMO_EVENT, id: 'demo-event' },
    recruitment: {
      closesAt: inDays(2),
      targetBoothCount: 30,
      participationFeeKrw: 150000,
      feeNote: '납부 방식과 시기는 승인된 운영자에게 별도 안내',
      allowedCategoryCodes: ['FOOD', 'BEVERAGE', 'EXPERIENCE', 'GOODS'],
      introduction: '먹거리와 체험, 다양한 굿즈가 함께하는 비룡제입니다. 방문객에게 즐거운 경험을 전할 부스를 모집합니다.',
      documentRequirements: [
        { id: 'doc-1', name: '운영계획서', isRequired: true, applicableCategoryCodes: [] },
        { id: 'doc-2', name: '보건증 (음식·음료 부스 필수)', isRequired: true, applicableCategoryCodes: ['FOOD', 'BEVERAGE'] },
      ],
    },
  },
  {
    event: {
      id: 'demo-event-2',
      name: '인천 로컬마켓',
      organizationName: '인천 로컬마켓 운영단',
      startDate: '2026-11-07',
      endDate: '2026-11-08',
      venue: '인천 송도 센트럴파크',
      intro: '지역 소상공인과 함께하는 주말 마켓입니다.',
      imageUrl: null,
    },
    recruitment: {
      closesAt: inDays(7),
      targetBoothCount: 20,
      participationFeeKrw: 80000,
      feeNote: '',
      allowedCategoryCodes: ['FOOD', 'BEVERAGE', 'GOODS'],
      introduction: '지역의 맛과 멋을 전할 셀러를 모집합니다.',
      documentRequirements: [{ id: 'doc-3', name: '사업자등록증', isRequired: false, applicableCategoryCodes: [] }],
    },
  },
  {
    event: {
      id: 'demo-event-3',
      name: '가을 청년 페스타',
      organizationName: '청년 문화 협동조합',
      startDate: '2026-11-14',
      endDate: '2026-11-15',
      venue: '인천 문화예술회관 광장',
      intro: '청년 창작자들의 가을 축제입니다.',
      imageUrl: null,
    },
    recruitment: {
      closesAt: inDays(12),
      targetBoothCount: 40,
      participationFeeKrw: 100000,
      feeNote: '',
      allowedCategoryCodes: ['FOOD', 'EXPERIENCE', 'GOODS', 'GAME'],
      introduction: '청년 창작자와 함께할 부스를 모집합니다.',
      documentRequirements: [],
    },
  },
]

export const DEMO_PROFILES = [
  { id: 'demo-profile-1', name: '달빛 떡볶이', categoryCode: 'FOOD', introduction: '매콤달콤한 떡볶이와 따뜻한 어묵을 판매합니다.', revision: 0 },
]

export const DEMO_MY_APPLICATIONS = [
  {
    applicationId: 'demo-app-1',
    eventId: 'demo-event',
    eventName: '비룡제 2026',
    boothName: '달빛 떡볶이',
    categoryCode: 'FOOD',
    reviewStatus: 'APPROVED',
    submittedAt: '2026-10-26T10:00:00+09:00',
    rejectionReason: null,
    eventBoothId: 'demo-booth-1',
    boothCode: '1',
  },
]

// The operator's own booth (the first of the sample booths) with the event it belongs to.
export const DEMO_MY_BOOTH = {
  eventBoothId: 'demo-booth-1',
  revision: 0,
  event: DEMO_EVENT,
}

export const DEMO_PAYMENTS = [
  { id: 'pay-1', eventName: '비룡제 2026', label: '입점비 · 수수료', amountKrw: 157500, status: '결제 완료', paidAt: '2026-10-26' },
]
