import { useState } from 'react'
import {
  BOOTH_CATEGORY_LABEL,
  BOOTH_STATUS,
  BOOTH_STATUS_LABEL,
} from '../constants/booth'
import { useBooths } from '../context/useBooths'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import './booth-manage.css'

const PAGE_SIZE = 7
const CATEGORIES = Object.keys(BOOTH_CATEGORY_LABEL)
const STATUSES = Object.values(BOOTH_STATUS)
const SORTS = [
  { key: 'latest', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
  { key: 'name', label: '부스명순' },
]

const shortDate = (d) => d.slice(5).replace('-', '.')
const longDate = (d) => d.replaceAll('-', '.')
const STATUS_CLASS = {
  [BOOTH_STATUS.PENDING]: 'is-review',
  [BOOTH_STATUS.APPROVED]: 'is-approved',
  [BOOTH_STATUS.REJECTED]: 'is-rejected',
}

function StatusChip({ status }) {
  return <span className={`bm-chip ${STATUS_CLASS[status]}`}>{BOOTH_STATUS_LABEL[status]}</span>
}

function Select({ value, onChange, children }) {
  return (
    <label className="bm-select">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <Icon name="chevron" />
    </label>
  )
}

export default function BoothManagePage() {
  const { booths: rows, setStatus, editNotes } = useBooths()
  const [selectedId, setSelectedId] = useState(1)
  const [tab, setTab] = useState('info')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [copied, setCopied] = useState(false)

  const count = (s) => rows.filter((r) => r.status === s).length

  const filtered = rows
    .filter((r) => r.name.includes(query.trim()))
    .filter((r) => category === 'all' || r.category === category)
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ko')
      const d = a.appliedAt.localeCompare(b.appliedAt)
      return sort === 'oldest' ? d : -d
    })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)
  const selected = rows.find((r) => r.id === selectedId) ?? null

  const resetPage = (fn) => (v) => {
    fn(v)
    setPage(1)
  }

  // Pressing the active decision again undoes it; no decision means pending (검토 중).
  const toggleStatus = (row, next) =>
    setStatus(row.id, row.status === next ? BOOTH_STATUS.PENDING : next)

  const copyInvite = async () => {
    try {
      // TODO(backend): use the invite link issued by the server for this event.
      await navigator.clipboard.writeText(`${window.location.origin}/signup/booth`)
    } catch {
      // Clipboard can be blocked; the button still confirms so the flow is visible.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
          <button type="button" className="om-btn om-btn-primary">
            + 부스 직접 등록
          </button>
        </>
      }
    >
      <div className="bm-stats">
        <div className="bm-stat">
          <span>전체 신청</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="bm-stat">
          <span>검토 중</span>
          <strong>{count(BOOTH_STATUS.PENDING)}</strong>
        </div>
        <div className="bm-stat">
          <span>승인</span>
          <strong className="is-approved">{count(BOOTH_STATUS.APPROVED)}</strong>
        </div>
        <div className="bm-stat">
          <span>반려</span>
          <strong className="is-rejected">{count(BOOTH_STATUS.REJECTED)}</strong>
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
            <Select value={sort} onChange={setSort}>
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
                {pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className={r.id === selectedId ? 'is-selected' : ''}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td className="bm-name">{r.name}</td>
                    <td>{shortDate(r.appliedAt)}</td>
                    <td>{BOOTH_CATEGORY_LABEL[r.category]}</td>
                    <td>{r.applicant.name}</td>
                    <td>
                      <StatusChip status={r.status} />
                    </td>
                    <td>{r.boothNo ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="bm-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(r.id)
                          setTab('info')
                        }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr className="bm-empty">
                    <td colSpan={7}>조건에 맞는 신청이 없어요.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bm-pager">
            <span className="bm-count">
              {filtered.length === 0
                ? `총 0개`
                : `총 ${filtered.length}개 중 ${start + 1}–${start + pageRows.length}개`}
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
            승인된 부스는 지도 배치 후 부스 번호가 부여됩니다.
          </p>
        </section>

        <section className="om-panel bm-detail">
          {selected ? (
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

              <div className="bm-detail-body">
                <div className="bm-title-row">
                  <h3>{selected.name}</h3>
                  <StatusChip status={selected.status} />
                </div>
                <p className="bm-applied">신청일 {longDate(selected.appliedAt)}</p>

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
                      <dd>{BOOTH_CATEGORY_LABEL[selected.category]}</dd>
                      <dt>운영 소개</dt>
                      <dd>{selected.intro}</dd>
                      <dt>부스 번호</dt>
                      <dd>{selected.boothNo ?? '지도 배치 후 부여'}</dd>
                    </dl>

                    <h4>신청자 정보</h4>
                    <dl className="bm-dl">
                      <dt>이름</dt>
                      <dd>{selected.applicant.name}</dd>
                      <dt>연락처</dt>
                      <dd>{selected.applicant.phone}</dd>
                      <dt>이메일</dt>
                      <dd>{selected.applicant.email}</dd>
                    </dl>
                  </>
                )}

                <h4>제출 서류</h4>
                <ul className="bm-docs">
                  {selected.documents.map((d) => (
                    <li key={d.id}>
                      <Icon name="image" />
                      <span>{d.name}</span>
                      <button type="button" className="bm-view">
                        보기
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="bm-notes">
                  <div>
                    <div className="bm-notes-head">
                      <h4>검토 메모</h4>
                      <span className="bm-tag">주최사 전용</span>
                    </div>
                    <textarea
                      placeholder="주최사 내부 검토 내용을 입력하세요."
                      value={selected.reviewMemo}
                      onChange={(e) => editNotes(selected.id, { reviewMemo: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="bm-notes-head">
                      <h4>반려 사유</h4>
                      <span className="bm-tag is-public">주최사·운영자 공개</span>
                    </div>
                    <textarea
                      placeholder="부스 운영자에게 전달할 사유를 입력하세요."
                      value={selected.rejectReason}
                      onChange={(e) => editNotes(selected.id, { rejectReason: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bm-actions">
                <button
                  type="button"
                  className={`bm-btn bm-btn-reject${selected.status === BOOTH_STATUS.REJECTED ? ' is-on' : ''}`}
                  aria-pressed={selected.status === BOOTH_STATUS.REJECTED}
                  onClick={() => toggleStatus(selected, BOOTH_STATUS.REJECTED)}
                >
                  {selected.status === BOOTH_STATUS.REJECTED && '✓ '}반려하기
                </button>
                <button
                  type="button"
                  className={`bm-btn bm-btn-approve${selected.status === BOOTH_STATUS.APPROVED ? ' is-on' : ''}`}
                  aria-pressed={selected.status === BOOTH_STATUS.APPROVED}
                  onClick={() => toggleStatus(selected, BOOTH_STATUS.APPROVED)}
                >
                  {selected.status === BOOTH_STATUS.APPROVED && '✓ '}승인하기
                </button>
              </div>
              <p className="bm-actions-hint">같은 버튼을 다시 누르면 취소되어 검토 중으로 돌아가요.</p>
            </>
          ) : (
            <div className="bm-detail-empty">
              <Icon name="store" />
              <p>목록에서 신청을 선택하면 상세 정보가 보여요.</p>
            </div>
          )}
        </section>
      </div>
    </OrganizerLayout>
  )
}
