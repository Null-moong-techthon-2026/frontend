import { useEffect, useState } from 'react'
import {
  EVENT_IMAGE_EXTENSIONS,
  EVENT_IMAGE_MAX_BYTES,
} from '../constants/event'
import { fileExtension, formatFileSize } from '../utils/file'
import './event-edit-modal.css'

const ACCEPT = EVENT_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(',')

// Edit dialog for the basic event info. onSave receives only the edited fields.
// Progress (진행 예정/진행 중/진행 종료) is not edited: it follows the dates.
export default function EventEditModal({ event, onSave, onClose }) {
  const [form, setForm] = useState({
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    intro: event.intro,
    imageUrl: event.imageUrl,
  })
  const [imageName, setImageName] = useState('')
  const [imageError, setImageError] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const patch = (fields) => setForm((f) => ({ ...f, ...fields }))

  const error = !form.name.trim()
    ? '행사 이름을 입력해 주세요.'
    : !form.startDate || !form.endDate
      ? '행사 날짜를 입력해 주세요.'
      : form.endDate < form.startDate
        ? '종료일은 시작일보다 빠를 수 없어요.'
        : !form.venue.trim()
          ? '행사 장소를 입력해 주세요.'
          : ''

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

  const submit = (e) => {
    e.preventDefault()
    if (error) return
    onSave({ ...form, name: form.name.trim(), venue: form.venue.trim() })
  }

  return (
    <div className="om-confirm-overlay" onClick={onClose}>
      <form
        className="ee-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ee-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="ee-title">행사 정보 수정</h2>

        <div className="ee-field">
          <span>행사 이미지 (선택)</span>
          {form.imageUrl ? (
            <div className="ee-image">
              <img src={form.imageUrl} alt="행사 이미지 미리보기" />
              <div>
                {imageName && <small>{imageName}</small>}
                <div className="ee-image-actions">
                  <label className="om-chip">
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
              className={`ee-drop${dragging ? ' is-dragging' : ''}`}
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
              <strong>이미지를 끌어오거나 클릭해서 선택</strong>
              <small>PNG, JPG, WEBP, GIF · 최대 10MB</small>
            </label>
          )}
          {imageError && <p className="ee-error ee-error-inline">{imageError}</p>}
        </div>

        <label className="ee-field">
          <span>행사 이름</span>
          <input
            value={form.name}
            maxLength={40}
            onChange={(e) => patch({ name: e.target.value })}
            autoFocus
          />
        </label>

        <div className="ee-row">
          <label className="ee-field">
            <span>시작일</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
            />
          </label>
          <label className="ee-field">
            <span>종료일</span>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => patch({ endDate: e.target.value })}
            />
          </label>
        </div>

        <label className="ee-field">
          <span>장소</span>
          <input
            value={form.venue}
            maxLength={60}
            onChange={(e) => patch({ venue: e.target.value })}
          />
        </label>

        <label className="ee-field">
          <span>행사 소개</span>
          <textarea
            value={form.intro}
            maxLength={200}
            onChange={(e) => patch({ intro: e.target.value })}
          />
        </label>

        {error && <p className="ee-error">{error}</p>}

        <div className="ee-actions">
          <button type="button" className="om-btn om-btn-outline" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="om-btn om-btn-primary" disabled={Boolean(error)}>
            저장
          </button>
        </div>
      </form>
    </div>
  )
}
