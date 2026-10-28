import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBoothProfile, listBoothProfiles, updateBoothProfile } from '../../api/operatorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { LoadingBlock } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY, BOOTH_CATEGORY_LABEL } from '../../constants/booth'
import { apiErrorMessage } from '../../constants/errors'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

// 내 부스 프로필 · 부스 운영자: the profiles (name, category, intro) used to apply to events.
export default function OperatorProfileBooth() {
  const navigate = useNavigate()
  const { data: profiles, error, reload, setData } = useAsync(listBoothProfiles, [])
  const [adding, setAdding] = useState(false)

  const back = (
    <button type="button" className="mb-back" onClick={() => navigate('/operator/profile')}>
      <MIcon name="back" size={18} />
      프로필
    </button>
  )
  if (!profiles) {
    return (
      <>
        {back}
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }

  const replace = (saved) => setData(profiles.map((p) => (p.id === saved.id ? saved : p)))

  return (
    <>
      {back}
      <h1 className="mb-title is-sm">내 부스 프로필</h1>
      <p className="mb-sub">행사에 신청할 때 쓰는 부스 정보예요.</p>

      {profiles.length === 0 && !adding && <p className="mb-empty">아직 만든 프로필이 없어요.</p>}
      {profiles.map((p) => (
        <ProfileForm key={`${p.id}:${p.revision}`} profile={p} onSave={(fields) => updateBoothProfile(p, fields).then(replace)} />
      ))}
      {adding ? (
        <ProfileForm
          onSave={async (fields) => {
            const created = await createBoothProfile(fields)
            setData([created, ...profiles])
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="mb-btn is-outline" onClick={() => setAdding(true)}>
          <MIcon name="plus" size={16} /> 새 부스 프로필
        </button>
      )}
    </>
  )
}

function ProfileForm({ profile, onSave, onCancel }) {
  const [name, setName] = useState(profile?.name ?? '')
  const [categoryCode, setCategoryCode] = useState(profile?.categoryCode ?? BOOTH_CATEGORY.FOOD)
  const [introduction, setIntroduction] = useState(profile?.introduction ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty = !profile || name.trim() !== profile.name || categoryCode !== profile.categoryCode || introduction !== profile.introduction

  const save = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    setMessage('')
    try {
      await onSave({ name: name.trim(), categoryCode, introduction })
      setSaved(true)
    } catch (err) {
      setMessage(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-card">
      <div className="mb-field">
        <label className="mb-label">부스 이름</label>
        <input className="mb-input" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mb-field">
        <label className="mb-label">카테고리</label>
        <select className="mb-select" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)}>
          {Object.values(BOOTH_CATEGORY).map((c) => (
            <option key={c} value={c}>
              {BOOTH_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-field">
        <label className="mb-label">소개</label>
        <textarea className="mb-textarea" value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
      </div>
      {message && <p className="mb-error">{message}</p>}
      {saved && !dirty && <p className="op-banner">저장했어요.</p>}
      <div className="mb-btn-row">
        {onCancel && (
          <button type="button" className="mb-btn is-outline is-sm" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="button" className="mb-btn is-primary is-sm" disabled={!name.trim() || !dirty || busy} onClick={save}>
          {busy ? '저장 중…' : profile ? '저장하기' : '만들기'}
        </button>
      </div>
    </div>
  )
}
