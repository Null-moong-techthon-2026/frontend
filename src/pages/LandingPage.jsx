import { useNavigate } from 'react-router-dom'
import ScreenShell from '../components/ScreenShell'
import boothLogo from '../assets/booth-logo.png'

// Screen 1 — entry screen. Lets the user skip straight in (시작하기)
// or head to the login/signup flow.
export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <ScreenShell className="landing-card">
      <div className="landing-top">
        <p className="landing-logo">
          부스<span className="landing-logo-accent">럭</span>
        </p>
        <p className="landing-tagline">
          즐거운 축제 준비,
          <br />
          부스럭과 함께해요!
        </p>
      </div>

      <div className="landing-hero">
        <div className="landing-hero-art">
          <img src={boothLogo} alt="부스럭 로고" className="landing-hero-icon" />
          <span className="hero-sparkle hero-sparkle-1" aria-hidden="true">
            ✦
          </span>
          <span className="hero-sparkle hero-sparkle-2" aria-hidden="true">
            ✦
          </span>
          <span className="hero-sparkle hero-sparkle-3" aria-hidden="true" />
        </div>
      </div>

      <div className="landing-actions">
        <p className="landing-tooltip">가입·로그인 없이 바로 이용해요!</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
          시작하기
        </button>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/login')}>
          로그인 / 회원가입
        </button>
      </div>
    </ScreenShell>
  )
}
