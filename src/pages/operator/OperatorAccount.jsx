import { useNavigate, useOutletContext } from 'react-router-dom'
import MIcon from '../../components/mobile/MobileIcons'
import './operator.css'

// 계정 정보 · 부스 운영자 (read-only: the backend has no API to change the account yet)
export default function OperatorAccount() {
  const navigate = useNavigate()
  const { user } = useOutletContext()
  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate('/operator/profile')}>
        <MIcon name="back" size={18} />
        프로필
      </button>
      <h1 className="mb-title is-sm">계정 정보</h1>
      <p className="mb-sub">가입할 때 입력한 정보예요.</p>
      <div className="mb-card">
        <dl className="mb-kv">
          <dt>이름</dt>
          <dd>{user.nickname}</dd>
          <dt>연락처</dt>
          <dd>{user.phoneNumber || '-'}</dd>
          <dt>이메일</dt>
          <dd>{user.email || '-'}</dd>
        </dl>
      </div>
      <p className="op-note">※ 계정 정보 수정은 아직 지원하지 않아요. (준비 중)</p>
    </>
  )
}
