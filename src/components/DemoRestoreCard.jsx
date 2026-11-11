import { useState } from 'react'
import { restoreDemo } from '../utils/demoRestore'

// Dashboard card for the demo event only: 시연 초기화 (see utils/demoRestore.js for what it can and cannot undo).
export default function DemoRestoreCard({ eventId }) {
  const [phase, setPhase] = useState('idle') // idle | ask | running | done
  const [current, setCurrent] = useState('')
  const [report, setReport] = useState([])

  const run = async () => {
    setPhase('running')
    setReport(await restoreDemo(eventId, setCurrent))
    setPhase('done')
  }

  return (
    <section className="db-card db-demo">
      <h3>시연 초기화</h3>
      <p>
        시연 중에 추가한 공지·업무·근무표·메뉴를 지우고, 바꾼 부스 상태·재고·스태프 정보를 처음 값으로 되돌려요.
        <br />
        승인한 부스 신청, 출퇴근 기록, 이미 시작한 근무표는 되돌릴 수 없어요. 지도 핀과 이미지는 처음 상태로 다시 게시해요.
      </p>
      {phase === 'idle' && (
        <button type="button" className="om-btn om-btn-outline" onClick={() => setPhase('ask')}>
          처음 상태로 되돌리기
        </button>
      )}
      {phase === 'ask' && (
        <div className="db-demo-ask">
          <strong>정말 되돌릴까요?</strong>
          <button type="button" className="om-btn om-btn-outline" onClick={() => setPhase('idle')}>
            취소
          </button>
          <button type="button" className="om-btn om-btn-primary" onClick={run}>
            되돌리기
          </button>
        </div>
      )}
      {phase === 'running' && <p>되돌리는 중… {current}</p>}
      {phase === 'done' && (
        <>
          <ul className="db-demo-report">
            {report.map((r) => (
              <li key={r.label} className={r.ok ? '' : 'is-fail'}>
                {r.ok ? '✓' : '✕'} {r.label} {r.note && `· ${r.note}`}
              </li>
            ))}
          </ul>
          <button type="button" className="om-btn om-btn-primary" onClick={() => window.location.reload()}>
            화면 새로고침
          </button>
        </>
      )}
    </section>
  )
}
