import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthHeader from '../components/AuthHeader'
import ScreenShell from '../components/ScreenShell'
import { eventIdFromInput, listPublicEvents } from '../api/visitorApi'
import { apiErrorMessage } from '../constants/errors'
import { useAsync } from '../utils/useAsync'
import './visit-start.css'

// 시작하기 without logging in: a visitor opens the event they came for, either by pasting the event
// link (the QR code at the venue holds the same link) or by picking it from the list.
export default function VisitStartPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const { data: events, error, reload } = useAsync(listPublicEvents, [])

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
        <p className="vs-start-lead">가입 없이 부스·지도·공지를 볼 수 있어요.</p>

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

        <h3>진행 중인 행사</h3>
        {error ? (
          <p className="vs-start-error">
            {apiErrorMessage(error)}{' '}
            <button type="button" className="vs-start-retry" onClick={reload}>
              다시 시도
            </button>
          </p>
        ) : !events ? (
          <p className="vs-start-lead">불러오는 중…</p>
        ) : events.length === 0 ? (
          <p className="vs-start-lead">열려 있는 행사가 아직 없어요.</p>
        ) : (
          <ul className="vs-start-list">
            {events.map((ev) => (
              <li key={ev.id}>
                <button type="button" onClick={() => navigate(`/e/${ev.id}`)} className={ev.ended ? 'is-ended' : ''}>
                  <strong>{ev.name}</strong>
                  <span>
                    {ev.organizationName} · {ev.startDate} ~ {ev.endDate}
                    {ev.ended ? ' · 종료' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScreenShell>
  )
}
