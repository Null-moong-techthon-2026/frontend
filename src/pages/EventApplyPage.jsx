import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitEventApplication } from '../api/eventApplicationApi'
import boothLogo from '../assets/booth-logo.png'
import Toast from '../components/Toast'
import { HOME_PATH } from '../constants/auth'
import {
  AGREEMENTS,
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABEL,
  EVENT_KIND_LABEL,
  NEEDS_AFFILIATION,
  NEEDS_BUSINESS_NUMBER,
  ORG_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_PLAN_INFO,
  RECEIPT_TYPE_LABEL,
} from '../constants/eventApplication'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import { normalizePhone, validateEmail, validatePhone } from '../utils/validators'
import { useMyEventApplications } from '../utils/useMyEventApplications'
import { useToast } from '../utils/useToast'
import './apply.css'

const EMPTY = {
  orgName: '',
  orgType: '',
  orgEmail: '',
  businessNumber: '',
  affiliation: '',
  representative: '',
  website: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactRole: '',
  eventName: '',
  eventKind: '',
  startDate: '',
  endDate: '',
  venue: '',
  boothCount: '',
  handover: false,
  paymentPlan: '',
  paymentMethod: '',
  receiptType: '',
  agreements: {},
}

const digits = (v) => v.replace(/\D/g, '')

// One message per field that is wrong; '' when fine. Conditional fields only count when needed.
function validate(f) {
  const required = (v, msg) => (v.trim() ? '' : msg)
  return {
    orgName: required(f.orgName, '조직명을 입력해 주세요.'),
    orgType: f.orgType ? '' : '조직 유형을 선택해 주세요.',
    orgEmail: validateEmail(f.orgEmail),
    businessNumber:
      NEEDS_BUSINESS_NUMBER.includes(f.orgType) && digits(f.businessNumber).length !== 10
        ? '사업자 등록번호 10자리를 입력해 주세요.'
        : '',
    affiliation: NEEDS_AFFILIATION.includes(f.orgType) ? required(f.affiliation, '소속 학교·기관명을 입력해 주세요.') : '',
    contactName: required(f.contactName, '담당자 이름을 입력해 주세요.'),
    contactEmail: validateEmail(f.contactEmail),
    contactPhone: validatePhone(f.contactPhone),
    contactRole: required(f.contactRole, '직책 또는 역할을 입력해 주세요.'),
    eventName: required(f.eventName, '행사명을 입력해 주세요.'),
    eventKind: f.eventKind ? '' : '행사 유형을 선택해 주세요.',
    period: !f.startDate || !f.endDate
      ? '행사 기간을 입력해 주세요.'
      : f.endDate < f.startDate
        ? '종료일은 시작일보다 빠를 수 없어요.'
        : '',
    venue: required(f.venue, '장소를 입력해 주세요.'),
    boothCount: /^\d+$/.test(f.boothCount) && Number(f.boothCount) >= 1 ? '' : '예상 부스 수를 1 이상의 숫자로 입력해 주세요.',
    paymentPlan: f.paymentPlan ? '' : '결제 방식을 선택해 주세요.',
    paymentMethod: f.paymentMethod ? '' : '결제 수단을 선택해 주세요.',
    receiptType: f.receiptType ? '' : '증빙 유형을 선택해 주세요.',
    agreements: AGREEMENTS.every((a) => f.agreements[a.key]) ? '' : '모든 항목에 동의해 주세요.',
  }
}

const formatDate = (iso) => iso.slice(0, 10).replaceAll('-', '.')

function Field({ label, required = false, error, hint, children }) {
  return (
    <div className="ap-field">
      <label>
        <span className="ap-label">
          {label}
          {required && <b aria-hidden="true"> *</b>}
        </span>
        {children}
      </label>
      {error ? <p className="ap-error">{error}</p> : hint ? <p className="ap-hint">{hint}</p> : null}
    </div>
  )
}

