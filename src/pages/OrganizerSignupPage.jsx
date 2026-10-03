import ScreenShell from '../components/ScreenShell'
import AuthHeader from '../components/AuthHeader'
import FormField from '../components/FormField'

// Screen 4 — 축제 주최자 (festival organizer) signup form.
export default function OrganizerSignupPage() {
  return (
    <ScreenShell>
      <AuthHeader backTo="/login" />

      <div className="auth-body">
        <div className="auth-title">
          <h2>축제 주최자 회원가입</h2>
        </div>

        <div className="auth-fields">
          <FormField label="아이디" placeholder="아이디를 입력해 주세요" action="중복 확인" autoComplete="username" />
          <FormField label="비밀번호" type="password" placeholder="비밀번호를 입력해 주세요" autoComplete="new-password" />
          <FormField
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력해 주세요"
            autoComplete="new-password"
          />
          <FormField label="닉네임" placeholder="닉네임을 입력해 주세요" />
          <FormField label="전화번호" placeholder="010-0000-0000" action="인증 요청" />
          <FormField label="인증번호" placeholder="인증번호를 입력해 주세요" action="인증 확인" />
          <FormField label="이메일 (선택)" type="email" placeholder="example@email.com" autoComplete="email" />
          <FormField label="운영 기관 (선택)" placeholder="예: ○○대학교 총학생회" />
        </div>

        <button type="button" className="btn btn-primary">
          회원가입
        </button>
      </div>
    </ScreenShell>
  )
}
