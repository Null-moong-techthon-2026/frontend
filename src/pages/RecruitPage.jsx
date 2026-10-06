import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import { BOOTH_CATEGORY_LABEL, BOOTH_STATUS } from '../constants/booth'
import { EVENT_IMAGE_EXTENSIONS, EVENT_IMAGE_MAX_BYTES } from '../constants/event'
import {
  RECRUIT_CONTACT_MAX,
  RECRUIT_DOC_LABEL_MAX,
  RECRUIT_DOC_MAX,
  RECRUIT_FEE_MAX,
  RECRUIT_FEE_NOTE,
  RECRUIT_INTRO_MAX,
  RECRUIT_STATUS,
  RECRUIT_STATUS_LABEL,
  RECRUIT_TARGET_MAX,
} from '../constants/recruit'
import { useBooths } from '../context/useBooths'
import { useEvent } from '../context/useEvent'
import { useRecruit } from '../context/useRecruit'
import { formatDateTime } from '../utils/date'
import { fileExtension, formatFileSize } from '../utils/file'
import { getRecruitStatus } from '../utils/recruit'
import './recruit.css'

const CATEGORIES = Object.keys(BOOTH_CATEGORY_LABEL)
const ACCEPT = EVENT_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(',')

const STATUS_CLASS = {
  [RECRUIT_STATUS.OPEN]: 'is-open',
  [RECRUIT_STATUS.CLOSED]: 'is-closed',
  [RECRUIT_STATUS.PRIVATE]: 'is-private',
}

// The editable draft, built from what is saved (the event holds the deadline and target count).
const toForm = (event, recruit) => ({
  intro: recruit.intro,
  imageUrl: recruit.imageUrl,
  deadline: event.recruitDeadline,
  target: String(event.recruitTarget),
  categories: recruit.categories,
  feeInfo: recruit.feeInfo,
  documents: recruit.documents,
  contact: recruit.contact,
})

// Canonical form: used to save, and to tell whether the draft differs from what is saved
// (stray whitespace or category click order do not count as a change).
const normalize = (f) => ({
  intro: f.intro.trim(),
  imageUrl: f.imageUrl,
  deadline: f.deadline,
  target: f.target.trim(),
  categories: CATEGORIES.filter((c) => f.categories.includes(c)),
  feeInfo: f.feeInfo.trim(),
  documents: f.documents,
  contact: f.contact.trim(),
})

const sameForm = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))

const isValidTarget = (t) => /^\d+$/.test(t) && Number(t) >= 1 && Number(t) <= RECRUIT_TARGET_MAX

