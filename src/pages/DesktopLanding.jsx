import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import boothLogo from '../assets/booth-logo.png'
import LandingMockup from '../components/LandingMockup'
import { HOME_PATH } from '../constants/auth'
import { useAuth } from '../context/useAuth'
import './landing.css'

// "행사 개설 신청하기" opens the application form (needs a login; logged-out visitors are sent to the
// login screen first and come back here afterwards).
const APPLY_PATH = '/apply'

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
)

// Three small pictures for the feature cards, made of plain markup.
function VizApprove() {
  return (
    <div className="lp-viz lp-viz-approve" aria-hidden="true">
      <p>
        <span>달빛 떡볶이</span>
        <i className="is-wait">검토 중</i>
      </p>
      <p>
        <span>오늘의 커피</span>
        <i className="is-ok">승인</i>
      </p>
      <p>
        <span>행운상점</span>
        <i className="is-no">반려</i>
      </p>
    </div>
  )
}

function VizMap() {
  return (
    <div className="lp-viz lp-viz-map" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <b key={n} className={n === 8 ? 'is-empty' : ''}>
          {n === 8 ? '' : n}
        </b>
      ))}
    </div>
  )
}

function VizLive() {
  return (
    <div className="lp-viz lp-viz-live" aria-hidden="true">
      <p>
        <span>달빛 떡볶이</span>
        <i className="is-ok">운영 중</i>
      </p>
      <p>
        <span>캠퍼스 포토</span>
        <i className="is-prep">준비 중</i>
      </p>
      <p>
        <span>행운상점</span>
        <i className="is-no">품절</i>
      </p>
    </div>
  )
}

const FEATURES = [
  { no: '01', title: '부스 신청 · 승인', text: '신청 목록과 서류 상태를 한눈에 확인하고, 승인·반려 결과를 한곳에 남겨요.', viz: <VizApprove /> },
  { no: '02', title: '지도 배치', text: '평면도 위에 핀을 놓고 승인된 부스를 바로 배치해 방문객에게 보여 줘요.', viz: <VizMap /> },
  { no: '03', title: '실시간 운영', text: '부스의 운영 상태와 메뉴 재고를 현장에서 바로 확인하고 바꿔요.', viz: <VizLive /> },
]

// Landing page for computers and laptops (the phone-sized one is in LandingPage.jsx).
export default function DesktopLanding() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const apply = () => navigate(APPLY_PATH)
  // The header is see-through over the hero and only gets a background once the page scrolls.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="lp">
      <header className={`lp-header${scrolled ? ' is-scrolled' : ''}`}>
        <button type="button" className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={boothLogo} alt="" />
          <span>부스럭</span>
        </button>
        <nav className="lp-nav" aria-label="주요 메뉴">
          <button type="button" onClick={() => scrollTo('lp-features')}>
            서비스 소개
          </button>
          <button type="button" onClick={apply}>
            행사 개설 신청
          </button>
          {user ? (
            <>
              {user.platformRole === 'ADMIN' && (
                <button type="button" onClick={() => navigate('/admin/applications')}>
                  관리자
                </button>
              )}
              <button type="button" onClick={logout}>
                로그아웃
              </button>
              <button type="button" className="lp-login" onClick={() => navigate(HOME_PATH)}>
                {user.nickname}님 대시보드
              </button>
            </>
          ) : (
            <button type="button" className="lp-login" onClick={() => navigate('/login')}>
              로그인
            </button>
          )}
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-text">
            <span className="lp-pill">
              <i aria-hidden="true" />
              부스 행사 운영 플랫폼
            </span>
            <h1>
              행사 운영의 모든 순간,
              <br />
              <em>부스럭으로</em> <mark>가볍게.</mark>
            </h1>
            <p className="lp-lead">
              부스 신청부터 지도 배치, 당일 운영까지.
              <br />
              흩어진 행사 업무를 한곳에서 관리하세요.
            </p>
            <div className="lp-cta">
              <button type="button" className="lp-btn" onClick={apply}>
                행사 개설 신청하기
                <span className="lp-btn-icon">
                  <Arrow />
                </span>
              </button>
              <button type="button" className="lp-link" onClick={() => scrollTo('lp-features')}>
                서비스 살펴보기
              </button>
            </div>
            <p className="lp-note">신청 내용을 검토한 후, 담당자가 결과를 안내해 드려요.</p>
            <ul className="lp-points">
              <li>부스 신청 · 승인</li>
              <li>지도 배치</li>
              <li>실시간 운영</li>
            </ul>
          </div>
          <div className="lp-hero-visual">
            <LandingMockup />
          </div>
        </section>

        <section className="lp-features" id="lp-features">
          <div className="lp-features-head">
            <span className="lp-eyebrow">서비스 소개</span>
            <h2>
              부스 행사에 필요한 것만,
              <br />
              <em>한곳에.</em>
            </h2>
            <p>신청 접수부터 현장 운영까지, 주최자가 가장 자주 쓰는 일을 하나의 흐름으로 묶었어요.</p>
          </div>
          <div className="lp-cards">
            {FEATURES.map((f) => (
              <article key={f.no}>
                <span className="lp-card-no">{f.no}</span>
                {f.viz}
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-final">
          <div>
            <h2>우리 행사도, 부스럭으로.</h2>
            <p>행사 개설을 신청하면 담당자가 확인하고 안내해 드려요.</p>
          </div>
          <button type="button" className="lp-btn is-dark" onClick={apply}>
            행사 개설 신청하기
            <span className="lp-btn-icon">
              <Arrow />
            </span>
          </button>
        </section>
      </main>

      <footer className="lp-footer">
        <span>부스럭</span>
        <span>부스 신청부터 현장 운영까지, 한곳에서.</span>
      </footer>
    </div>
  )
}
