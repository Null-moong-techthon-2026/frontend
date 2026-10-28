import { useEffect, useState } from 'react'
import * as boothApi from '../api/boothApi'
import {
  BOOTH_CATEGORY,
  BOOTH_CATEGORY_LABEL,
  BOOTH_CODE_MAX,
  BOOTH_NAME_MAX,
  BOOTH_STATUS,
  BOOTH_STATUS_LABEL,
  DOCUMENT_CHECK_LABEL,
} from '../constants/booth'
import { apiErrorMessage } from '../constants/errors'
import { useBooths } from '../context/useBooths'
import { useEvent } from '../context/useEvent'
import { useInvitation } from '../context/useInvitation'
import { instantToLocalDate } from '../utils/date'
import { useToast } from '../utils/useToast'
import MenuSelect from '../components/MenuSelect'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Select from '../components/Select'
import Toast from '../components/Toast'
import '../components/event-edit-modal.css'
import './booth-manage.css'

const PAGE_SIZE = 7
const CATEGORIES = Object.keys(BOOTH_CATEGORY_LABEL)
const STATUSES = Object.values(BOOTH_STATUS)
const SORTS = [
  { key: 'submittedAt,desc', label: '최신순' },
  { key: 'submittedAt,asc', label: '오래된순' },
]
const DOCUMENT_OPTIONS = Object.entries(DOCUMENT_CHECK_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const shortDate = (instant) => instantToLocalDate(instant).slice(5).replace('-', '.')
const longDate = (instant) => instantToLocalDate(instant).replaceAll('-', '.')
const STATUS_CLASS = {
  [BOOTH_STATUS.PENDING]: 'is-review',
  [BOOTH_STATUS.APPROVED]: 'is-approved',
  [BOOTH_STATUS.REJECTED]: 'is-rejected',
}

function StatusChip({ status }) {
  return <span className={`bm-chip ${STATUS_CLASS[status]}`}>{BOOTH_STATUS_LABEL[status]}</span>
}

// Dialog for registering a booth by hand (a booth that did not apply, e.g. an information desk).
function BoothCreateModal({ onCreate, onClose }) {
  const [form, setForm] = useState({
    name: '',
    categoryCode: BOOTH_CATEGORY.OTHER,
    description: '',
    boothCode: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const patch = (fields) => {
    setForm((f) => ({ ...f, ...fields }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!form.name.trim()) return setError('부스 이름을 입력해 주세요.')
    const boothCode = form.boothCode.trim().toUpperCase()
    setSubmitting(true)
    try {
      await onCreate({
        name: form.name.trim(),
        categoryCode: form.categoryCode,
        description: form.description.trim(),
        ...(boothCode ? { boothCode } : {}),
      })
    } catch (err) {
      setError(apiErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="om-confirm-overlay" onClick={onClose}>
      <form
        className="ee-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bm-create-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="bm-create-title">부스 직접 등록</h2>

        <label className="ee-field">
          <span>부스 이름</span>
          <input
            value={form.name}
            maxLength={BOOTH_NAME_MAX}
            autoFocus
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>

        <div className="ee-field">
          <span>카테고리</span>
          <Select value={form.categoryCode} onChange={(categoryCode) => patch({ categoryCode })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {BOOTH_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </div>

        <label className="ee-field">
          <span>소개 (선택)</span>
          <textarea
            value={form.description}
            maxLength={300}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </label>

        <label className="ee-field">
          <span>부스 번호 (선택)</span>
          <input
            value={form.boothCode}
            maxLength={BOOTH_CODE_MAX}
            placeholder="비워 두면 B001처럼 자동으로 정해져요"
            onChange={(e) => patch({ boothCode: e.target.value })}
          />
        </label>

        <p className="ee-hint">직접 등록한 부스는 신청 목록에 나타나지 않고, 실시간 운영 현황에서 볼 수 있어요.</p>
        {error && <p className="ee-error">{error}</p>}

        <div className="ee-actions">
          <button type="button" className="om-btn om-btn-outline" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="om-btn om-btn-primary" disabled={submitting}>
            {submitting ? '등록 중…' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function BoothManagePage() {
  const { event } = useEvent()
  const { summary, refreshSummary } = useBooths()
  const { invitation, issued, issue } = useInvitation()
  const { toast, notify } = useToast()
  const eventId = event.id

  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('info')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState(SORTS[0].key)
  const [page, setPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // null | 'APPROVED' | 'REJECTED'
  const [busy, setBusy] = useState(false)

  const [list, setList] = useState(null) // null until the first load; { content, totalElements, totalPages }
  const [listError, setListError] = useState('')
  const [listVersion, setListVersion] = useState(0) // bump to load the list again

  const [detail, setDetail] = useState(null) // { id, data } — the application detail last loaded
  const [detailVersion, setDetailVersion] = useState(0)
  const [reviewNote, setReviewNote] = useState('') // editable copies of the detail's notes
  const [rejectionReason, setRejectionReason] = useState('')

  // Search text is sent to the server after a short pause, not on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let alive = true
    boothApi
      .listApplications(eventId, {
        page: page - 1,
        size: PAGE_SIZE,
        q: debouncedQuery,
        categoryCode: category === 'all' ? '' : category,
        reviewStatus: statusFilter === 'all' ? '' : statusFilter,
        sort,
      })
      .then((result) => {
        if (!alive) return
        setList(result)
        setListError('')
      })
      .catch((err) => alive && setListError(apiErrorMessage(err)))
    return () => {
      alive = false
    }
  }, [eventId, page, debouncedQuery, category, statusFilter, sort, listVersion])

  useEffect(() => {
    if (!selectedId) return
    let alive = true
    boothApi
      .getApplication(eventId, selectedId)
      .then((data) => {
        if (!alive) return
        setDetail({ id: selectedId, data })
        setReviewNote(data.reviewNote ?? '')
        setRejectionReason(data.rejectionReason ?? '')
      })
      .catch((err) => alive && notify(apiErrorMessage(err), 'error'))
    return () => {
      alive = false
    }
  }, [eventId, selectedId, detailVersion, notify])

  const rows = list?.content ?? []
  const total = list?.totalElements ?? 0
  const pageCount = Math.max(1, list?.totalPages ?? 1)
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const selected = detail?.id === selectedId ? detail.data : null
  const pending = selected?.reviewStatus === BOOTH_STATUS.PENDING

  const resetPage = (fn) => (v) => {
    fn(v)
    setPage(1)
  }

  // After any change: reload the list, the counts and the open application.
  const refreshAll = () => {
    setListVersion((v) => v + 1)
    setDetailVersion((v) => v + 1)
    refreshSummary()
  }

  const select = (id) => {
    setSelectedId(id)
    setTab('info')
  }

  // Document state changes right away; the backend keeps a revision per document check.
  const checkDocument = async (document, checkStatus) => {
    if (busy || checkStatus === document.checkStatus) return
    setBusy(true)
    try {
      await boothApi.checkDocument(eventId, selected.applicationId, document.requirementId, {
        revision: document.revision,
        checkStatus,
      })
      setDetailVersion((v) => v + 1)
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setDetailVersion((v) => v + 1)
    } finally {
      setBusy(false)
    }
  }

  // The internal memo is saved when the field loses focus (only if it changed).
  const saveReviewNote = async () => {
    if (!selected || reviewNote === (selected.reviewNote ?? '')) return
    try {
      const saved = await boothApi.saveReviewNote(eventId, selected.applicationId, selected.revision, reviewNote)
      setDetail((d) => ({ ...d, data: { ...d.data, reviewNote, revision: saved.revision } }))
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      if (err.code === 'REVISION_CONFLICT') setDetailVersion((v) => v + 1)
    }
  }

  const askDecision = (decision) => {
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      notify('반려 사유를 입력해 주세요. 부스 운영자에게 전달돼요.', 'error')
      return
    }
    setConfirm(decision)
  }

  const decide = async () => {
    const decision = confirm
    setConfirm(null)
    if (busy || !decision) return
    setBusy(true)
    try {
      const result = await boothApi.decideApplication(eventId, selected.applicationId, {
        revision: selected.revision,
        decision,
        reviewNote,
        ...(decision === 'REJECTED' ? { rejectionReason: rejectionReason.trim() } : {}),
      })
      notify(
        decision === 'APPROVED'
          ? `승인했어요. 부스 번호는 ${result.boothCode}예요.`
          : '반려했어요.',
      )
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
    } finally {
      setBusy(false)
      refreshAll()
    }
  }

  // The code is readable only when it is issued, so a copy without a fresh code issues a new one
  // (which ends the previous one).
  const copyInvite = async () => {
    try {
      let url = issued?.inviteUrl
      if (!url) {
        if (
          invitation?.active &&
          !window.confirm(
            '초대 코드는 발급할 때만 확인할 수 있어요. 새로 발급하면 이전 초대 링크는 사용할 수 없게 돼요. 새로 발급할까요?',
          )
        ) {
          return
        }
        url = (await issue()).inviteUrl
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      notify(
        err.message === 'NO_DEADLINE'
          ? '부스 모집에서 모집 마감일을 저장하고 공고를 공개해야 초대 링크를 만들 수 있어요.'
          : err.code === 'RECRUITMENT_CLOSED'
            ? '부스 모집 공고를 공개한 뒤에 초대 링크를 만들 수 있어요.'
            : apiErrorMessage(err),
        'error',
      )
    }
  }

  const createBooth = async (fields) => {
    const booth = await boothApi.createBooth(eventId, fields)
    setCreateOpen(false)
    notify(`부스를 등록했어요. 부스 번호는 ${booth.boothCode}예요.`)
  }

  return (
    <OrganizerLayout
      active="booths"
      crumb="부스 관리"
      title="부스 관리"
      subtitle="신청 정보를 확인하고 부스의 승인 여부를 관리하세요."
      actions={
        <>
          <button type="button" className="om-btn om-btn-outline" onClick={copyInvite}>
            {copied ? '복사됨' : '초대 링크 복사'}
          </button>
          <button type="button" className="om-btn om-btn-primary" onClick={() => setCreateOpen(true)}>
            + 부스 직접 등록
          </button>
        </>
      }
    >
      <div className="bm-stats">
        <div className="bm-stat">
          <span>전체 신청</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="bm-stat">
          <span>검토 중</span>
          <strong>{summary.pending}</strong>
        </div>
        <div className="bm-stat">
          <span>승인</span>
          <strong className="is-approved">{summary.approved}</strong>
        </div>
        <div className="bm-stat">
          <span>반려</span>
          <strong className="is-rejected">{summary.rejected}</strong>
        </div>
      </div>

      <div className="bm-grid">
        <section className="om-panel bm-list-panel">
          <h2 className="om-panel-title">부스 신청 목록</h2>

          <div className="bm-filters">
            <label className="om-search bm-search">
              <Icon name="search" />
              <input
                placeholder="부스명 검색"
                value={query}
                onChange={(e) => resetPage(setQuery)(e.target.value)}
              />
            </label>
            <Select value={category} onChange={resetPage(setCategory)}>
              <option value="all">전체 카테고리</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {BOOTH_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={resetPage(setStatusFilter)}>
              <option value="all">전체 상태</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BOOTH_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <Select value={sort} onChange={resetPage(setSort)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="bm-table-wrap">
            <table className="bm-table">
              <thead>
                <tr>
                  <th>부스명</th>
                  <th>신청일</th>
                  <th>카테고리</th>
                  <th>신청자</th>
                  <th>상태</th>
                  <th>부스 번호</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.applicationId}
                    className={r.applicationId === selectedId ? 'is-selected' : ''}
                    onClick={() => select(r.applicationId)}
                  >
                    <td className="bm-name">{r.boothName}</td>
                    <td>{shortDate(r.submittedAt)}</td>
                    <td>{BOOTH_CATEGORY_LABEL[r.categoryCode] ?? r.categoryCode}</td>
                    <td>{r.applicantName}</td>
                    <td>
                      <StatusChip status={r.reviewStatus} />
                    </td>
                    <td>{r.boothCode ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="bm-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          select(r.applicationId)
                        }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="bm-empty">
                    <td colSpan={7}>
                      {listError ||
                        (list === null
                          ? '불러오는 중…'
                          : summary.total === 0
                            ? '아직 들어온 신청이 없어요.'
                            : '조건에 맞는 신청이 없어요.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bm-pager">
            <span className="bm-count">
              {total === 0
                ? `총 0개`
                : `총 ${total}개 중 ${start + 1}–${start + rows.length}개`}
            </span>
            <div className="bm-pages">
              <button
                type="button"
                aria-label="이전"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n === current ? 'is-active' : ''}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="다음"
                disabled={current === pageCount}
                onClick={() => setPage(current + 1)}
              >
                ›
              </button>
            </div>
          </div>

          <p className="bm-note">
            <Icon name="info" />
            승인하면 부스 번호가 자동으로 부여됩니다. 직접 등록한 부스는 이 목록에 나타나지 않아요.
          </p>
        </section>

        <section className="om-panel bm-detail">
          {selectedId ? (
            <>
              <div className="bm-detail-head">
                <h2 className="om-panel-title">신청 상세</h2>
                <button
                  type="button"
                  className="bm-close"
                  aria-label="닫기"
                  onClick={() => setSelectedId(null)}
                >
                  ×
                </button>
              </div>

              {selected ? (
                <>
                  <div className="bm-detail-body">
                    <div className="bm-title-row">
                      <h3>{selected.booth.name}</h3>
                      <StatusChip status={selected.reviewStatus} />
                    </div>
                    <p className="bm-applied">신청일 {longDate(selected.submittedAt)}</p>

                    <div className="bm-tabs">
                      <button
                        type="button"
                        className={tab === 'info' ? 'is-active' : ''}
                        onClick={() => setTab('info')}
                      >
                        신청 정보
                      </button>
                      <button
                        type="button"
                        className={tab === 'docs' ? 'is-active' : ''}
                        onClick={() => setTab('docs')}
                      >
                        제출 서류
                      </button>
                    </div>

                    {tab === 'info' && (
                      <>
                        <h4>부스 정보</h4>
                        <dl className="bm-dl">
                          <dt>카테고리</dt>
                          <dd>{BOOTH_CATEGORY_LABEL[selected.booth.categoryCode] ?? selected.booth.categoryCode}</dd>
                          <dt>운영 소개</dt>
                          <dd>{selected.booth.introduction || '—'}</dd>
                          <dt>부스 번호</dt>
                          <dd>{selected.boothCode ?? '승인하면 부여'}</dd>
                        </dl>

                        <h4>신청자 정보</h4>
                        <dl className="bm-dl">
                          <dt>이름</dt>
                          <dd>{selected.applicant.name}</dd>
                          <dt>연락처</dt>
                          <dd>{selected.applicant.phoneNumber}</dd>
                          <dt>이메일</dt>
                          <dd>{selected.applicant.email}</dd>
                        </dl>
                      </>
                    )}

                    <h4>제출 서류</h4>
                    <ul className="bm-docs">
                      {selected.documents.map((d) => (
                        <li key={d.requirementId}>
                          <Icon name="image" />
                          <span>
                            {d.name}
                            {d.isRequired ? ' (필수)' : ''}
                          </span>
                          <MenuSelect
                            value={d.checkStatus}
                            options={DOCUMENT_OPTIONS}
                            disabled={!pending || busy}
                            ariaLabel={`${d.name} 확인 상태`}
                            onChange={(v) => checkDocument(d, v)}
                          />
                        </li>
                      ))}
                      {selected.documents.length === 0 && <li>요구한 서류가 없어요.</li>}
                    </ul>
                    <p className="bm-docs-note">
                      서류는 서비스 밖에서 받아 확인해요. 받은 서류의 상태만 기록하며, 필수 서류가 모두 '확인
                      완료'여야 승인할 수 있어요.
                    </p>

                    <div className="bm-notes">
                      <div>
                        <div className="bm-notes-head">
                          <h4>검토 메모</h4>
                          <span className="bm-tag">주최사 전용</span>
                        </div>
                        <textarea
                          placeholder="주최사 내부 검토 내용을 입력하세요."
                          maxLength={2000}
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          onBlur={saveReviewNote}
                        />
                      </div>
                      <div>
                        <div className="bm-notes-head">
                          <h4>반려 사유</h4>
                          <span className="bm-tag is-public">주최사·운영자 공개</span>
                        </div>
                        <textarea
                          placeholder="반려할 때 부스 운영자에게 전달할 사유를 입력하세요."
                          maxLength={2000}
                          value={rejectionReason}
                          readOnly={!pending}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {pending ? (
                    <>
                      <div className="bm-actions">
                        <button
                          type="button"
                          className="bm-btn bm-btn-reject"
                          disabled={busy}
                          onClick={() => askDecision('REJECTED')}
                        >
                          반려하기
                        </button>
                        <button
                          type="button"
                          className="bm-btn bm-btn-approve"
                          disabled={busy}
                          onClick={() => askDecision('APPROVED')}
                        >
                          승인하기
                        </button>
                      </div>
                      <p className="bm-actions-hint">승인이나 반려는 한 번 정하면 되돌릴 수 없어요.</p>
                    </>
                  ) : (
                    <p className="bm-actions-hint">
                      {selected.reviewStatus === BOOTH_STATUS.APPROVED
                        ? `승인된 신청이에요. 부스 번호 ${selected.boothCode ?? ''}`
                        : '반려된 신청이에요.'}{' '}
                      결정은 되돌릴 수 없어요.
                    </p>
                  )}
                </>
              ) : (
                <div className="bm-detail-empty">
                  <p>불러오는 중…</p>
                </div>
              )}
            </>
          ) : (
            <div className="bm-detail-empty">
              <Icon name="store" />
              <p>목록에서 신청을 선택하면 상세 정보가 보여요.</p>
            </div>
          )}
        </section>
      </div>

      {createOpen && <BoothCreateModal onCreate={createBooth} onClose={() => setCreateOpen(false)} />}

      {confirm && (
        <div className="om-confirm-overlay" onClick={() => setConfirm(null)}>
          <div
            className="om-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bm-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="bm-confirm-title">
              {confirm === 'APPROVED' ? '이 신청을 승인할까요?' : '이 신청을 반려할까요?'}
            </h2>
            <p>
              {confirm === 'APPROVED'
                ? '승인하면 부스가 만들어지고 부스 번호가 부여돼요. 이 결정은 되돌릴 수 없어요.'
                : '입력한 반려 사유가 부스 운영자에게 전달돼요. 이 결정은 되돌릴 수 없어요.'}
            </p>
            <div className="om-confirm-actions">
              <button type="button" className="om-btn om-btn-outline" onClick={() => setConfirm(null)}>
                취소
              </button>
              <button
                type="button"
                className={`om-btn ${confirm === 'APPROVED' ? 'om-btn-primary' : 'om-btn-danger'}`}
                onClick={decide}
              >
                {confirm === 'APPROVED' ? '승인' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </OrganizerLayout>
  )
}
