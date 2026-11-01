import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { openEvent } from '../api/eventApi'
import boothLogo from '../assets/booth-logo.png'
import Toast from '../components/Toast'
import { apiErrorMessage } from '../constants/errors'
import { ORG_TYPE, ORG_TYPE_LABEL } from '../constants/eventOpening'
import { endOfLocalDate, startOfLocalDate } from '../utils/date'
import { useToast } from '../utils/useToast'
import './apply.css'

const EMPTY = { orgName: '', orgType: ORG_TYPE.STUDENT, eventName: '', startDate: '', endDate: '', venue: '' }

// One message per field that is wrong; '' when fine.
function validate(f) {
  const required = (v, msg) => (v.trim() ? '' : msg)
  return {
    orgName: required(f.orgName, '단체 이름을 입력해 주세요.'),
    eventName: required(f.eventName, '행사 이름을 입력해 주세요.'),
    period: !f.startDate || !f.endDate
      ? '행사 기간을 입력해 주세요.'
      : f.endDate < f.startDate
        ? '종료일은 시작일보다 빠를 수 없어요.'
        : '',
    venue: required(f.venue, '장소를 입력해 주세요.'),
  }
}

function Field({ label, error, hint, children }) {
  return (
    <div className="ap-field">
      <label>
        <span className="ap-label">
          {label}
          <b aria-hidden="true"> *</b>
        </span>
        {children}
      </label>
      {error ? <p className="ap-error">{error}</p> : hint ? <p className="ap-hint">{hint}</p> : null}
    </div>
  )
}

function Section({ no, title, children }) {
  return (
    <section className="ap-section">
      <h2>
        <span>{no}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

// 행사 개설 신청 (a new organizer has no event yet): the organization and the event in one form
// (POST /api/event-openings). It waits for the 부스럭 team to approve it: see EventPendingPage.
export default function EventApplyPage() {
  const navigate = useNavigate()
  const { toast, notify } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [showErrors, setShowErrors] = useState(false)
  const [sending, setSending] = useState(false)

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key)(e.target.value) })
  const errors = validate(form)
  const shown = (key) => (showErrors ? errors[key] : '')

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    setShowErrors(true)
    if (Object.values(errors).some(Boolean)) {
      notify('입력하지 않았거나 확인이 필요한 항목이 있어요.', 'error')
      return
    }
    setSending(true)
    try {
      await openEvent({
        orgName: form.orgName.trim(),
        orgType: form.orgType,
        eventName: form.eventName.trim(),
        startsAt: startOfLocalDate(form.startDate),
        endsAt: endOfLocalDate(form.endDate),
        venue: form.venue.trim(),
      })
      navigate('/pending', { replace: true })
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setSending(false)
    }
  }

  return (
    <div className="ap">
      <header className="ap-header">
        <button type="button" className="ap-brand" onClick={() => navigate('/')}>
          <img src={boothLogo} alt="" />
          <span>부스럭</span>
        </button>
      </header>

      <main className="ap-main">
        <h1>행사 개설 신청</h1>
        <p className="ap-lead">단체와 행사 정보를 입력하면 부스럭 운영팀이 확인한 뒤 행사를 열어 드려요.</p>

        <form onSubmit={submit} noValidate>
          <Section no="1" title="단체 정보">
            <Field label="단체 이름" error={shown('orgName')}>
              <input {...bind('orgName')} maxLength={100} placeholder="예: 인하대학교 총학생회" />
            </Field>
            <Field label="단체 유형">
              <div className="ap-radios" role="radiogroup">
                {Object.entries(ORG_TYPE_LABEL).map(([key, label]) => (
                  <label key={key} className={`ap-radio${form.orgType === key ? ' is-on' : ''}`}>
                    <input type="radio" name="orgType" checked={form.orgType === key} onChange={() => set('orgType')(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          </Section>

          <Section no="2" title="행사 정보">
            <Field label="행사 이름" error={shown('eventName')}>
              <input {...bind('eventName')} maxLength={100} placeholder="예: 비룡제 2026" />
            </Field>
            <Field label="행사 기간" error={shown('period')}>
              <div className="ap-range">
                <input type="date" value={form.startDate} onChange={(e) => set('startDate')(e.target.value)} aria-label="시작일" />
                <span>~</span>
                <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => set('endDate')(e.target.value)} aria-label="종료일" />
              </div>
            </Field>
            <Field label="장소" error={shown('venue')}>
              <input {...bind('venue')} maxLength={200} placeholder="예: 인하대학교 대운동장" />
            </Field>
          </Section>

          <div className="ap-submit">
            <button type="submit" className="ap-btn ap-btn-primary" disabled={sending}>
              {sending ? '신청 중…' : '개설 신청하기'}
            </button>
          </div>
        </form>
      </main>
      <Toast toast={toast} />
    </div>
  )
}
