import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { ContactHqButton } from '../../components/mobile/MobileUi'
import { useAuth } from '../../context/useAuth'
import { STAFF_ROLE_LABEL, attendanceOn, dutyOf, eventOf, myShifts, scheduleDay, updateProfile, workedMinutes } from '../../dummy/staffStore'
import { dateRange, dayTitle } from '../../utils/mobileFormat'
import { normalizePhone, validateEmail, validatePhone } from '../../utils/validators'
import { NeedApproval } from './StaffNotices'
import './staff-app.css'

const hoursOf = (min) => `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ''}`

// 07 프로필 · 스태프
export function StaffProfile() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { state, me, data } = useOutletContext()
  if (state !== 'approved') return <NeedApproval state={state} title="프로필" />

  const duty = dutyOf(data, me)
  const records = data.attendance[me.id] ?? []
  const todayMin = workedMinutes(attendanceOn(data, me.id, scheduleDay(data)))
  const totalMin = records.reduce((sum, r) => sum + workedMinutes(r), 0)

  return (
    <>
      <h1 className="mb-title">프로필</h1>
      <p className="mb-sub">내 정보와 참여 중인 행사를 확인하세요.</p>

      <div className="mb-card">
        <div className="mb-card-row">
          <span className="op-me-head">
            <span className="vs-avatar is-lg">
              <MIcon name="user" size={26} />
            </span>
            <span>
              <strong>{me.name}</strong>
              <small>{me.email}</small>
            </span>
          </span>
          <button type="button" className="mb-link" onClick={() => navigate('/staff/profile/edit')}>
            수정하기 ›
          </button>
        </div>
        <dl className="mb-kv sa-kv">
          <dt>연락처</dt>
          <dd>{me.phone}</dd>
          <dt>소속</dt>
          <dd>{me.affiliation || '-'}</dd>
        </dl>
      </div>

      <div className="mb-card">
        <h3>참여 정보</h3>
        <dl className="mb-kv sa-kv">
          <dt>역할</dt>
          <dd>{STAFF_ROLE_LABEL[me.role]}</dd>
          <dt>업무</dt>
          <dd>{duty?.name ?? '미배정'}</dd>
          <dt>참여 행사</dt>
          <dd>{eventOf(data).name}</dd>
        </dl>
        <p className="mb-muted sa-caption">역할 · 업무 · 참여 행사는 주최자가 관리합니다.</p>
      </div>

      <div className="mb-card">
        <div className="mb-card-row">
          <h3>내 근무 기록</h3>
          <button type="button" className="mb-link" onClick={() => navigate('/staff/profile/records')}>
            기록 보기 ›
          </button>
        </div>
        <div className="sa-clock">
          <span>
            <small>오늘 근무</small>
            <b>{hoursOf(todayMin)}</b>
          </span>
          <span>
            <small>누적 근무</small>
            <b>{hoursOf(totalMin)}</b>
          </span>
        </div>
        {records.length === 0 && <p className="mb-muted sa-caption">아직 출퇴근 기록이 없습니다.</p>}
      </div>

      <ContactHqButton phone={eventOf(data).phone} className="mb-btn is-outline sa-contact" />
      <button
        type="button"
        className="op-logout"
        onClick={async () => {
          await logout()
          navigate('/login', { replace: true })
        }}
      >
        로그아웃
      </button>
    </>
  )
}

// 07-1 개인정보 수정 · 스태프
export function StaffProfileEdit() {
  const navigate = useNavigate()
  const { state, me, data } = useOutletContext()
  if (state !== 'approved') return <NeedApproval state={state} title="프로필" />
  return <EditForm key={me.id} me={me} data={data} onDone={() => navigate('/staff/profile')} />
}

