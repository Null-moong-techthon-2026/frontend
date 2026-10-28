// 통계 (statistics) sample data. There is NO backend for it yet (docs/BACKEND_REQUESTS.md): the
// screen is labelled "예시 데이터". Numbers are for the whole event; a single day is a share of them.

export const STATS_RANGES = [
  { key: 'all', label: '2026.11.02 – 11.04', share: 1 },
  { key: 'd1', label: '2026.11.02 (월)', share: 0.4 },
  { key: 'd2', label: '2026.11.03 (화)', share: 0.35 },
  { key: 'd3', label: '2026.11.04 (수)', share: 0.25 },
]

export const HOURLY_VIEWS = [
  [11, 640],
  [12, 920],
  [13, 1180],
  [14, 1450],
  [15, 1640],
  [16, 1960],
  [17, 1740],
  [18, 1360],
  [19, 960],
  [20, 630],
]

export const TOP_BOOTHS = [
  ['달빛 떡볶이', 1490],
  ['오늘의 커피', 1230],
  ['캠퍼스 포토', 860],
  ['행운상점', 740],
  ['작은 공방', 540],
]

export const SPONSOR_PERFORMANCE = [
  { name: '후원사 A', place: '홈 광고 배너', impressions: 12000, clicks: 420 },
  { name: '후원사 B', place: '홈 후원 로고', impressions: 3000, clicks: 90 },
  { name: '후원사 C', place: '스폰서 목록', impressions: 3000, clicks: 30 },
]

export const WEB_VIEWS_TOTAL = 12480
export const BOOTH_VIEWS_TOTAL = 4860

// The numbers of one range (counts scale with its share of the event).
export function statsFor(rangeKey) {
  const share = (STATS_RANGES.find((r) => r.key === rangeKey) ?? STATS_RANGES[0]).share
  const scale = (n) => Math.round(n * share)
  const sponsors = SPONSOR_PERFORMANCE.map((s) => ({ ...s, impressions: scale(s.impressions), clicks: scale(s.clicks) }))
  const impressions = sponsors.reduce((sum, s) => sum + s.impressions, 0)
  const clicks = sponsors.reduce((sum, s) => sum + s.clicks, 0)
  return {
    webViews: scale(WEB_VIEWS_TOTAL),
    boothViews: scale(BOOTH_VIEWS_TOTAL),
    impressions,
    clicks,
    hourly: HOURLY_VIEWS.map(([hour, views]) => [hour, scale(views)]),
    topBooths: TOP_BOOTHS.map(([name, views]) => [name, scale(views)]),
    sponsors,
  }
}

export const clickRate = (clicks, impressions) => (impressions ? (clicks / impressions) * 100 : 0)
