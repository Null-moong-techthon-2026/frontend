import { useState } from 'react'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { createBoothProfile, getRecruitment, listBoothProfiles, submitBoothApplication } from '../../api/operatorApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY, BOOTH_CATEGORY_LABEL } from '../../constants/booth'
import { apiErrorMessage } from '../../constants/errors'
import { dateRange } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import { normalizePhone, validateEmail, validatePhone } from '../../utils/validators'
import './operator.css'

const NEW_PROFILE = '__new__'

// 04 부스 신청서 · 부스 운영자
export default function OperatorApply() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const { state } = useLocation() // { recruitment, code } from the notice / an invitation
  const { user } = useOutletContext()

  const { data: recruitment, error, reload } = useAsync(
    () => (state?.recruitment?.eventId === eventId ? Promise.resolve(state.recruitment) : getRecruitment(eventId)),
    [eventId],
  )
  const { data: profiles, setData: setProfiles } = useAsync(listBoothProfiles, [])

  const [form, setForm] = useState({
    name: user.nickname ?? '',
    phone: user.phoneNumber ?? '',
    email: user.email ?? '',
    profileId: '',
    newName: '',
    newCategory: BOOTH_CATEGORY.FOOD,
    newIntro: '',
  })
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate(`/operator/recruits/${eventId}`, { state })}>
      <MIcon name="back" size={18} />
      공고 상세
    </button>
  )
  if (!recruitment || !profiles) {
    return (
      <>
        {back}
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }

  // With no profile yet the new-profile fields show straight away.
  const profileId = form.profileId || (profiles[0]?.id ?? NEW_PROFILE)
  const creating = profileId === NEW_PROFILE
  const errors = {
    name: form.name.trim() ? '' : '이름을 입력해 주세요.',
    phone: validatePhone(form.phone),
    email: validateEmail(form.email),
    newName: creating && !form.newName.trim() ? '부스 이름을 입력해 주세요.' : '',
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const shown = (key) => (showErrors ? errors[key] : '')

  const submit = async () => {
    setShowErrors(true)
    if (hasErrors || busy) return
    setBusy(true)
    setMessage('')
    try {
      let useId = profileId
      if (creating) {
        const created = await createBoothProfile({
          name: form.newName.trim(),
          categoryCode: form.newCategory,
          introduction: form.newIntro.trim(),
        })
        setProfiles([created, ...profiles])
        useId = created.id
      }
      await submitBoothApplication(
        eventId,
        {
          boothProfileId: useId,
          applicantName: form.name.trim(),
          applicantPhone: normalizePhone(form.phone),
          applicantEmail: form.email.trim(),
          ...(state?.code ? { invitationCode: state.code } : {}),
        },
        recruitment,
      )
      navigate('/operator/invite', { replace: true, state: { applied: recruitment.event.name } })
    } catch (err) {
      setMessage(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {back}
      <h1 className="mb-title is-sm">부스 신청서</h1>
      <p className="mb-sub">기본 정보를 확인하고 신청 내용을 작성해 주세요.</p>

      <div className="mb-card">
        <strong>{recruitment.event.name}</strong>
        <p className="mb-muted op-caption">
          {dateRange(recruitment.event.startDate, recruitment.event.endDate)} · {recruitment.event.venue}
        </p>
      </div>

      <div className="mb-card-row op-form-head">
        <h2 className="mb-h3">기본 정보</h2>
        <button
          type="button"
          className="mb-link"
          onClick={() => setForm((f) => ({ ...f, name: user.nickname ?? '', phone: user.phoneNumber ?? '', email: user.email ?? '' }))}
        >
          프로필 자동 입력
        </button>
      </div>
      <div className="mb-card">
        <Field label="이름" error={shown('name')}>
          <input className="mb-input" value={form.name} onChange={set('name')} autoComplete="name" />
        </Field>
        <Field label="연락처" error={shown('phone')}>
          <input className="mb-input" value={form.phone} onChange={set('phone')} inputMode="tel" placeholder="010-0000-0000" />
        </Field>
        <Field label="이메일" error={shown('email')}>
          <input className="mb-input" value={form.email} onChange={set('email')} inputMode="email" placeholder="booth@example.com" />
        </Field>
      </div>

      <h2 className="mb-h3">부스 프로필</h2>
      <div className="mb-card">
        <Field label="신청에 사용할 부스">
          <select className="mb-select" value={profileId} onChange={set('profileId')}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {BOOTH_CATEGORY_LABEL[p.categoryCode]}
              </option>
            ))}
            <option value={NEW_PROFILE}>+ 새 부스 프로필 만들기</option>
          </select>
        </Field>
        {creating && (
          <>
            <Field label="부스 이름" error={shown('newName')}>
              <input className="mb-input" value={form.newName} onChange={set('newName')} placeholder="예: 달빛 떡볶이" maxLength={100} />
            </Field>
            <Field label="카테고리">
              <select className="mb-select" value={form.newCategory} onChange={set('newCategory')}>
                {Object.values(BOOTH_CATEGORY).map((c) => (
                  <option key={c} value={c}>
                    {BOOTH_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="부스 소개 (선택)">
              <textarea className="mb-textarea" value={form.newIntro} onChange={set('newIntro')} placeholder="방문객에게 보여줄 소개를 적어 주세요." />
            </Field>
          </>
        )}
      </div>

      <p className="op-note">제출 후 검토 결과와 진행 상황은 상태&초대에서 확인할 수 있습니다.</p>

      {message && <p className="mb-error" role="alert">{message}</p>}
      <MobileFooter>
        <button type="button" className="mb-btn is-primary" disabled={busy} onClick={submit}>
          {busy ? '신청 중…' : '신청하기'}
        </button>
      </MobileFooter>
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="mb-field">
      <span className="mb-label">{label}</span>
      {children}
      {error && <p className="mb-error">{error}</p>}
    </div>
  )
}
