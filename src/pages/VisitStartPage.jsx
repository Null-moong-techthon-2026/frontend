import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import ScreenShell from '../components/ScreenShell'
import { eventIdFromInput } from '../api/visitorApi'
import './visit-start.css'

// 시작하기 without logging in: a visitor opens the event they came for by pasting the event link
// (the QR code at the venue holds the same link). No list of events is shown.
export default function VisitStartPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')

  const open = (e) => {
    e.preventDefault()
    const id = eventIdFromInput(text)
    if (!id) {
      setNotice('행사 링크를 붙여 넣어 주세요. 행사장 QR을 찍어도 같은 화면이 열려요.')
      return
    }
    navigate(`/e/${id}`)
  }

  return (
    <ScreenShell>
      <AuthHeader backTo="/" />
      <div className="auth-body vs-start">
        <h2>어떤 행사에 가시나요?</h2>
        <p className="vs-start-lead">주최 측에서 받은 행사 링크를 붙여 넣으면 가입 없이 부스·지도·공지를 볼 수 있어요.</p>

        <form onSubmit={open} className="vs-start-form">
          <input
            className="vs-start-input"
            value={text}
            onChange={(e) => { setText(e.target.value); setNotice('') }}
            placeholder="행사 링크 붙여넣기"
            aria-label="행사 링크"
          />
          <button type="submit" className="btn btn-primary">
            행사 열기
          </button>
        </form>
        {notice && <p className="vs-start-error">{notice}</p>}
      </div>
    </ScreenShell>
  )
}
