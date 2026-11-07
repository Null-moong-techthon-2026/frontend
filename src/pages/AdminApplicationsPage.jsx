import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { decideOpening, listAdminOpenings } from '../api/eventApi'
import boothLogo from '../assets/booth-logo.png'
import Toast from '../components/Toast'
import { apiErrorMessage } from '../constants/errors'
import { ORG_TYPE_LABEL } from '../constants/eventOpening'
import { useAuth } from '../context/useAuth'
import { ROLE } from '../utils/role'
import { useToast } from '../utils/useToast'
import './admin.css'

const STATUS_LABEL = { PENDING: '대기 중', APPROVED: '승인', REJECTED: '반려' }
const TABS = [
  ['PENDING', '대기 중'],
  ['APPROVED', '승인'],
  ['REJECTED', '반려'],
  ['', '전체'],
]
const day = (iso) => (iso ? iso.slice(0, 10).replaceAll('-', '.') : '-')
const dateTime = (iso) => (iso ? `${day(iso)} ${new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : '-')

// 행사 개설 신청 심사: the 부스럭 team approves or rejects what organizers applied for. Only for an
// ADMIN account (an ordinary account the team switches to ADMIN in the database); the page lives at
// /admin/applications and is not linked from anywhere else.
export default function AdminApplicationsPage() {
  const { user, logout } = useAuth()
  const { toast, notify } = useToast()
  const [tab, setTab] = useState('PENDING')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(null) // 'APPROVED' | 'REJECTED' while the confirmation is open
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)

  const isAdmin = user.role === ROLE.ADMIN

  useEffect(() => {
    if (!isAdmin) return undefined // other accounts are sent away below; do not call the admin API for them
    let alive = true
    listAdminOpenings({ status: tab, page: 0, size: 100 })
      .then((page) => alive && (setRows(page.content), setError(null)))
      .catch((err) => alive && (setRows(null), setError(err)))
    return () => {
      alive = false
    }
  }, [tab, version, isAdmin])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  if (!isAdmin) return <Navigate to="/" replace />

  const selected = rows?.find((r) => r.id === selectedId) ?? null
  const pending = selected?.status === 'PENDING'

  const decide = async (decision) => {
    if (!selected || busy) return
    if (decision === 'REJECTED' && !reason.trim()) {
      notify('반려 사유를 입력해 주세요.', 'error')
      setConfirm(null)
      return
    }
    setBusy(true)
    try {
      await decideOpening(selected.id, {
        decision,
        revision: selected.revision,
        ...(decision === 'REJECTED' ? { rejectionReason: reason.trim() } : {}),
      })
      notify(decision === 'APPROVED' ? '승인했어요. 신청자의 행사가 열렸어요.' : '반려했어요.')
      setConfirm(null)
      setReason('')
      setSelectedId(null)
      reload()
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ad">
      <header className="ad-header">
        <span className="ad-brand">
          <img src={boothLogo} alt="" />
          <span>부스럭 관리자</span>
        </span>
        <span className="ad-user">
          {user.nickname}
          <button type="button" className="ad-link" onClick={logout}>
            로그아웃
          </button>
        </span>
      </header>

      <main className="ad-main">
        <h1>행사 개설 심사</h1>
        <p className="ad-lead">주최자가 낸 신청을 확인하고 승인하거나 반려해요. 승인하면 그 자리에서 단체와 행사가 만들어져요.</p>

        <div className="ad-tabs" role="tablist">
          {TABS.map(([key, label]) => (
            <button key={label} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-on' : ''} onClick={() => { setTab(key); setSelectedId(null) }}>
              {label}
            </button>
          ))}
        </div>

        <div className="ad-grid">
          <section className="ad-card">
            {error ? (
              <p className="ad-empty">
                {error.status === 403 ? '관리자 권한이 없는 계정이에요.' : apiErrorMessage(error)}
              </p>
            ) : !rows ? (
              <p className="ad-empty">불러오는 중…</p>
            ) : rows.length === 0 ? (
              <p className="ad-empty">신청이 없어요.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>행사</th>
                    <th>단체</th>
                    <th>신청일</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.id === selectedId ? 'is-selected' : ''} onClick={() => { setSelectedId(r.id); setReason('') }}>
                      <td>
                        <strong>{r.eventName}</strong>
                      </td>
                      <td>{r.orgName}</td>
                      <td>{day(r.createdAt)}</td>
                      <td>
                        <span className={`ad-chip is-${String(r.status).toLowerCase()}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <aside className="ad-card">
            {!selected ? (
              <p className="ad-empty">목록에서 신청을 고르면 내용이 보여요.</p>
            ) : (
              <>
                <h2>{selected.eventName}</h2>
                <span className={`ad-chip is-${String(selected.status).toLowerCase()}`}>{STATUS_LABEL[selected.status] ?? selected.status}</span>
                <dl>
                  <dt>단체</dt>
                  <dd>
                    {selected.orgName} · {ORG_TYPE_LABEL[selected.orgType] ?? selected.orgType}
                  </dd>
                  <dt>행사 기간</dt>
                  <dd>
                    {day(selected.startsAt)} ~ {day(selected.endsAt)}
                  </dd>
                  <dt>장소</dt>
                  <dd>{selected.venue}</dd>
                  <dt>신청자</dt>
                  <dd>{selected.applicant?.nickname ?? selected.applicantAccountId}</dd>
                  {selected.applicant?.email && (
                    <>
                      <dt>이메일</dt>
                      <dd>{selected.applicant.email}</dd>
                    </>
                  )}
                  {selected.applicant?.phoneNumber && (
                    <>
                      <dt>연락처</dt>
                      <dd>{selected.applicant.phoneNumber}</dd>
                    </>
                  )}
                  <dt>접수</dt>
                  <dd>{dateTime(selected.createdAt)}</dd>
                  {selected.reviewedAt && (
                    <>
                      <dt>처리</dt>
                      <dd>{dateTime(selected.reviewedAt)}</dd>
                    </>
                  )}
                  {selected.rejectionReason && (
                    <>
                      <dt>반려 사유</dt>
                      <dd>{selected.rejectionReason}</dd>
                    </>
                  )}
                </dl>
                {pending && (
                  <>
                    <label className="ad-reason">
                      반려 사유 (반려할 때만)
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} placeholder="신청자에게 전달할 사유를 입력하세요." />
                    </label>
                    <div className="ad-actions">
                      <button type="button" className="ad-btn is-danger" disabled={busy} onClick={() => (reason.trim() ? setConfirm('REJECTED') : notify('반려 사유를 입력해 주세요.', 'error'))}>
                        반려하기
                      </button>
                      <button type="button" className="ad-btn is-primary" disabled={busy} onClick={() => setConfirm('APPROVED')}>
                        승인하기
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </aside>
        </div>
      </main>

      {confirm && (
        <div className="ad-modal" role="dialog" aria-modal="true" onClick={() => setConfirm(null)}>
          <div className="ad-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{confirm === 'APPROVED' ? '이 신청을 승인할까요?' : '이 신청을 반려할까요?'}</h3>
            <p>
              {confirm === 'APPROVED'
                ? '승인하면 단체와 행사가 만들어지고, 한번 처리한 결정은 바꿀 수 없어요.'
                : '입력한 반려 사유가 신청자에게 전달돼요. 한번 처리한 결정은 바꿀 수 없어요.'}
            </p>
            <div className="ad-actions">
              <button type="button" className="ad-btn" onClick={() => setConfirm(null)}>
                취소
              </button>
              <button type="button" className={`ad-btn ${confirm === 'APPROVED' ? 'is-primary' : 'is-danger'}`} disabled={busy} onClick={() => decide(confirm)}>
                {confirm === 'APPROVED' ? '승인' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
