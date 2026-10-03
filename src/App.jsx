import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OrganizerSignupPage from './pages/OrganizerSignupPage'
import BoothSignupPage from './pages/BoothSignupPage'
import PlaceholderPage from './pages/PlaceholderPage'
import OrganizerMapPage from './pages/OrganizerMapPage'
import BoothManagePage from './pages/BoothManagePage'
import BoothsProvider from './context/BoothsProvider'
import './App.css'

// 5 auth wireframes + routing between them:
//   /               (1) landing
//   /login          (2) login
//   /signup         (3) login + 회원가입 유형 선택 modal
//   /signup/organizer (4) 축제 주최자 회원가입
//   /signup/booth      (5) 부스 운영자 회원가입
function App() {
  return (
    <BoothsProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />
      <Route path="/signup/organizer" element={<OrganizerSignupPage />} />
      <Route path="/signup/booth" element={<BoothSignupPage />} />
      <Route path="/home" element={<PlaceholderPage />} />
      <Route path="/organizer/map" element={<OrganizerMapPage />} />
      <Route path="/organizer/booths" element={<BoothManagePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </BoothsProvider>
  )
}

export default App
