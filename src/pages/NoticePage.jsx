import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Select from '../components/Select'
import {
  NOTICE_ATTACHMENT_EXTENSIONS,
  NOTICE_ATTACHMENT_MAX_BYTES,
  NOTICE_ATTACHMENT_MAX_COUNT,
  NOTICE_AUDIENCE_LABEL,
  NOTICE_IMAGE_EXTENSIONS,
  NOTICE_STATUS,
  NOTICE_STATUS_LABEL,
} from '../constants/notice'
import { useNotices } from '../context/useNotices'
import { formatDateTime } from '../utils/date'
import { audienceText, noticeDateText as dateText, sortNotices } from '../utils/notice'
import { fileExtension, formatFileSize } from '../utils/file'
import './notice.css'

const AUDIENCES = Object.keys(NOTICE_AUDIENCE_LABEL)
const EMPTY_FORM = { title: '', body: '', attachments: [], audiences: AUDIENCES, urgent: false }
const ACCEPT = NOTICE_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',')
const isImage = (a) => NOTICE_IMAGE_EXTENSIONS.includes(fileExtension(a.name))

const STATUS_CLASS = {
  [NOTICE_STATUS.PUBLISHED]: 'is-published',
  [NOTICE_STATUS.CLOSED]: 'is-closed',
  [NOTICE_STATUS.DRAFT]: 'is-draft',
}

