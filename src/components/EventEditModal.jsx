import { useEffect, useState } from 'react'
import { uploadImage } from '../api/eventApi'
import { apiErrorMessage } from '../constants/errors'
import {
  EVENT_IMAGE_EXTENSIONS,
  EVENT_IMAGE_MAX_BYTES,
  EVENT_INTRO_MAX,
  EVENT_NAME_MAX,
  EVENT_VENUE_MAX,
} from '../constants/event'
import { fileExtension, formatFileSize } from '../utils/file'
import './event-edit-modal.css'

const ACCEPT = EVENT_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(',')

// Edit dialog for the basic event info. onSave receives only the fields that changed and may
// reject (the dialog then shows the reason and stays open).
// Progress (진행 예정/진행 중/진행 종료) is not edited: it follows the dates.
//
// The image is uploaded as soon as it is chosen; saving only links it to the event. An event image
// can be replaced but not removed (the backend has no way to clear it).
export default function EventEditModal({ event, onSave, onClose }) {
  const [form, setForm] = useState({
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    intro: event.intro,
  })
  const [image, setImage] = useState({ assetId: event.imageAssetId, url: event.imageUrl })
  const [imageName, setImageName] = useState('')
  const [imageError, setImageError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const patch = (fields) => {
    setForm((f) => ({ ...f, ...fields }))
    setSaveError('')
  }

  const error = !form.name.trim()
    ? '행사 이름을 입력해 주세요.'
    : !form.startDate || !form.endDate
      ? '행사 날짜를 입력해 주세요.'
      : form.endDate < form.startDate
        ? '종료일은 시작일보다 빠를 수 없어요.'
        : !form.venue.trim()
          ? '행사 장소를 입력해 주세요.'
          : ''

  const loadImage = async (file) => {
    if (!file || uploading) return
    if (!EVENT_IMAGE_EXTENSIONS.includes(fileExtension(file.name))) {
      setImageError('PNG, JPG 이미지만 넣을 수 있어요.')
    } else if (file.size > EVENT_IMAGE_MAX_BYTES) {
      setImageError('이미지는 최대 10MB까지 넣을 수 있어요.')
    } else {
      setImageError('')
      setUploading(true)
      try {
        const asset = await uploadImage(event.id, file)
        setImage({ assetId: asset.mediaAssetId, url: asset.readUrl })
        setImageName(`${file.name} (${formatFileSize(file.size)})`)
      } catch (err) {
        setImageError(apiErrorMessage(err))
      } finally {
        setUploading(false)
      }
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (error || saving || uploading) return
    const next = { ...form, name: form.name.trim(), venue: form.venue.trim() }
    const changes = {}
    for (const key of Object.keys(next)) if (next[key] !== event[key]) changes[key] = next[key]
    if (image.assetId !== event.imageAssetId) changes.imageAssetId = image.assetId
    setSaving(true)
    try {
      if (Object.keys(changes).length > 0) await onSave(changes)
      else onClose()
    } catch (err) {
      setSaveError(apiErrorMessage(err))
      setSaving(false)
    }
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
          {image.url ? (
            <div className="ee-image">
              <img src={image.url} alt="행사 이미지 미리보기" />
              <div>
                {imageName && <small>{imageName}</small>}
                <div className="ee-image-actions">
                  <label className="om-chip">
                    {uploading ? '올리는 중…' : '변경'}
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="om-file-input"
                      disabled={uploading}
                      onChange={(e) => {
                        loadImage(e.target.files[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
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
                disabled={uploading}
                onChange={(e) => {
                  loadImage(e.target.files[0])
                  e.target.value = ''
                }}
              />
              <strong>{uploading ? '올리는 중…' : '이미지를 끌어오거나 클릭해서 선택'}</strong>
              <small>PNG, JPG · 최대 10MB</small>
            </label>
          )}
          {imageError && <p className="ee-error ee-error-inline">{imageError}</p>}
        </div>

        <label className="ee-field">
          <span>행사 이름</span>
          <input
            value={form.name}
            maxLength={EVENT_NAME_MAX}
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
            maxLength={EVENT_VENUE_MAX}
            onChange={(e) => patch({ venue: e.target.value })}
          />
        </label>

        <label className="ee-field">
          <span>행사 소개</span>
          <textarea
            value={form.intro}
            maxLength={EVENT_INTRO_MAX}
            onChange={(e) => patch({ intro: e.target.value })}
          />
        </label>

        {(error || saveError) && <p className="ee-error">{error || saveError}</p>}

        <div className="ee-actions">
          <button type="button" className="om-btn om-btn-outline" onClick={onClose}>
            취소
          </button>
          <button
            type="submit"
            className="om-btn om-btn-primary"
            disabled={Boolean(error) || saving || uploading}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
