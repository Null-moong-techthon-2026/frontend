import OrganizerLayout from '../components/OrganizerLayout'
import './stats.css'

// 통계 · 주최자. There is no statistics backend yet (docs/BACKEND_REQUESTS.md), so the screen shows its
// layout without numbers instead of made-up ones.
const EMPTY = '아직 집계된 데이터가 없어요.'

export default function OrganizerStatsPage() {
  return (
    <OrganizerLayout
      active="stats"
      crumb="통계"
      title={
        <>
          통계 <span className="st-badge">준비 중</span>
        </>
      }
      subtitle="행사 웹 이용과 부스 관심도, 후원 성과를 확인하세요."
    >
      <div className="st">
        <div className="st-kpis">
          <Kpi label="웹 조회 수" />
          <Kpi label="부스 상세 조회 수" />
          <Kpi label="광고 노출 수" />
          <Kpi label="광고 클릭 수" accent />
        </div>

        <div className="st-row">
          <section className="st-card">
            <div className="st-head">
              <h2>시간대별 웹 조회</h2>
            </div>
            <p className="st-sub">{EMPTY}</p>
          </section>

          <section className="st-card">
            <h2>부스 상세 조회 TOP 5</h2>
            <p className="st-sub">{EMPTY}</p>
          </section>
        </div>

        <section className="st-card">
          <div className="st-head">
            <h2>후원사 성과</h2>
          </div>
          <p className="st-sub">{EMPTY}</p>
        </section>
      </div>
    </OrganizerLayout>
  )
}

function Kpi({ label, accent }) {
  return (
    <div className="st-kpi">
      <span>{label}</span>
      <strong className={accent ? 'is-accent' : ''}>-</strong>
    </div>
  )
}
