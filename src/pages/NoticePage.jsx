import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { uploadImage } from '../api/eventApi'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Select from '../components/Select'
import Toast from '../components/Toast'
import { apiErrorMessage } from '../constants/errors'
import {
  NOTICE_AUDIENCE_LABEL,
  NOTICE_BODY_MAX,
  NOTICE_IMAGE_EXTENSIONS,
  NOTICE_IMAGE_MAX_BYTES,
  NOTICE_STATUS,
  NOTICE_STATUS_LABEL,
  NOTICE_TITLE_MAX,
} from '../constants/notice'
import { useEvent } from '../context/useEvent'
import { useNotices } from '../context/useNotices'
import { formatDateTime } from '../utils/date'
import { fileExtension, formatFileSize } from '../utils/file'
import { audienceText, noticeDateText as dateText, sortNotices } from '../utils/notice'
import { useToast } from '../utils/useToast'
import './notice.css'

const AUDIENCES = Object.keys(NOTICE_AUDIENCE_LABEL)
const EMPTY_FORM = { title: '', body: '', image: null, audiences: AUDIENCES, urgent: false }
const ACCEPT = NOTICE_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(',')

const STATUS_CLASS = {
  [NOTICE_STATUS.PUBLISHED]: 'is-published',
  [NOTICE_STATUS.CLOSED]: 'is-closed',
  [NOTICE_STATUS.DRAFT]: 'is-draft',
}