export default function NoticePage() {
  const { notices, saveNotice, closeNotice, reopenNotice, deleteNotice } = useNotices()
  const [selectedId, setSelectedId] = useState(1)
  // The dashboard's "+ 공지 작성" opens this page straight into the composer.
  const { state } = useLocation()
  const [mode, setMode] = useState(state?.compose ? 'new' : 'view') // 'view' | 'edit' | 'new'
  const [form, setForm] = useState(EMPTY_FORM)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const list = sortNotices(
    notices
      .filter((n) => n.title.includes(query.trim()))
      .filter((n) => audienceFilter === 'all' || n.audiences.includes(audienceFilter)),
  )

  const selected = notices.find((n) => n.id === selectedId) ?? null
  const editing = mode !== 'view'
  const isNew = mode === 'new'

  const canDraft = form.title.trim() !== ''
  const canPublish = canDraft && form.body.trim() !== '' && form.audiences.length > 0

  const patchForm = (fields) => setForm((f) => ({ ...f, ...fields }))

  const startNew = () => {
    setForm(EMPTY_FORM)
    setFileError('')
    setMode('new')
  }

  const startEdit = () => {
    const { title, body, attachments, audiences, urgent } = selected
    setForm({ title, body, attachments, audiences, urgent })
    setFileError('')
    setMode('edit')
  }

  const cancelEdit = () => {
    setFileError('')
    setMode('view')
  }

  const openNotice = (id) => {
    setSelectedId(id)
    setMode('view')
  }

  // Saves the form with the given status and returns to the viewer.
  const submit = (status) => {
    const { title, body, attachments, audiences, urgent } = form
    const fields = { title: title.trim(), body, attachments, audiences, urgent }
    const id = saveNotice(isNew ? null : selectedId, fields, status)
    setSelectedId(id)
    setMode('view')
  }

  const toggleAudience = (key) =>
    patchForm({
      audiences: form.audiences.includes(key)
        ? form.audiences.filter((a) => a !== key)
        : AUDIENCES.filter((a) => a === key || form.audiences.includes(a)),
    })

  // TODO(backend): upload each file and keep the returned server URL instead of a blob: URL.
  const addFiles = (fileList) => {
    const room = NOTICE_ATTACHMENT_MAX_COUNT - form.attachments.length
    const added = []
    let error = ''
    for (const file of fileList) {
      if (!NOTICE_ATTACHMENT_EXTENSIONS.includes(fileExtension(file.name))) {
        error = `'${file.name}'은(는) 첨부할 수 없는 형식이에요.`
      } else if (file.size > NOTICE_ATTACHMENT_MAX_BYTES) {
        error = `'${file.name}'은(는) 10MB를 넘어요.`
      } else if (added.length >= room) {
        error = `파일은 최대 ${NOTICE_ATTACHMENT_MAX_COUNT}개까지 첨부할 수 있어요.`
      } else {
        added.push({
          id: `${Date.now()}-${added.length}-${file.name}`,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
        })
      }
    }
    setFileError(error)
    if (added.length > 0) patchForm({ attachments: [...form.attachments, ...added] })
  }

  const removeAttachment = (id) =>
    patchForm({ attachments: form.attachments.filter((a) => a.id !== id) })

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles([...e.dataTransfer.files])
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
            {list.length === 0 && <li className="nt-empty">조건에 맞는 공지가 없어요.</li>}
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
                  maxLength={60}
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
                  value={form.body}
                  onChange={(e) => patchForm({ body: e.target.value })}
                />

                <span className="nt-label">파일 첨부 (선택)</span>
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
                    multiple
                    accept={ACCEPT}
                    className="om-file-input"
                    onChange={(e) => {
                      addFiles([...e.target.files])
                      e.target.value = ''
                    }}
                  />
                  <Icon name="upload" />
                  <span>
                    <strong>파일을 이곳에 끌어오거나 선택</strong>
                    <small>
                      이미지 · PDF · 한글(HWP) · Word · PowerPoint · Excel 등 · 파일당 최대 10MB ·
                      최대 {NOTICE_ATTACHMENT_MAX_COUNT}개
                    </small>
                  </span>
                </label>
                {fileError && <p className="nt-error">{fileError}</p>}
                {form.attachments.length > 0 && (
                  <ul className="nt-files">
                    {form.attachments.map((a) => (
                      <li key={a.id}>
                        {isImage(a) ? <img src={a.url} alt="" /> : <Icon name="image" />}
                        <span className="nt-file-name">{a.name}</span>
                        <span className="nt-file-size">{formatFileSize(a.size)}</span>
                        <button
                          type="button"
                          className="om-chip"
                          onClick={() => removeAttachment(a.id)}
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

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
                  disabled={!canDraft}
                  onClick={() => submit(NOTICE_STATUS.DRAFT)}
                >
                  임시 저장
                </button>
                {!isNew && selected.status === NOTICE_STATUS.PUBLISHED && (
                  <button
                    type="button"
                    className="nt-btn nt-btn-danger"
                    disabled={!canDraft}
                    onClick={() => submit(NOTICE_STATUS.CLOSED)}
                  >
                    게시 종료
                  </button>
                )}
                <button
                  type="button"
                  className="nt-btn nt-btn-primary"
                  disabled={!canPublish}
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
                {selected.attachments.map((a) =>
                  isImage(a) ? (
                    <img key={a.id} className="nt-view-image" src={a.url} alt={a.name} />
                  ) : null,
                )}
                {selected.attachments.some((a) => !isImage(a)) && (
                  <ul className="nt-files nt-files-view">
                    {selected.attachments
                      .filter((a) => !isImage(a))
                      .map((a) => (
                        <li key={a.id}>
                          <Icon name="image" />
                          <span className="nt-file-name">{a.name}</span>
                          <span className="nt-file-size">{formatFileSize(a.size)}</span>
                          <a className="om-chip" href={a.url} download={a.name}>
                            다운로드
                          </a>
                        </li>
                      ))}
                  </ul>
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
                    onClick={() => closeNotice(selected.id)}
                  >
                    게시 종료
                  </button>
                )}
                {selected.status === NOTICE_STATUS.CLOSED && (
                  <button
                    type="button"
                    className="nt-btn nt-btn-outline"
                    onClick={() => reopenNotice(selected.id)}
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
                onClick={() => {
                  deleteNotice(selected.id)
                  setSelectedId(null)
                  setDeleteOpen(false)
                }}
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
