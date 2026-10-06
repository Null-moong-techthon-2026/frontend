import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OrganizerSignupPage from './pages/OrganizerSignupPage'
import BoothSignupPage from './pages/BoothSignupPage'
import PlaceholderPage from './pages/PlaceholderPage'
import OrganizerMapPage from './pages/OrganizerMapPage'
import BoothManagePage from './pages/BoothManagePage'
import DashboardPage from './pages/DashboardPage'
import LivePage from './pages/LivePage'
import RecruitPage from './pages/RecruitPage'
import NoticePage from './pages/NoticePage'
import AuthProvider from './context/AuthProvider'
import RequireAuth from './components/RequireAuth'
import BoothsProvider from './context/BoothsProvider'
import NoticesProvider from './context/NoticesProvider'
import MapProvider from './context/MapProvider'
import RecruitProvider from './context/RecruitProvider'
import EventProvider from './context/EventProvider'
import './App.css'

// 5 auth wireframes + routing between them:
//   /               (1) landing
//   /login          (2) login
//   /signup         (3) login + 회원가입 유형 선택 modal
//   /signup/organizer (4) 축제 주최자 회원가입
//   /signup/booth      (5) 부스 운영자 회원가입
function App() {
  return (
    <EventProvider>
    <AuthProvider>
    <BoothsProvider>
    <NoticesProvider>
    <RecruitProvider>
    <MapProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />
      <Route path="/signup/organizer" element={<OrganizerSignupPage />} />
      <Route path="/signup/booth" element={<BoothSignupPage />} />
      <Route path="/home" element={<PlaceholderPage />} />
      {/* Everything under /organizer needs a logged-in user (RequireAuth sends others to /login). */}
      <Route element={<RequireAuth />}>
        <Route path="/organizer/map" element={<OrganizerMapPage />} />
        <Route path="/organizer/dashboard" element={<DashboardPage />} />
        <Route path="/organizer/booths" element={<BoothManagePage />} />
        <Route path="/organizer/notices" element={<NoticePage />} />
        <Route path="/organizer/recruit" element={<RecruitPage />} />
        <Route path="/organizer/live" element={<LivePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </MapProvider>
    </RecruitProvider>
    </NoticesProvider>
    </BoothsProvider>
    </AuthProvider>
    </EventProvider>
  )
}

export default App
