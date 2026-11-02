import { useState } from 'react'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { createBoothProfile, getRecruitment, listBoothProfiles, submitBoothApplication, uploadApplicationDocument } from '../../api/operatorApi'
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
const FACILITIES = ['전기', '물', '화기', '테이블']
const FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_FILE_BYTES = 10 * 1024 * 1024 // the server takes PDF / PNG / JPEG up to 10 MB

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
    affiliation: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    saleItems: '',
  })
  const [facilities, setFacilities] = useState([])
  const [answers, setAnswers] = useState({}) // question id -> answer
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState({}) // requirement id -> File
  const [created, setCreated] = useState(null) // { applicationId, uploaded:Set } once the application exists

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
  // Only the categories this event accepts (all of them when the recruitment names none).
  const allowed = Object.values(BOOTH_CATEGORY).filter((c) => recruitment.categories.length === 0 || recruitment.categories.includes(c))
  const newCategory = allowed.includes(form.newCategory) ? form.newCategory : (allowed[0] ?? form.newCategory)
  const errors = {
    name: form.name.trim() ? '' : '이름을 입력해 주세요.',
    phone: validatePhone(form.phone),
    email: validateEmail(form.email),
    newName: creating && !form.newName.trim() ? '부스 이름을 입력해 주세요.' : '',
  }
  // The documents asked for this booth's category (a document without categories applies to all).
  const category = creating ? newCategory : (profiles.find((p) => p.id === profileId)?.categoryCode ?? '')
  const documents = recruitment.documents.filter((d) => d.categories.length === 0 || d.categories.includes(category))
  recruitment.questions.forEach((q) => {
    errors[`q-${q.id}`] = q.required && !(answers[q.id] ?? '').trim() ? '답변을 입력해 주세요.' : ''
  })
  documents.forEach((d) => {
    const file = files[d.id]
    errors[`doc-${d.id}`] = !file && d.required ? `${d.name} 파일을 올려 주세요.` : file && !FILE_TYPES.includes(file.type) ? '올릴 수 없는 형식이에요. PDF, PNG, JPG만 가능해요.' : file && file.size > MAX_FILE_BYTES ? '파일은 10MB 이하여야 해요.' : ''
  })
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
          categoryCode: newCategory,
          introduction: form.newIntro.trim(),
        })
        setProfiles([created, ...profiles])
        useId = created.id
      }
      let current = created
      if (!current) {
        const result = await submitBoothApplication(
          eventId,
          {
            boothProfileId: useId,
            applicantName: form.name.trim(),
            applicantPhone: normalizePhone(form.phone),
            applicantEmail: form.email.trim(),
            ...(state?.code ? { invitationCode: state.code } : {}),
            ...optional({
              affiliation: form.affiliation,
              bankName: form.bankName,
              accountNumber: form.accountNumber,
              accountHolder: form.accountHolder,
              saleItems: form.saleItems,
              requiredFacilities: facilities.join(', '),
            }),
            ...(recruitment.questions.length > 0
              ? { additionalAnswers: recruitment.questions.filter((q) => (answers[q.id] ?? '').trim()).map((q) => ({ questionId: q.id, answer: answers[q.id].trim() })) }
              : {}),
          },
          recruitment,
        )
        current = { applicationId: result.applicationId ?? result.id, uploaded: new Set() }
        setCreated(current)
      }
      // The application exists now; send the files (a failed one can be retried without applying twice).
      for (const d of documents) {
        if (!files[d.id] || current.uploaded.has(d.id)) continue
        await uploadApplicationDocument(eventId, current.applicationId, d.id, files[d.id])
        current.uploaded.add(d.id)
      }
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

      <div className="mb-card">
        <Field label="소속 (선택)">
          <input className="mb-input" value={form.affiliation} onChange={set('affiliation')} placeholder="예: 인하대학교 동아리" maxLength={100} />
        </Field>
        <Field label="계좌 정보 (선택)">
          <input className="mb-input" value={form.bankName} onChange={set('bankName')} placeholder="은행" maxLength={50} />
          <input className="mb-input" value={form.accountNumber} onChange={set('accountNumber')} placeholder="계좌번호" inputMode="numeric" maxLength={50} />
          <input className="mb-input" value={form.accountHolder} onChange={set('accountHolder')} placeholder="예금주" maxLength={50} />
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
              <select className="mb-select" value={newCategory} onChange={set('newCategory')}>
                {allowed.map((c) => (
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

      <h2 className="mb-h3">판매 품목 (선택)</h2>
      <div className="mb-card">
        <textarea className="mb-textarea" value={form.saleItems} onChange={set('saleItems')} placeholder="예: 떡볶이, 어묵, 음료" maxLength={1000} />
      </div>

      <h2 className="mb-h3">필요 설비 (복수 선택)</h2>
      <div className="mb-card">
        <div className="op-checks">
          {FACILITIES.map((f) => (
            <label key={f} className="op-check">
              <input
                type="checkbox"
                checked={facilities.includes(f)}
                onChange={() => setFacilities((list) => (list.includes(f) ? list.filter((x) => x !== f) : [...list, f]))}
              />
              {f}
            </label>
          ))}
        </div>
      </div>

      {recruitment.questions.length > 0 && (
        <>
          <h2 className="mb-h3">주최측 추가 질문</h2>
          <div className="mb-card">
            {recruitment.questions.map((q, i) => (
              <Field key={q.id} label={`Q${i + 1}. ${q.label}${q.required ? ' *' : ' (선택)'}`} error={shown(`q-${q.id}`)}>
                <textarea
                  className="mb-textarea"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((cur) => ({ ...cur, [q.id]: e.target.value }))}
                  placeholder="내용을 입력해 주세요."
                  maxLength={2000}
                />
              </Field>
            ))}
          </div>
        </>
      )}

      {documents.length > 0 && (
        <>
          <h2 className="mb-h3">서류 업로드</h2>
          <p className="mb-muted op-caption">행사에서 요청한 서류를 올려 주세요. PDF, PNG, JPG · 최대 10MB</p>
          <div className="mb-card">
            {documents.map((d) => (
              <Field key={d.id} label={`${d.name}${d.required ? ' *' : ' (선택)'}`} error={shown(`doc-${d.id}`)}>
                <input
                  className="mb-input"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  disabled={busy || created?.uploaded.has(d.id)}
                  onChange={(e) => setFiles((f) => ({ ...f, [d.id]: e.target.files?.[0] }))}
                />
                {created?.uploaded.has(d.id) && <p className="mb-muted op-caption">올렸어요.</p>}
              </Field>
            ))}
          </div>
        </>
      )}

      <p className="op-note">제출 후 검토 결과와 진행 상황은 상태&초대에서 확인할 수 있습니다.</p>

      {message && <p className="mb-error" role="alert">{message}</p>}
      <MobileFooter>
        <button type="button" className="mb-btn is-primary" disabled={busy} onClick={submit}>
          {busy ? '신청 중…' : created ? '서류 다시 올리기' : '신청하기'}
        </button>
      </MobileFooter>
    </>
  )
}

// Only the fields that were filled in go to the server.
const optional = (fields) => Object.fromEntries(Object.entries(fields).filter(([, v]) => String(v ?? '').trim()).map(([k, v]) => [k, String(v).trim()]))

function Field({ label, error, children }) {
  return (
    <div className="mb-field">
      <span className="mb-label">{label}</span>
      {children}
      {error && <p className="mb-error">{error}</p>}
    </div>
  )
}