function EditForm({ me, data, onDone }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: me.name, phone: me.phone, email: me.email, affiliation: me.affiliation })
  const [showErrors, setShowErrors] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const duty = dutyOf(data, me)
  const errors = {
    name: form.name.trim() ? '' : '이름을 입력해 주세요.',
    phone: validatePhone(form.phone),
    email: validateEmail(form.email),
  }
  const invalid = Object.values(errors).some(Boolean)
  const shown = (key) => (showErrors ? errors[key] : '')

  const save = () => {
    setShowErrors(true)
    if (invalid) return
    const digits = normalizePhone(form.phone)
    const phone = digits.length === 11 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : digits
    updateProfile(me.id, { name: form.name.trim(), phone, email: form.email.trim(), affiliation: form.affiliation.trim() })
    onDone()
  }

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate('/staff/profile')}>
        <MIcon name="back" size={18} />
        프로필
      </button>
      <h1 className="mb-title is-sm">개인정보 수정</h1>
      <p className="mb-sub">변경할 정보를 입력해 주세요.</p>
      <Field label="이름" error={shown('name')}>
        <input className="mb-input" value={form.name} onChange={set('name')} />
      </Field>
      <Field label="연락처" error={shown('phone')}>
        <input className="mb-input" value={form.phone} onChange={set('phone')} inputMode="tel" />
      </Field>
      <Field label="이메일" error={shown('email')}>
        <input className="mb-input" value={form.email} onChange={set('email')} inputMode="email" />
      </Field>
      <Field label="소속">
        <input className="mb-input" value={form.affiliation} onChange={set('affiliation')} />
      </Field>
      <div className="mb-card">
        <h3>
          주최자 관리 정보 <MIcon name="info" size={14} />
        </h3>
        <dl className="mb-kv sa-kv">
          <dt>역할</dt>
          <dd>{STAFF_ROLE_LABEL[me.role]}</dd>
          <dt>업무</dt>
          <dd>{duty?.name ?? '미배정'}</dd>
          <dt>참여 행사</dt>
          <dd>{eventOf(data).name}</dd>
        </dl>
        <p className="mb-muted sa-caption">변경이 필요하면 주최측에 문의해 주세요.</p>
      </div>
      <p className="op-note">※ 정보는 아직 이 브라우저에만 저장돼요. (서버 준비 중)</p>
      <MobileFooter>
        <button type="button" className="mb-btn is-primary" onClick={save}>
          저장하기
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

// 07-2 근무 기록 · 스태프
export function StaffRecords() {
  const navigate = useNavigate()
  const { state, me, data } = useOutletContext()
  if (state !== 'approved') return <NeedApproval state={state} title="프로필" />

  const records = [...(data.attendance[me.id] ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const totalMin = records.reduce((sum, r) => sum + workedMinutes(r), 0)
  const todayMin = workedMinutes(attendanceOn(data, me.id, scheduleDay(data)))

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate('/staff/profile')}>
        <MIcon name="back" size={18} />
        프로필
      </button>
      <h1 className="mb-title is-sm">근무 기록</h1>
      <p className="mb-sub">내 출퇴근과 근무 시간 기록을 확인하세요.</p>
      <div className="mb-card">
        <strong>{eventOf(data).name}</strong>
        <p className="mb-muted sa-caption">{dateRange(eventOf(data).startDate, eventOf(data).endDate)}</p>
      </div>
      <div className="mb-card sa-clock">
        <span>
          <small>오늘 근무</small>
          <b>{hoursOf(todayMin)}</b>
        </span>
        <span>
          <small>누적 근무</small>
          <b>{hoursOf(totalMin)}</b>
        </span>
      </div>

      {records.length === 0 && <p className="mb-empty">아직 출퇴근 기록이 없어요. 홈에서 출근하기를 눌러 보세요.</p>}
      {records.map((r) => {
        const min = workedMinutes(r)
        const shifts = myShifts(data, me.id, r.date)
        return (
          <div key={r.date} className="mb-card">
            <div className="mb-card-row">
              <h3>{dayTitle(r.date)}</h3>
              <span className={`mb-chip ${r.out ? 'is-outline' : 'is-green'}`}>{r.out ? '근무 완료' : '근무 중'}</span>
            </div>
            <dl className="mb-kv sa-kv">
              <dt>출근</dt>
              <dd>{r.in}</dd>
              <dt>퇴근</dt>
              <dd>{r.out ?? '—'}</dd>
              <dt>휴식</dt>
              <dd>{r.out && min > 0 ? hoursOf(Math.max(0, toMin(r.out) - toMin(r.in) - min)) : '—'}</dd>
              <dt>기록된 근무</dt>
              <dd>{hoursOf(min)}</dd>
            </dl>
            {shifts.length > 0 && (
              <>
                <h4 className="sa-sub-h">배정된 업무</h4>
                <ul className="sa-assigned">
                  {shifts.map((s) => (
                    <li key={s.id}>
                      <span>{data.duties.find((d) => d.id === s.dutyId)?.name}</span>
                      <b>
                        {s.start} – {s.end}
                      </b>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )
      })}
      <p className="mb-muted sa-caption">출퇴근 기록에 이상이 있으면 운영본부에 문의해 주세요.</p>
      <ContactHqButton phone={eventOf(data).phone} />
    </>
  )
}

const toMin = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))
