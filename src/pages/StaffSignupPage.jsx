import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import SignupForm from '../components/SignupForm'
import { ONBOARDING_TYPE } from '../constants/auth'

// 스태프 signup form: same fields as the booth operator's.
export default function StaffSignupPage() {
  return (
    <ScreenShell>
      <AuthHeader backTo="/login" />
      <SignupForm type={ONBOARDING_TYPE.STAFF} title="스태프 회원가입" submitLabel="회원가입 완료" />
    </ScreenShell>
  )
}
