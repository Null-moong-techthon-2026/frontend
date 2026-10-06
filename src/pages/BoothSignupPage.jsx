import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import SignupForm from '../components/SignupForm'
import { ONBOARDING_TYPE } from '../constants/auth'

// Screen 5 — 부스 운영자 (booth operator) signup form.
export default function BoothSignupPage() {
  return (
    <ScreenShell>
      <AuthHeader backTo="/login" />
      <SignupForm
        type={ONBOARDING_TYPE.OPERATOR}
        title="부스 운영자 회원가입"
        submitLabel="회원가입 완료"
      />
    </ScreenShell>
  )
}
