import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { decideEventApplication, listEventApplicationsForAdmin } from '../api/eventApplicationApi'
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABEL,
  EVENT_KIND_LABEL,
  ORG_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_PLAN_INFO,
  RECEIPT_TYPE_LABEL,
} from '../constants/eventApplication'
import { apiErrorMessage } from '../constants/errors'
import { useAuth } from '../context/useAuth'
import './admin.css'

// Administrator screen: review the event-opening applications. Only accounts whose platformRole is
// ADMIN (from /api/me; set by hand in the database) can use it - the backend refuses everyone else
// with 403, this page just tells them so instead of showing an error.
// Approving opens the event for the applicant (organization + draft event) in the same step.

const PAGE_SIZE = 20
const FILTERS = [
  ['all', '전체'],
  [APPLICATION_STATUS.PENDING, '검토 중'],
  [APPLICATION_STATUS.APPROVED, '승인'],
  [APPLICATION_STATUS.REJECTED, '반려'],
]

const longDateTime = (iso) => {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function Row({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </>
  )
}

export default function AdminApplicationsPage() {
  const navigate = useNavigate()
  const { user, ready } = useAuth()
  // TEMPORARY: the admin role check is off - any logged-in user may open this page.
  const isAdmin = !!user

  const [filter, setFilter] = useState(APPLICATION_STATUS.PENDING)
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null) // { content, totalElements, totalPages, summary }
  const [loadError, setLoadError] = useState('')
  const [version, setVersion] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // The application just decided: it leaves the 검토 중 list, but its result stays on the right.
  const [decided, setDecided] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    let alive = true
    listEventApplicationsForAdmin({ status: filter === 'all' ? '' : filter, page, size: PAGE_SIZE })
      .then((result) => {
        if (!alive) return
        setData(result)
        setLoadError('')
      })
      .catch((err) => alive && setLoadError(apiErrorMessage(err)))
    return () => {
      alive = false
    }
  }, [isAdmin, filter, page, version])

  if (!ready) return null
  if (!user) {
    return (
      <div className="ad ad-center">
        <p>로그인이 필요해요.</p>
        <button type="button" onClick={() => navigate('/login', { state: { from: '/admin/applications' } })}>
          로그인
        </button>
      </div>
    )
  }
  if (!isAdmin) {
    return (
      <div className="ad ad-center">
        <p>이 페이지는 관리자만 볼 수 있어요.</p>
        <button type="button" onClick={() => navigate('/')}>
          처음으로
        </button>
      </div>
    )
  }

  const list = data?.content ?? []
  const summary = data?.summary
  const selected = list.find((a) => a.id === selectedId) ?? (decided?.id === selectedId ? decided : null)
  const pageCount = Math.max(1, data?.totalPages ?? 1)

  const select = (id) => {
    setSelectedId(id)
    setReason('')
    setError('')
  }

  const decide = async (decision) => {
    if (busy) return
    if (decision === 'REJECTED' && !reason.trim()) {
      setError('반려 사유를 적어 주세요. 신청자에게 보여요.')
      return
    }
    if (
      decision === 'APPROVED' &&
      !window.confirm('승인하면 신청자의 단체와 행사가 바로 만들어져요. 승인할까요?')
    ) {
      return
    }
    setBusy(true)
    try {
      const result = await decideEventApplication(selected.id, {
        revision: selected.revision,
        decision,
        ...(decision === 'REJECTED' ? { rejectionReason: reason.trim() } : {}),
      })
      setError('')
      setDecided(result)
      setVersion((v) => v + 1)
    } catch (err) {
      setError(apiErrorMessage(err))
      setVersion((v) => v + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ad">
      <header className="ad-head">
        <div>
          <h1>행사 개설 신청 검토</h1>
          <p>
            전체 {summary?.total ?? 0}건 · 검토 중 <b>{summary?.pending ?? 0}</b>건 · 승인 {summary?.approved ?? 0}건 · 반려{' '}
            {summary?.rejected ?? 0}건
          </p>
        </div>
        <div className="ad-head-actions">
          <button type="button" onClick={() => setVersion((v) => v + 1)}>
            새로고침
          </button>
          <button type="button" onClick={() => navigate('/')}>
            나가기
          </button>
        </div>
      </header>

      <div className="ad-filters" role="tablist" aria-label="상태">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={filter === key ? 'is-active' : ''}
            onClick={() => {
              setFilter(key)
              setPage(0)
              setSelectedId(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ad-grid">
        <section className="ad-list">
          <table>
            <thead>
              <tr>
                <th>접수일</th>
                <th>행사명</th>
                <th>조직</th>
                <th>부스</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className={a.id === selectedId ? 'is-selected' : ''} onClick={() => select(a.id)}>
                  <td>{longDateTime(a.submittedAt)}</td>
                  <td className="ad-strong">{a.eventName}</td>
                  <td>{a.orgName}</td>
                  <td>{a.boothCount}</td>
                  <td>
                    <span className={`ad-chip is-${a.status.toLowerCase()}`}>{APPLICATION_STATUS_LABEL[a.status]}</span>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="ad-empty">
                    {loadError || (data === null ? '불러오는 중…' : '해당하는 신청이 없어요.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pageCount > 1 && (
            <div className="ad-pager">
              <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
                ‹
              </button>
              <span>
                {page + 1} / {pageCount}
              </span>
              <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>
                ›
              </button>
            </div>
          )}
        </section>

        <section className="ad-detail">
          {selected ? (
            <>
              <div className="ad-detail-head">
                <h2>{selected.eventName}</h2>
                <span className={`ad-chip is-${selected.status.toLowerCase()}`}>
                  {APPLICATION_STATUS_LABEL[selected.status]}
                </span>
              </div>
              <p className="ad-sub">
                신청 계정 {selected.applicantNickname} · {longDateTime(selected.submittedAt)} 접수
              </p>

              <h3>조직</h3>
              <dl>
                <Row label="조직명">{selected.orgName}</Row>
                <Row label="유형">{ORG_TYPE_LABEL[selected.orgType]}</Row>
                <Row label="공식 이메일">{selected.orgEmail}</Row>
                <Row label="사업자 등록번호">{selected.businessNumber}</Row>
                <Row label="소속 학교·기관">{selected.affiliation}</Row>
                <Row label="대표자">{selected.representative}</Row>
                <Row label="웹사이트·SNS">{selected.website}</Row>
              </dl>

              <h3>담당자</h3>
              <dl>
                <Row label="이름">{selected.contactName}</Row>
                <Row label="직책·역할">{selected.contactRole}</Row>
                <Row label="이메일">{selected.contactEmail}</Row>
                <Row label="휴대폰">{selected.contactPhone}</Row>
              </dl>

              <h3>행사</h3>
              <dl>
                <Row label="유형">{EVENT_KIND_LABEL[selected.eventKind]}</Row>
                <Row label="기간">
                  {selected.startDate} ~ {selected.endDate}
                </Row>
                <Row label="장소">{selected.venue}</Row>
                <Row label="예상 부스 수">{selected.boothCount}</Row>
                <Row label="인수인계 시스템">{selected.handover ? '함께 신청' : '신청 안 함'}</Row>
              </dl>

              <h3>요금 · 결제</h3>
              <dl>
                <Row label="결제 방식">{PAYMENT_PLAN_INFO[selected.paymentPlan]?.title}</Row>
                <Row label="결제 수단">{PAYMENT_METHOD_LABEL[selected.paymentMethod]}</Row>
                <Row label="증빙">{RECEIPT_TYPE_LABEL[selected.receiptType]}</Row>
                <Row label="동의">{selected.agreements.length}개 항목 모두 동의</Row>
              </dl>

              {selected.status === APPLICATION_STATUS.PENDING ? (
                <div className="ad-decide">
                  <label htmlFor="ad-reason">반려 사유 (반려할 때만, 신청자에게 보여요)</label>
                  <textarea
                    id="ad-reason"
                    value={reason}
                    maxLength={500}
                    onChange={(e) => {
                      setReason(e.target.value)
                      setError('')
                    }}
                  />
                  {error && <p className="ad-error">{error}</p>}
                  <div>
                    <button type="button" className="is-reject" disabled={busy} onClick={() => decide('REJECTED')}>
                      반려
                    </button>
                    <button type="button" className="is-approve" disabled={busy} onClick={() => decide('APPROVED')}>
                      승인 · 행사 열기
                    </button>
                  </div>
                </div>
              ) : (
                <p className="ad-done">
                  {longDateTime(selected.reviewedAt)}에 {APPLICATION_STATUS_LABEL[selected.status]}했어요.
                  {selected.rejectionReason && ` 사유: ${selected.rejectionReason}`}
                  {selected.status === APPLICATION_STATUS.APPROVED && ' 신청자의 행사가 열렸어요.'}
                </p>
              )}
            </>
          ) : (
            <p className="ad-empty">왼쪽에서 신청을 고르면 내용이 보여요.</p>
          )}
        </section>
      </div>
    </div>
  )
}