function Radios({ name, value, options, onChange }) {
  return (
    <div className="ap-radios" role="radiogroup">
      {options.map(([key, label]) => (
        <label key={key} className={`ap-radio${value === key ? ' is-on' : ''}`}>
          <input type="radio" name={name} checked={value === key} onChange={() => onChange(key)} />
          {label}
        </label>
      ))}
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

// What the applicant sees once an application exists (or was just sent).
function StatusCard({ application, onNew }) {
  const navigate = useNavigate()
  const rejected = application.status === APPLICATION_STATUS.REJECTED
  return (
    <div className="ap-card ap-status">
      <span className={`ap-chip is-${application.status.toLowerCase()}`}>
        {APPLICATION_STATUS_LABEL[application.status]}
      </span>
      <h2>{application.eventName}</h2>
      <p>
        {formatDate(application.submittedAt)}에 접수한 행사 개설 신청이에요.
        {application.status === APPLICATION_STATUS.PENDING &&
          ' 담당자가 신청 내용을 검토한 뒤 결과를 안내해 드려요.'}
        {application.status === APPLICATION_STATUS.APPROVED &&
          ' 승인됐어요. 담당자가 행사를 열어 드리면 대시보드에서 바로 관리할 수 있어요.'}
        {rejected && ' 아래 사유를 확인하고 내용을 고쳐 다시 신청할 수 있어요.'}
      </p>
      {rejected && <p className="ap-reason">반려 사유: {application.rejectionReason || '(적어 두지 않았어요)'}</p>}
      <div className="ap-actions">
        {rejected && (
          <button type="button" className="ap-btn ap-btn-primary" onClick={onNew}>
            다시 신청하기
          </button>
        )}
        <button type="button" className="ap-btn ap-btn-outline" onClick={() => navigate(HOME_PATH)}>
          대시보드로 이동
        </button>
      </div>
    </div>
  )
}

export default function EventApplyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, notify } = useToast()
  const { applications, loading, error: loadError, reload } = useMyEventApplications(user.id)
  const [justSent, setJustSent] = useState(null) // the application just submitted, until the list is reloaded
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    contactEmail: user.email ?? '',
    contactPhone: user.phoneNumber ?? '',
  }))
  const [showErrors, setShowErrors] = useState(false)
  const [reapply, setReapply] = useState(false)

  const latest = justSent ?? applications?.[0] ?? null
  const showForm = !loading && !loadError && (!latest || (latest.status === APPLICATION_STATUS.REJECTED && reapply))

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key)(e.target.value) })
  const errors = validate(form)
  const shown = (key) => (showErrors ? errors[key] : '')

  const allAgreed = AGREEMENTS.every((a) => form.agreements[a.key])
  const setAllAgreed = (on) =>
    set('agreements')(Object.fromEntries(AGREEMENTS.map((a) => [a.key, on])))

  const submit = async (e) => {
    e.preventDefault()
    if (sending) return
    setShowErrors(true)
    if (Object.values(errors).some(Boolean)) {
      notify('입력하지 않았거나 확인이 필요한 항목이 있어요.', 'error')
      document.querySelector('.ap-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const clean = {
      ...form,
      orgName: form.orgName.trim(),
      businessNumber: digits(form.businessNumber),
      contactPhone: normalizePhone(form.contactPhone),
      boothCount: Number(form.boothCount),
    }
    setSending(true)
    try {
      setJustSent(await submitEventApplication(clean))
      setReapply(false)
      reload()
      window.scrollTo({ top: 0 })
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
    } finally {
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
        <button type="button" className="ap-home" onClick={() => navigate(HOME_PATH)}>
          대시보드
        </button>
      </header>

      <main className="ap-main">
        <h1>행사 개설 신청</h1>
        <p className="ap-lead">
          행사 정보를 알려 주시면 담당자가 확인한 뒤 결과를 안내해 드려요. 승인되면 부스럭에서 행사를 열어 드려요.
        </p>

        {loading ? (
          <p className="ap-lead">불러오는 중…</p>
        ) : loadError ? (
          <p className="ap-banner">{apiErrorMessage(loadError)}</p>
        ) : !showForm ? (
          <StatusCard application={latest} onNew={() => setReapply(true)} />
        ) : (
          <form onSubmit={submit} noValidate>
            {latest?.status === APPLICATION_STATUS.REJECTED && (
              <p className="ap-banner">
                지난 신청이 반려됐어요. 사유: {latest.rejectionReason || '(적어 두지 않았어요)'}
              </p>
            )}

            <Section no="1" title="조직 정보">
              <Field label="조직명(공식 명칭)" required error={shown('orgName')}>
                <input {...bind('orgName')} maxLength={100} placeholder="예: 인하대학교 총학생회" />
              </Field>
              <Field label="조직 유형" required error={shown('orgType')}>
                <Radios name="orgType" value={form.orgType} options={Object.entries(ORG_TYPE_LABEL)} onChange={set('orgType')} />
              </Field>
              <Field label="조직 공식 이메일" required error={shown('orgEmail')}>
                <input {...bind('orgEmail')} type="email" maxLength={254} placeholder="official@example.com" />
              </Field>
              {NEEDS_BUSINESS_NUMBER.includes(form.orgType) && (
                <Field label="사업자 등록번호" required error={shown('businessNumber')} hint="기업·개인사업자는 꼭 입력해 주세요.">
                  <input
                    value={form.businessNumber}
                    onChange={(e) => set('businessNumber')(digits(e.target.value).slice(0, 10))}
                    inputMode="numeric"
                    placeholder="숫자 10자리 (하이픈 없이)"
                  />
                </Field>
              )}
              {NEEDS_AFFILIATION.includes(form.orgType) && (
                <Field label="소속 학교·기관명" required error={shown('affiliation')}>
                  <input {...bind('affiliation')} maxLength={100} placeholder="예: 인하대학교" />
                </Field>
              )}
              <div className="ap-two">
                <Field label="대표자명 (선택)">
                  <input {...bind('representative')} maxLength={100} />
                </Field>
                <Field label="웹사이트 · SNS (선택)">
                  <input {...bind('website')} maxLength={300} placeholder="https://" />
                </Field>
              </div>
            </Section>

            <Section no="2" title="담당자 정보">
              <div className="ap-two">
                <Field label="이름" required error={shown('contactName')}>
                  <input {...bind('contactName')} maxLength={100} autoComplete="name" />
                </Field>
                <Field label="직책 · 역할" required error={shown('contactRole')}>
                  <input {...bind('contactRole')} maxLength={100} placeholder="예: 총학생회 기획국장" />
                </Field>
              </div>
              <div className="ap-two">
                <Field label="이메일" required error={shown('contactEmail')}>
                  <input {...bind('contactEmail')} type="email" maxLength={254} autoComplete="email" />
                </Field>
                <Field label="휴대폰" required error={shown('contactPhone')} hint="하이픈(-) 없이 숫자만 입력해 주세요.">
                  <input {...bind('contactPhone')} inputMode="tel" autoComplete="tel" />
                </Field>
              </div>
            </Section>

            <Section no="3" title="행사 정보">
              <Field label="행사명" required error={shown('eventName')}>
                <input {...bind('eventName')} maxLength={100} placeholder="예: 비룡제 2026" />
              </Field>
              <Field label="행사 유형" required error={shown('eventKind')}>
                <Radios name="eventKind" value={form.eventKind} options={Object.entries(EVENT_KIND_LABEL)} onChange={set('eventKind')} />
              </Field>
              <Field label="행사 기간" required error={shown('period')}>
                <div className="ap-range">
                  <input type="date" aria-label="시작일" {...bind('startDate')} />
                  <span>~</span>
                  <input type="date" aria-label="종료일" min={form.startDate} {...bind('endDate')} />
                </div>
              </Field>
              <Field label="장소" required error={shown('venue')} hint="장소명 또는 상세 주소">
                <input {...bind('venue')} maxLength={200} />
              </Field>
              <Field label="예상(또는 목표) 부스 수" required error={shown('boothCount')} hint="요금 구간을 정하는 기준이에요.">
                <input
                  value={form.boothCount}
                  onChange={(e) => set('boothCount')(digits(e.target.value).slice(0, 4))}
                  inputMode="numeric"
                  placeholder="예: 30"
                />
              </Field>
              <label className="ap-check">
                <input type="checkbox" checked={form.handover} onChange={(e) => set('handover')(e.target.checked)} />
                인수인계 시스템도 함께 신청할게요.
              </label>
            </Section>

            <Section no="4" title="요금 확인">
              <Field label="결제 방식" required error={shown('paymentPlan')}>
                <div className="ap-plans">
                  {Object.entries(PAYMENT_PLAN_INFO).map(([key, info]) => (
                    <label key={key} className={`ap-plan${form.paymentPlan === key ? ' is-on' : ''}`}>
                      <input type="radio" name="plan" checked={form.paymentPlan === key} onChange={() => set('paymentPlan')(key)} />
                      <strong>{info.title}</strong>
                      <span>{info.text}</span>
                      <em>금액 미정</em>
                    </label>
                  ))}
                </div>
              </Field>
            </Section>

            <Section no="5" title="동의 · 결제 정보">
              <Field label="결제 수단" required error={shown('paymentMethod')}>
                <Radios name="method" value={form.paymentMethod} options={Object.entries(PAYMENT_METHOD_LABEL)} onChange={set('paymentMethod')} />
              </Field>
              <Field label="증빙 유형" required error={shown('receiptType')}>
                <Radios name="receipt" value={form.receiptType} options={Object.entries(RECEIPT_TYPE_LABEL)} onChange={set('receiptType')} />
              </Field>
              <div className="ap-agree">
                <label className="ap-check is-all">
                  <input type="checkbox" checked={allAgreed} onChange={(e) => setAllAgreed(e.target.checked)} />
                  전체 동의
                </label>
                {AGREEMENTS.map((a) => (
                  <label key={a.key} className="ap-check">
                    <input
                      type="checkbox"
                      checked={Boolean(form.agreements[a.key])}
                      onChange={(e) => set('agreements')({ ...form.agreements, [a.key]: e.target.checked })}
                    />
                    {a.label}
                  </label>
                ))}
                {shown('agreements') && <p className="ap-error">{shown('agreements')}</p>}
                <p className="ap-hint">약관과 규정의 전문은 준비 중이에요.</p>
              </div>
            </Section>

            <div className="ap-submit">
              <p className="ap-hint">
                실제 결제는 아직 연결되어 있지 않아요. 신청 내용은 담당자가 확인한 뒤 안내해 드려요.
              </p>
              <button type="submit" className="ap-btn ap-btn-primary" disabled={sending}>
                {sending ? '제출하는 중…' : '신청 제출하기'}
              </button>
            </div>
          </form>
        )}
      </main>
      <Toast toast={toast} />
    </div>
  )
}
