import { useNavigate, useOutletContext } from 'react-router-dom'
import { listBoothProfiles, listMyPayments } from '../../api/operatorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { BOOTH_CATEGORY_LABEL } from '../../constants/booth'
import { useAuth } from '../../context/useAuth'
import { dateRange, dotDate, won } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// 08 프로필 · 부스 운영자
export default function OperatorProfile() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, booths } = useOutletContext()
  const { data: profiles } = useAsync(listBoothProfiles, [])
  const { data: payments } = useAsync(listMyPayments, [])
  const profile = profiles?.[0]

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <h1 className="mb-title">프로필</h1>
      <p className="mb-sub">계정과 부스 정보를 확인하세요.</p>

      <div className="mb-card op-me">
        <div className="op-me-head">
          <span className="vs-avatar is-lg">
            <MIcon name="user" size={28} />
          </span>
          <span>
            <strong>{user.nickname}</strong>
            <small>{user.email}</small>
          </span>
        </div>
        <button type="button" className="op-edit-link" onClick={() => navigate('/operator/profile/account')}>
          <span>
            <strong>계정 정보 보기</strong>
            <small>이름 · 연락처 · 이메일</small>
          </span>
          <MIcon name="chevron" size={18} />
        </button>
      </div>

      <button type="button" className="mb-nav-card" onClick={() => navigate('/operator/profile/booth')}>
        <span>
          <strong>내 부스 프로필</strong>
          <small>{profile ? `${profile.name} · ${BOOTH_CATEGORY_LABEL[profile.categoryCode] ?? ''}` : '아직 만든 프로필이 없어요.'}</small>
        </span>
        <MIcon name="chevron" size={18} />
      </button>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>참여 행사</h3>
        </div>
        {booths.length === 0 ? (
          <p className="mb-muted">아직 참여 중인 행사가 없어요.</p>
        ) : (
          booths.map((b) => (
            <div key={b.id} className="mb-card-row op-join">
              <span>
                <strong>{b.eventName}</strong>
                <small>{dateRange(b.startDate, b.endDate)}</small>
              </span>
              <span className="mb-chip is-green">참가 확정</span>
            </div>
          ))
        )}
      </div>

      {payments?.length > 0 && (
        <div className="mb-card">
          <div className="mb-card-row">
            <h3>결제 내역</h3>
          </div>
          {payments.map((p) => (
            <div key={p.id} className="mb-card-row op-join">
              <span>
                <strong>{p.eventName}</strong>
                <small>
                  {p.label} · {dotDate(p.paidAt)}
                </small>
              </span>
              <span className="op-pay">
                <strong>{won(p.amountKrw)}</strong>
                <small>{p.status}</small>
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mb-btn is-outline"
        onClick={() => window.alert('문의 채널은 준비 중이에요. 운영본부 연락처로 문의해 주세요.')}
      >
        문의하기
      </button>
      <button type="button" className="op-logout" onClick={handleLogout}>
        로그아웃
      </button>
    </>
  )
}
