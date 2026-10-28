import { useState } from 'react'
import OrganizerLayout from '../components/OrganizerLayout'
import { useEvent } from '../context/useEvent'
import { STATS_RANGES, clickRate, statsFor } from '../dummy/statsData'
import './stats.css'

const n = (value) => value.toLocaleString('ko-KR')
const pct = (value) => `${value.toFixed(2)}%`

// Downloads the numbers on screen as a CSV that Excel opens (UTF-8 with a byte-order mark).
function downloadCsv(filename, rows) {
  const text = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 통계 · 주최자 (example data: there is no backend for it yet, see dummy/statsData.js)
export default function OrganizerStatsPage() {
  const { event } = useEvent()
  const [range, setRange] = useState('all')
  const [hover, setHover] = useState(null) // the hour whose bar the pointer is on
  const stats = statsFor(range)
  const label = STATS_RANGES.find((r) => r.key === range).label

  const peak = stats.hourly.reduce((best, cur) => (cur[1] > best[1] ? cur : best))
  const maxHourly = Math.max(...stats.hourly.map((h) => h[1]))
  const axisMax = Math.max(500, Math.ceil(maxHourly / 500) * 500)
  const ticks = [0, 1, 2, 3, 4].map((i) => (axisMax / 4) * i)
  const maxBooth = Math.max(...stats.topBooths.map((b) => b[1]))
  const totalRate = clickRate(stats.clicks, stats.impressions)

  const exportCsv = () =>
    downloadCsv(`통계_${event.name}_${label}.csv`, [
      ['구분', '항목', '값'],
      ['요약', '웹 조회 수', stats.webViews],
      ['요약', '부스 상세 조회 수', stats.boothViews],
      ['요약', '광고 노출 수', stats.impressions],
      ['요약', '광고 클릭 수', stats.clicks],
      ...stats.hourly.map(([hour, views]) => ['시간대별 웹 조회', `${hour}시`, views]),
      ...stats.topBooths.map(([name, views]) => ['부스 상세 조회 TOP 5', name, views]),
      ...stats.sponsors.map((s) => ['후원사 성과', `${s.name} (${s.place})`, `노출 ${s.impressions} / 클릭 ${s.clicks} / 클릭률 ${pct(clickRate(s.clicks, s.impressions))}`]),
    ])

  return (
    <OrganizerLayout
      active="stats"
      crumb="통계"
      title={
        <>
          통계 <span className="st-badge">예시 데이터</span>
        </>
      }
      subtitle="행사 웹 이용과 부스 관심도, 후원 성과를 확인하세요."
      actions={
        <>
          <select className="st-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="기간">
            {STATS_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <button type="button" className="om-btn om-btn-primary" onClick={exportCsv}>
            엑셀 다운로드
          </button>
        </>
      }
    >
      <div className="st">
        <div className="st-kpis">
          <Kpi label="웹 조회 수" value={n(stats.webViews)} />
          <Kpi label="부스 상세 조회 수" value={n(stats.boothViews)} />
          <Kpi label="광고 노출 수" value={n(stats.impressions)} />
          <Kpi label="광고 클릭 수" value={n(stats.clicks)} accent />
        </div>

        <div className="st-row">
          <section className="st-card">
            <div className="st-head">
              <h2>시간대별 웹 조회</h2>
              <span className="st-peak">최다 이용 {peak[0]}시</span>
            </div>
            <div className="st-chart" role="img" aria-label={`시간대별 웹 조회 수. 최다 이용 ${peak[0]}시 ${n(peak[1])}회`}>
              <div className="st-axis">
                {[...ticks].reverse().map((t) => (
                  <span key={t}>{n(t)}</span>
                ))}
              </div>
              <div className="st-plot">
                {ticks.map((t) => (
                  <i key={t} className="st-grid" style={{ bottom: `${(t / axisMax) * 100}%` }} />
                ))}
                <div className="st-bars" onMouseLeave={() => setHover(null)}>
                  {stats.hourly.map(([hour, views]) => (
                    <div key={hour} className="st-col" onMouseEnter={() => setHover(hour)}>
                      <span className="st-value">{n(views)}</span>
                      <b className={hour === peak[0] ? 'is-peak' : ''} style={{ height: `${(views / axisMax) * 100}%` }} />
                      {hover === hour && (
                        <span className="st-tip" role="status">
                          {hour}시 · 웹 조회 {n(views)}회
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="st-hours">
                {stats.hourly.map(([hour]) => (
                  <span key={hour}>{hour}시</span>
                ))}
              </div>
            </div>
          </section>

          <section className="st-card">
            <h2>부스 상세 조회 TOP 5</h2>
            <p className="st-sub">선택 기간의 부스 상세 화면 조회 기준</p>
            <ol className="st-top">
              {stats.topBooths.map(([name, views], i) => (
                <li key={name}>
                  <span className={`st-rank${i === 0 ? ' is-first' : ''}`}>{i + 1}</span>
                  <span className="st-top-body">
                    <strong>{name}</strong>
                    <i>
                      <b style={{ width: `${(views / maxBooth) * 100}%` }} />
                    </i>
                  </span>
                  <em>{n(views)}회</em>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="st-card">
          <div className="st-head">
            <h2>후원사 성과</h2>
            <span className="st-total">전체 클릭률 {pct(totalRate)}</span>
          </div>
          <table className="st-table">
            <thead>
              <tr>
                <th>후원사</th>
                <th>노출 위치</th>
                <th>노출 수</th>
                <th>클릭 수</th>
                <th>클릭률</th>
              </tr>
            </thead>
            <tbody>
              {stats.sponsors.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.place}</td>
                  <td>{n(s.impressions)}</td>
                  <td>{n(s.clicks)}</td>
                  <td>{pct(clickRate(s.clicks, s.impressions))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>합계</td>
                <td>전체 노출 위치</td>
                <td>{n(stats.impressions)}</td>
                <td>{n(stats.clicks)}</td>
                <td>{pct(totalRate)}</td>
              </tr>
            </tfoot>
          </table>
          <small className="st-note">클릭률 = 클릭 수 ÷ 노출 수 × 100</small>
        </section>
      </div>
    </OrganizerLayout>
  )
}

function Kpi({ label, value, accent }) {
  return (
    <div className="st-kpi">
      <span>{label}</span>
      <strong className={accent ? 'is-accent' : ''}>{value}</strong>
    </div>
  )
}
