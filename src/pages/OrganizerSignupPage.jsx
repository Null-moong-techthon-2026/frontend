import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import SignupForm from '../components/SignupForm'
import { ONBOARDING_TYPE } from '../constants/auth'

// Screen 4 — 축제 주최자 (festival organizer) signup form.
export default function OrganizerSignupPage() {
  return (
    <ScreenShell>
      <AuthHeader backTo="/login" />
      <SignupForm
        type={ONBOARDING_TYPE.ORGANIZER}
        title="축제 주최자 회원가입"
        submitLabel="회원가입"
        phoneVerification
      />
    </ScreenShell>
  )
}