export default function NoticePage() {
  const { event } = useEvent()
  const { notices, loading, loadNotice, saveNotice, closeNotice, reopenNotice, deleteNotice } =
    useNotices()
  const { toast, notify } = useToast()
  // undefined = nothing chosen yet (the first notice of the list is shown), null = none selected.
  const [chosenId, setChosenId] = useState(undefined)
  // The list rows have no body or image; the full notice of the selection is loaded separately.
  const [detail, setDetail] = useState(null)
  // The dashboard's "+ 공지 작성" opens this page straight into the composer.
  const { state } = useLocation()
  const [mode, setMode] = useState(state?.compose ? 'new' : 'view') // 'view' | 'edit' | 'new'
  const [form, setForm] = useState(EMPTY_FORM)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const list = sortNotices(
    notices
      .filter((n) => n.title.includes(query.trim()))
      .filter((n) => audienceFilter === 'all' || n.audiences.includes(audienceFilter)),
  )

  const selectedId = chosenId === undefined ? (list[0]?.id ?? null) : chosenId
  const row = notices.find((n) => n.id === selectedId) ?? null
  // Show the full notice once it is loaded, the list row (without body) until then.
  const selected = row && (detail?.id === row.id && detail.revision === row.revision ? detail : row)
  const editing = mode !== 'view'
  const isNew = mode === 'new'

  const canDraft = form.title.trim() !== ''
  const canPublish = canDraft && form.body.trim() !== '' && form.audiences.length > 0

  const patchForm = (fields) => setForm((f) => ({ ...f, ...fields }))

  // Load the body and image of the selected notice (again after the list changed its revision).
  const rowRevision = row?.revision
  useEffect(() => {
    if (!selectedId) return
    let alive = true
    loadNotice(selectedId)
      .then((full) => alive && setDetail(full))
      .catch((err) => alive && notify(apiErrorMessage(err), 'error'))
    return () => {
      alive = false
    }
  }, [selectedId, rowRevision, loadNotice, notify])

  const startNew = () => {
    setForm(EMPTY_FORM)
    setFileError('')
    setMode('new')
  }

  const startEdit = () => {
    const { title, body, image, audiences, urgent } = selected
    setForm({ title, body, image, audiences, urgent })
    setFileError('')
    setMode('edit')
  }

  const cancelEdit = () => {
    setFileError('')
    setMode('view')
  }

  const openNotice = (id) => {
    setChosenId(id)
    setMode('view')
  }

  // Runs a write call and reports a failure as a message; resolves with its result (or undefined).
  const attempt = async (action, successMessage) => {
    if (busy) return undefined
    setBusy(true)
    try {
      const result = await action()
      if (successMessage) notify(successMessage)
      return result
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      return undefined
    } finally {
      setBusy(false)
    }
  }

  // Saves the form with the given status and returns to the viewer.
  const submit = async (status) => {
    const { title, body, image, audiences, urgent } = form
    const fields = { title: title.trim(), body, image, audiences, urgent }
    const saved = await attempt(
      () => saveNotice(isNew ? null : selectedId, fields, status),
      status === NOTICE_STATUS.PUBLISHED ? '공지를 게시했어요.' : '공지를 저장했어요.',
    )
    if (!saved) return
    setChosenId(saved.id)
    setDetail(saved)
    setMode('view')
  }

  const changeStatus = async (action, message) => {
    const saved = await attempt(() => action(selectedId), message)
    if (saved) setDetail(saved)
  }

  const remove = async () => {
    setDeleteOpen(false)
    const done = await attempt(async () => {
      await deleteNotice(selectedId)
      return true
    }, '공지를 삭제했어요.')
    if (done) setChosenId(null)
  }

  const toggleAudience = (key) =>
    patchForm({
      audiences: form.audiences.includes(key)
        ? form.audiences.filter((a) => a !== key)
        : AUDIENCES.filter((a) => a === key || form.audiences.includes(a)),
    })

  // A notice has at most one image. It is uploaded as soon as it is chosen and linked on save.
  const addFile = async (file) => {
    if (!file || uploading) return
    if (!NOTICE_IMAGE_EXTENSIONS.includes(fileExtension(file.name))) {
      setFileError(`'${file.name}'은(는) 올릴 수 없는 형식이에요. PNG 또는 JPG만 가능해요.`)
      return
    }
    if (file.size > NOTICE_IMAGE_MAX_BYTES) {
      setFileError(`'${file.name}'은(는) 10MB를 넘어요.`)
      return
    }
    setFileError('')
    setUploading(true)
    try {
      const asset = await uploadImage(event.id, file)
      patchForm({
        image: { assetId: asset.mediaAssetId, url: asset.readUrl, name: file.name, size: file.size },
      })
    } catch (err) {
      setFileError(apiErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFile(e.dataTransfer.files[0])
  }

  return (
    <OrganizerLayout
      active="notice"
      crumb="공지사항"
      title="공지사항"
      subtitle="대상별 공지를 작성하고 행사 소식을 전달하세요."
      actions={
        <button type="button" className="om-btn om-btn-primary" onClick={startNew}>
          + 새 공지 작성
        </button>
      }
    >
      <div className="nt-grid">
        {/* ---------- 공지 목록 ---------- */}
        <section className="om-panel nt-list-panel">
          <div className="nt-list-head">
            <h2 className="om-panel-title">공지</h2>
            <span className="nt-total">총 {list.length}개</span>
          </div>

          <div className="nt-filters">
            <label className="om-search nt-search">
              <Icon name="search" />
              <input
                placeholder="제목 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <Select value={audienceFilter} onChange={setAudienceFilter}>
              <option value="all">전체 대상</option>
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {NOTICE_AUDIENCE_LABEL[a]}
                </option>
              ))}
            </Select>
          </div>

          <ul className="nt-list">
            {list.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`nt-item${!isNew && n.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => openNotice(n.id)}
                >
                  <span className="nt-item-top">
                    <strong>{n.title}</strong>
                    {n.urgent && <span className="nt-urgent">긴급</span>}
                  </span>
                  <span className="nt-item-audience">{audienceText(n.audiences)}</span>
                  <span className="nt-item-bottom">
                    <span>{dateText(n)}</span>
                    <span className={`nt-status ${STATUS_CLASS[n.status]}`}>
                      {NOTICE_STATUS_LABEL[n.status]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="nt-empty">
                {loading
                  ? '불러오는 중…'
                  : notices.length === 0
                    ? '아직 작성한 공지가 없어요.'
                    : '조건에 맞는 공지가 없어요.'}
              </li>
            )}
          </ul>

          <p className="nt-note">
            <Icon name="info" />
            긴급 공지는 해당 대상 공지 목록 최상단에 표시됩니다.
          </p>
        </section>

        {/* ---------- 열람 / 작성 ---------- */}
        <section className="om-panel nt-detail">
          {editing ? (
            <>
              <div className="nt-detail-head">
                <h2 className="om-panel-title">{isNew ? '새 공지 작성' : '공지 수정'}</h2>
                <button type="button" className="om-chip" onClick={cancelEdit}>
                  취소
                </button>
              </div>

              <div className="nt-detail-body">
                <label className="nt-label" htmlFor="nt-title">
                  제목
                </label>
                <input
                  id="nt-title"
                  className="nt-input"
                  placeholder="공지 제목을 입력하세요."
                  maxLength={NOTICE_TITLE_MAX}
                  value={form.title}
                  onChange={(e) => patchForm({ title: e.target.value })}
                />

                <label className="nt-label" htmlFor="nt-body">
                  본문
                </label>
                <textarea
                  id="nt-body"
                  className="nt-textarea"
                  placeholder="공지 내용을 입력하세요."
                  maxLength={NOTICE_BODY_MAX}
                  value={form.body}
                  onChange={(e) => patchForm({ body: e.target.value })}
                />

                <span className="nt-label">이미지 첨부 (선택)</span>
                {form.image ? (
                  <ul className="nt-files">
                    <li>
                      <img src={form.image.url} alt="" />
                      <span className="nt-file-name">{form.image.name ?? '첨부 이미지'}</span>
                      {form.image.size != null && (
                        <span className="nt-file-size">{formatFileSize(form.image.size)}</span>
                      )}
                      <button type="button" className="om-chip" onClick={() => patchForm({ image: null })}>
                        삭제
                      </button>
                    </li>
                  </ul>
                ) : (
                  <label
                    className={`nt-drop${dragging ? ' is-dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="om-file-input"
                      disabled={uploading}
                      onChange={(e) => {
                        addFile(e.target.files[0])
                        e.target.value = ''
                      }}
                    />
                    <Icon name="upload" />
                    <span>
                      <strong>{uploading ? '올리는 중…' : '이미지를 이곳에 끌어오거나 선택'}</strong>
                      <small>PNG · JPG · 최대 10MB · 공지마다 1장</small>
                    </span>
                  </label>
                )}
                {fileError && <p className="nt-error">{fileError}</p>}

                <span className="nt-label">공지 대상</span>
                <div className="nt-audiences">
                  {AUDIENCES.map((a) => (
                    <label key={a}>
                      <input
                        type="checkbox"
                        checked={form.audiences.includes(a)}
                        onChange={() => toggleAudience(a)}
                      />
                      {NOTICE_AUDIENCE_LABEL[a]}
                    </label>
                  ))}
                </div>
                <p className="nt-hint">선택한 대상에게만 공지가 표시됩니다.</p>

                <div className="nt-urgent-row">
                  <div>
                    <strong>긴급 공지</strong>
                    <span>선택한 대상의 공지 목록 최상단에 노출</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.urgent}
                    aria-label="긴급 공지"
                    className={`nt-switch${form.urgent ? ' is-on' : ''}`}
                    onClick={() => patchForm({ urgent: !form.urgent })}
                  />
                </div>
              </div>

              <div className="nt-actions">
                <button
                  type="button"
                  className="nt-btn nt-btn-outline"
                  disabled={!canDraft || busy || uploading}
                  onClick={() => submit(NOTICE_STATUS.DRAFT)}
                >
                  임시 저장
                </button>
                {!isNew && selected.status === NOTICE_STATUS.PUBLISHED && (
                  <button
                    type="button"
                    className="nt-btn nt-btn-danger"
                    disabled={!canDraft || busy || uploading}
                    onClick={() => submit(NOTICE_STATUS.CLOSED)}
                  >
                    게시 종료
                  </button>
                )}
                <button
                  type="button"
                  className="nt-btn nt-btn-primary"
                  disabled={!canPublish || busy || uploading}
                  onClick={() => submit(NOTICE_STATUS.PUBLISHED)}
                >
                  {!isNew && selected.status === NOTICE_STATUS.PUBLISHED ? '수정 저장' : '게시하기'}
                </button>
              </div>
            </>
          ) : selected ? (
            <>
              <div className="nt-detail-head">
                <h2 className="om-panel-title">공지 열람</h2>
                <span className={`nt-status nt-status-lg ${STATUS_CLASS[selected.status]}`}>
                  {NOTICE_STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div className="nt-detail-body">
                <div className="nt-view-title">
                  <h3>{selected.title}</h3>
                  {selected.urgent && <span className="nt-urgent">긴급</span>}
                </div>

                <dl className="nt-meta">
                  <dt>공지 대상</dt>
                  <dd>{audienceText(selected.audiences)}</dd>
                  <dt>{selected.status === NOTICE_STATUS.DRAFT ? '임시 저장' : '게시일'}</dt>
                  <dd>{dateText(selected).replace('저장 ', '')}</dd>
                  <dt>최종 수정</dt>
                  <dd>{formatDateTime(selected.updatedAt)}</dd>
                </dl>

                <div className="nt-view-body">{selected.body}</div>
                {selected.image && (
                  <img className="nt-view-image" src={selected.image.url} alt="공지 이미지" />
                )}
              </div>

              <div className="nt-actions">
                <button
                  type="button"
                  className="nt-btn nt-btn-danger-outline nt-actions-left"
                  onClick={() => setDeleteOpen(true)}
                >
                  삭제
                </button>
                {selected.status === NOTICE_STATUS.PUBLISHED && (
                  <button
                    type="button"
                    className="nt-btn nt-btn-danger"
                    disabled={busy}
                    onClick={() => changeStatus(closeNotice, '게시를 종료했어요.')}
                  >
                    게시 종료
                  </button>
                )}
                {selected.status === NOTICE_STATUS.CLOSED && (
                  <button
                    type="button"
                    className="nt-btn nt-btn-outline"
                    disabled={busy}
                    onClick={() => changeStatus(reopenNotice, '다시 게시했어요.')}
                  >
                    다시 게시
                  </button>
                )}
                <button type="button" className="nt-btn nt-btn-primary" onClick={startEdit}>
                  {selected.status === NOTICE_STATUS.DRAFT ? '이어서 작성' : '수정하기'}
                </button>
              </div>
            </>
          ) : (
            <div className="nt-detail-empty">
              <Icon name="bell" />
              <p>목록에서 공지를 선택하면 내용이 보여요.</p>
            </div>
          )}
        </section>
      </div>

      <Toast toast={toast} />

      {deleteOpen && selected && (
        <div className="om-confirm-overlay" onClick={() => setDeleteOpen(false)}>
          <div
            className="om-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="nt-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="nt-delete-title">공지를 삭제할까요?</h2>
            <p>'{selected.title}' 공지가 삭제되며, 이 작업은 되돌릴 수 없어요.</p>
            <div className="om-confirm-actions">
              <button type="button" className="om-btn om-btn-outline" onClick={() => setDeleteOpen(false)}>
                취소
              </button>
              <button
                type="button"
                className="om-btn om-btn-danger"
                onClick={remove}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}