export default function RecruitPage() {
  const navigate = useNavigate()
  const { event, updateEvent } = useEvent()
  const { recruit, updateRecruit, setPublished } = useRecruit()
  const { booths } = useBooths()

  const saved = toForm(event, recruit)
  const [form, setForm] = useState(saved)
  const [showErrors, setShowErrors] = useState(false) // field errors appear after the first save try
  const [justSaved, setJustSaved] = useState(false)
  const [imageName, setImageName] = useState('')
  const [imageError, setImageError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [docDraft, setDocDraft] = useState(null) // null = closed, string = the new document's name
  const [docError, setDocError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const docSeq = useRef(1)

  // Esc closes whichever dialog is open.
  useEffect(() => {
    if (!previewOpen && !closeOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setPreviewOpen(false)
      setCloseOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewOpen, closeOpen])

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }))
  const dirty = !sameForm(form, saved)

  const errors = {
    deadline: form.deadline ? '' : '모집 마감일을 선택해 주세요.',
    target: isValidTarget(form.target.trim())
      ? ''
      : `모집 부스 수는 1~${RECRUIT_TARGET_MAX} 사이 숫자로 입력해 주세요.`,
    categories: form.categories.length > 0 ? '' : '모집 카테고리를 하나 이상 선택해 주세요.',
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const shown = (key) => (showErrors ? errors[key] : '')

  const save = () => {
    setShowErrors(true)
    if (hasErrors) return
    const next = normalize(form)
    // The deadline and target belong to the event (the dashboard shows them too).
    updateEvent({ recruitDeadline: next.deadline, recruitTarget: Number(next.target) })
    updateRecruit({
      intro: next.intro,
      imageUrl: next.imageUrl,
      categories: next.categories,
      feeInfo: next.feeInfo,
      documents: next.documents,
      contact: next.contact,
    })
    setForm(next)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  const toggleCategory = (key) =>
    patch({
      categories: CATEGORIES.filter((c) => (c === key ? !form.categories.includes(c) : form.categories.includes(c))),
    })

  const toggleDoc = (id) =>
    patch({
      documents: form.documents.map((d) => (d.id === id ? { ...d, required: !d.required } : d)),
    })

  const removeDoc = (id) => patch({ documents: form.documents.filter((d) => d.id !== id) })

  const addDoc = () => {
    const label = (docDraft ?? '').trim()
    if (!label) return setDocError('서류 이름을 입력해 주세요.')
    if (form.documents.some((d) => d.label === label)) return setDocError('이미 있는 서류예요.')
    if (form.documents.length >= RECRUIT_DOC_MAX) {
      return setDocError(`서류는 최대 ${RECRUIT_DOC_MAX}개까지 추가할 수 있어요.`)
    }
    patch({
      documents: [...form.documents, { id: `custom-${docSeq.current++}`, label, required: true }],
    })
    setDocDraft(null)
    setDocError('')
  }

  // TODO(backend): upload the file and keep the returned server URL instead of a blob: URL.
  const loadImage = (file) => {
    if (!file) return
    if (!EVENT_IMAGE_EXTENSIONS.includes(fileExtension(file.name))) {
      setImageError('PNG, JPG, WEBP, GIF 이미지만 넣을 수 있어요.')
    } else if (file.size > EVENT_IMAGE_MAX_BYTES) {
      setImageError('이미지는 최대 10MB까지 넣을 수 있어요.')
    } else {
      setImageError('')
      setImageName(`${file.name} (${formatFileSize(file.size)})`)
      patch({ imageUrl: URL.createObjectURL(file) })
    }
  }

  // ---- numbers that must match the other screens (computed, not stored) ----
  const count = (status) => booths.filter((b) => b.status === status).length
  const status = getRecruitStatus(recruit.published, event.recruitDeadline)
  const canPublish = !dirty && recruit.intro.trim() !== ''

  const statusNote = recruit.published
    ? '공개 중 · 저장한 공고가 행사 목록에 표시됩니다.'
    : dirty
      ? '저장하지 않은 변경 사항이 있어요. 저장한 뒤 공개할 수 있어요.'
      : recruit.intro.trim() === ''
        ? '소개글을 저장해야 공개할 수 있어요.'
        : '비공개 · 공개하면 행사 목록에 표시됩니다.'

  const requiredDocs = form.documents.filter((d) => d.required)

  return (
    <OrganizerLayout
      active="recruit"
      crumb="부스 모집"
      title="부스 모집"
      subtitle="모집 공고를 작성하고 부스 운영자에게 공개하세요."
      actions={
        <>
          {dirty ? (
            <span className="rc-dirty">저장하지 않은 변경 사항이 있어요</span>
          ) : (
            justSaved && <span className="rc-saved">저장했어요</span>
          )}
          <button type="button" className="om-btn om-btn-outline" onClick={() => setPreviewOpen(true)}>
            미리보기
          </button>
          <button type="button" className="om-btn om-btn-primary" onClick={save}>
            저장하기
          </button>
        </>
      }
    >
      {/* ---------- 모집 상태 ---------- */}
      <section className="rc-status">
        <h2>모집 상태</h2>
        <span className={`rc-chip ${STATUS_CLASS[status]}`}>{RECRUIT_STATUS_LABEL[status]}</span>
        <span className="rc-status-deadline">
          마감 {event.recruitDeadline ? formatDateTime(event.recruitDeadline) : '미정'}
        </span>
        <p className="rc-status-note">{statusNote}</p>
        {recruit.published ? (
          <button type="button" className="rc-btn rc-btn-danger-outline" onClick={() => setCloseOpen(true)}>
            공개 종료
          </button>
        ) : (
          <button
            type="button"
            className="rc-btn rc-btn-primary"
            disabled={!canPublish}
            onClick={() => setPublished(true)}
          >
            공개하기
          </button>
        )}
      </section>

      <div className="rc-grid">
        {/* ---------- 모집 공고 작성 ---------- */}
        <section className="om-panel rc-form">
          <h2 className="om-panel-title">모집 공고 작성</h2>

          <h3 className="rc-section">행사 소개</h3>
          <div className="rc-row">
            <label htmlFor="rc-intro">소개글</label>
            <div>
              <textarea
                id="rc-intro"
                className="rc-textarea"
                maxLength={RECRUIT_INTRO_MAX}
                placeholder="부스 운영자에게 보여줄 모집 소개를 입력하세요."
                value={form.intro}
                onChange={(e) => patch({ intro: e.target.value })}
              />
              <span className="rc-count">
                {form.intro.length}/{RECRUIT_INTRO_MAX}
              </span>
            </div>
          </div>

          <div className="rc-row">
            <span className="rc-label">대표 이미지</span>
            <div>
              {form.imageUrl ? (
                <div className="rc-image">
                  <img src={form.imageUrl} alt="대표 이미지 미리보기" />
                  <div>
                    {imageName && <small>{imageName}</small>}
                    <div className="rc-image-actions">
                      <label className="om-chip rc-file-chip">
                        변경
                        <input
                          type="file"
                          accept={ACCEPT}
                          className="om-file-input"
                          onChange={(e) => {
                            loadImage(e.target.files[0])
                            e.target.value = ''
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="om-chip"
                        onClick={() => {
                          patch({ imageUrl: null })
                          setImageName('')
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  className={`rc-drop${dragging ? ' is-dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    loadImage(e.dataTransfer.files[0])
                  }}
                >
                  <input
                    type="file"
                    accept={ACCEPT}
                    className="om-file-input"
                    onChange={(e) => {
                      loadImage(e.target.files[0])
                      e.target.value = ''
                    }}
                  />
                  <Icon name="upload" />
                  <small>이미지 업로드 · PNG, JPG</small>
                </label>
              )}
              {imageError && <p className="rc-error">{imageError}</p>}
            </div>
          </div>

          <h3 className="rc-section">모집 조건</h3>
          <div className="rc-row rc-row-pair">
            <label htmlFor="rc-deadline">모집 마감일</label>
            <div>
              <input
                id="rc-deadline"
                type="datetime-local"
                className="rc-input"
                value={form.deadline}
                onChange={(e) => patch({ deadline: e.target.value })}
              />
              {shown('deadline') && <p className="rc-error">{shown('deadline')}</p>}
            </div>
            <label htmlFor="rc-target">모집 부스 수</label>
            <div>
              <div className="rc-suffix">
                <input
                  id="rc-target"
                  className="rc-input"
                  inputMode="numeric"
                  maxLength={3}
                  value={form.target}
                  onChange={(e) => patch({ target: e.target.value.replace(/\D/g, '') })}
                />
                <span>팀</span>
              </div>
              {shown('target') && <p className="rc-error">{shown('target')}</p>}
            </div>
          </div>

          <div className="rc-row">
            <span className="rc-label">모집 카테고리</span>
            <div>
              <div className="rc-checks">
                {CATEGORIES.map((c) => (
                  <label key={c} className="rc-check">
                    <input
                      type="checkbox"
                      checked={form.categories.includes(c)}
                      onChange={() => toggleCategory(c)}
                    />
                    {BOOTH_CATEGORY_LABEL[c]}
                  </label>
                ))}
              </div>
              {shown('categories') && <p className="rc-error">{shown('categories')}</p>}
            </div>
          </div>

          <div className="rc-row">
            <label htmlFor="rc-fee">참가비 안내</label>
            <div className="rc-fee">
              <input
                id="rc-fee"
                className="rc-input"
                maxLength={RECRUIT_FEE_MAX}
                placeholder="예: 50,000원 / 부스"
                value={form.feeInfo}
                onChange={(e) => patch({ feeInfo: e.target.value })}
              />
              <small>{RECRUIT_FEE_NOTE}</small>
            </div>
          </div>

          <div className="rc-row">
            <span className="rc-label">필요 서류</span>
            <div>
              <div className="rc-checks">
                {form.documents.map((d) => (
                  <span key={d.id} className="rc-check rc-doc">
                    <label>
                      <input type="checkbox" checked={d.required} onChange={() => toggleDoc(d.id)} />
                      {d.label}
                    </label>
                    {d.id.startsWith('custom-') && (
                      <button
                        type="button"
                        className="rc-doc-remove"
                        aria-label={`${d.label} 삭제`}
                        onClick={() => removeDoc(d.id)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {docDraft === null ? (
                  <button
                    type="button"
                    className="rc-add"
                    onClick={() => {
                      setDocDraft('')
                      setDocError('')
                    }}
                  >
                    + 서류 추가
                  </button>
                ) : (
                  <span className="rc-add-form">
                    <input
                      autoFocus
                      className="rc-input"
                      maxLength={RECRUIT_DOC_LABEL_MAX}
                      placeholder="서류 이름"
                      value={docDraft}
                      onChange={(e) => {
                        setDocDraft(e.target.value)
                        setDocError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addDoc()
                        } else if (e.key === 'Escape') {
                          setDocDraft(null)
                          setDocError('')
                        }
                      }}
                    />
                    <button type="button" className="om-chip" onClick={addDoc}>
                      추가
                    </button>
                    <button
                      type="button"
                      className="om-chip"
                      onClick={() => {
                        setDocDraft(null)
                        setDocError('')
                      }}
                    >
                      취소
                    </button>
                  </span>
                )}
              </div>
              {docError && <p className="rc-error">{docError}</p>}
            </div>
          </div>

          <div className="rc-row">
            <label htmlFor="rc-contact">문의 연락처</label>
            <input
              id="rc-contact"
              className="rc-input"
              maxLength={RECRUIT_CONTACT_MAX}
              placeholder="예: 부스 담당자 01000000000"
              value={form.contact}
              onChange={(e) => patch({ contact: e.target.value })}
            />
          </div>

          <p className="rc-foot-note">저장한 공고는 모집 상태의 공개 버튼으로 공개할 수 있습니다.</p>
        </section>

        {/* ---------- 모집 신청 현황 ---------- */}
        <section className="om-panel rc-summary">
          <h2 className="om-panel-title">모집 신청 현황</h2>
          <p className="rc-summary-sub">{event.name} 모집 공고의 신청 현황입니다.</p>

          <div className="rc-total">
            <span>접수된 신청</span>
            <strong>{booths.length}건</strong>
            <p>부스 운영자 {booths.length}팀이 신청했습니다.</p>
          </div>

          <div className="rc-tiles">
            <div className="rc-tile is-pending">
              <span>검토 중</span>
              <strong>{count(BOOTH_STATUS.PENDING)}</strong>
            </div>
            <div className="rc-tile is-approved">
              <span>승인</span>
              <strong>{count(BOOTH_STATUS.APPROVED)}</strong>
            </div>
            <div className="rc-tile is-rejected">
              <span>반려</span>
              <strong>{count(BOOTH_STATUS.REJECTED)}</strong>
            </div>
          </div>

          <dl className="rc-facts">
            <div>
              <dt>모집 마감일</dt>
              <dd>{event.recruitDeadline ? formatDateTime(event.recruitDeadline) : '미정'}</dd>
            </div>
            <div>
              <dt>모집 부스 수</dt>
              <dd>{event.recruitTarget}팀</dd>
            </div>
          </dl>
          <p className="rc-summary-note">신청 세부 내용은 부스 관리에서 확인할 수 있어요.</p>

          <button
            type="button"
            className="om-btn om-btn-primary om-btn-block rc-go"
            onClick={() => navigate('/organizer/booths')}
          >
            부스 모집 바로가기
          </button>
          <p className="rc-summary-note">미리보기 버튼으로 운영자에게 보이는 공고를 확인하세요.</p>
        </section>
      </div>

      {/* ---------- 미리보기 ---------- */}
      {previewOpen && (
        <div className="om-confirm-overlay" onClick={() => setPreviewOpen(false)}>
          <div
            className="rc-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rc-preview-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rc-preview-head">
              <h2 id="rc-preview-title">모집 공고 미리보기</h2>
              <button type="button" className="rc-x" aria-label="닫기" onClick={() => setPreviewOpen(false)}>
                ×
              </button>
            </div>
            <p className="rc-preview-sub">부스 운영자에게 이렇게 보여요. (저장하지 않은 내용도 반영돼요)</p>

            <div className="rc-preview-body">
              {form.imageUrl ? (
                <img className="rc-preview-image" src={form.imageUrl} alt="" />
              ) : (
                <div className="rc-preview-art" aria-hidden="true" />
              )}
              <h3>{event.name} 부스 모집</h3>
              <p className="rc-preview-intro">{form.intro.trim() || '소개글이 아직 없어요.'}</p>
              <dl>
                <div>
                  <dt>모집 마감</dt>
                  <dd>{form.deadline ? formatDateTime(form.deadline) : '미정'}</dd>
                </div>
                <div>
                  <dt>모집 부스 수</dt>
                  <dd>{isValidTarget(form.target.trim()) ? `${form.target.trim()}팀` : '미정'}</dd>
                </div>
                <div>
                  <dt>모집 카테고리</dt>
                  <dd>
                    {CATEGORIES.filter((c) => form.categories.includes(c))
                      .map((c) => BOOTH_CATEGORY_LABEL[c])
                      .join(' · ') || '-'}
                  </dd>
                </div>
                <div>
                  <dt>참가비</dt>
                  <dd>{form.feeInfo.trim() || '-'}</dd>
                </div>
                <div>
                  <dt>필요 서류</dt>
                  <dd>{requiredDocs.map((d) => d.label).join(', ') || '없음'}</dd>
                </div>
                <div>
                  <dt>문의</dt>
                  <dd>{form.contact.trim() || '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="rc-preview-foot">
              <button type="button" className="om-btn om-btn-primary" onClick={() => setPreviewOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- 공개 종료 확인 ---------- */}
      {closeOpen && (
        <div className="om-confirm-overlay" onClick={() => setCloseOpen(false)}>
          <div
            className="om-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="rc-close-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="rc-close-title">모집 공개를 종료할까요?</h2>
            <p>종료하면 부스 운영자에게 공고가 보이지 않아요. 저장한 내용은 그대로 남고, 다시 공개할 수 있어요.</p>
            <div className="om-confirm-actions">
              <button type="button" className="om-btn om-btn-outline" onClick={() => setCloseOpen(false)}>
                취소
              </button>
              <button
                type="button"
                className="om-btn om-btn-danger"
                onClick={() => {
                  setPublished(false)
                  setCloseOpen(false)
                }}
              >
                공개 종료
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}
