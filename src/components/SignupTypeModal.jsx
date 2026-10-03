import { useNavigate } from 'react-router-dom'
import { IconChevronRight, IconClose } from './icons'
import iconOrganizerTest from '../assets/icon-organizer-test.png'
import iconBoothTest from '../assets/icon-booth-test.png'

// NOTE: icon-organizer-test.png / icon-booth-test.png are placeholder
// test icons — swap for real artwork once it's ready.
const TYPES = [
  {
    key: 'organizer',
    title: '축제 주최자',
    description: '축제를 만들고 전체 운영을 관리해요.',
    to: '/signup/organizer',
    icon: iconOrganizerTest,
  },
  {
    key: 'booth',
    title: '부스 운영자',
    description: '내 부스를 등록하고 운영해요.',
    to: '/signup/booth',
    icon: iconBoothTest,
  },
]

// Overlay shown on top of the login screen when the user taps 회원가입.
// Lets them pick which of the two signup flows (screens 4 & 5) to enter.
export default function SignupTypeModal({ onClose }) {
  const navigate = useNavigate()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-type-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-box-header">
          <h2 id="signup-type-title">회원가입 유형 선택</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            <IconClose />
          </button>
        </div>
        <p className="modal-box-subtitle">가입할 역할을 선택해 주세요.</p>

        <div className="modal-options">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className="modal-option"
              onClick={() => navigate(t.to)}
            >
              <img src={t.icon} alt="" className="modal-option-icon" />
              <span className="modal-option-text">
                <span className="modal-option-title">{t.title}</span>
                <span className="modal-option-description">{t.description}</span>
              </span>
              <IconChevronRight className="modal-option-chevron" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
