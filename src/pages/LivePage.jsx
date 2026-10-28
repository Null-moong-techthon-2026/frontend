import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as boothApi from '../api/boothApi'
import { getPublicMap } from '../api/mapApi'
import FloorMap from '../components/FloorMap'
import MenuSelect from '../components/MenuSelect'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Select from '../components/Select'
import Toast from '../components/Toast'
import {
  BOOTH_CATEGORY_LABEL,
  BOOTH_OPERATING_STATUS as OP,
  BOOTH_OPERATING_STATUS_LABEL,
  BOOTH_VISIBILITY,
  BOOTH_VISIBILITY_LABEL,
  STOCK_LEVEL_LABEL,
  STOCK_SUMMARY,
  STOCK_SUMMARY_LABEL,
} from '../constants/booth'
import { apiErrorMessage } from '../constants/errors'
import { useEvent } from '../context/useEvent'
import { instantToLocalDateTime, nowTime } from '../utils/date'
import { useToast } from '../utils/useToast'
import './live.css'

const PAGE_SIZE = 8
const AUTO_REFRESH_MS = 5000

// Display order of the operating statuses (stat cards, filter, dropdowns).
const OP_ORDER = [OP.PREPARING, OP.OPEN, OP.SOLD_OUT, OP.CLOSED]
const OP_OPTIONS = OP_ORDER.map((value) => ({ value, label: BOOTH_OPERATING_STATUS_LABEL[value] }))
const STOCK_OPTIONS = Object.keys(STOCK_LEVEL_LABEL).map((value) => ({
  value,
  label: STOCK_LEVEL_LABEL[value],
}))
const VISIBILITY_OPTIONS = [BOOTH_VISIBILITY.HIDDEN, BOOTH_VISIBILITY.PUBLIC].map((value) => ({
  value,
  label: BOOTH_VISIBILITY_LABEL[value],
}))

const OP_CLASS = {
  [OP.PREPARING]: 'st-preparing',
  [OP.OPEN]: 'st-open',
  [OP.SOLD_OUT]: 'st-soldout',
  [OP.CLOSED]: 'st-closed',
}

// The CSS class of each stock level's dropdown button (live.css).
const STOCK_CLASS = {
  UNLIMITED: 'sk-unlimited',
  AVAILABLE: 'sk-plenty',
  LOW: 'sk-low',
  SOLD_OUT: 'sk-soldout',
}

// 'low' and 'sold out' deserve attention in the list.
const isStockAlert = (summary) => summary === STOCK_SUMMARY.SOLD_OUT || summary === STOCK_SUMMARY.LOW

const timeOf = (instant) => instantToLocalDateTime(instant).slice(11, 16)

// The booth's own pin on its published map, in the shape FloorMap draws.
const placementMap = (booth) =>
  booth.mapPlacement && {
    image: { url: booth.mapPlacement.imageUrl },
    pins: [
      {
        id: booth.mapPlacement.pinId,
        boothId: booth.eventBoothId,
        name: booth.name,
        boothCode: booth.boothCode,
        xRatio: Number(booth.mapPlacement.xRatio),
        yRatio: Number(booth.mapPlacement.yRatio),
      },
    ],
  }

export default function LivePage() {
  const navigate = useNavigate()
  const { event } = useEvent()
  const { toast, notify } = useToast()
  const eventId = event.id

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | a STOCK_SUMMARY value
  const [placeFilter, setPlaceFilter] = useState('all') // 'all' | 'ASSIGNED' | 'UNASSIGNED'
  const [page, setPage] = useState(1)
  // undefined = nothing chosen yet (the first booth of the list is shown), null = none selected.
  const [chosenId, setChosenId] = useState(undefined)
  const [itemForm, setItemForm] = useState(null) // null = closed | { name, price, stock }
  const [bigMap, setBigMap] = useState(null) // null = closed | { loading } | { image, pins, shared }

  // ---- data from the backend, loaded again on every change and on every refresh ----
  const [operations, setOperations] = useState(null) // { summary, booths: page, asOf }
  const [loadError, setLoadError] = useState('')
  const [detail, setDetail] = useState(null) // { id, data } — the booth detail last loaded
  const [tick, setTick] = useState(0) // bump to load everything again
  const [refreshedAt, setRefreshedAt] = useState(nowTime)
  const [auto, setAuto] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(false)

  // Search text is sent to the server after a short pause, not on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let alive = true
    boothApi
      .getOperations(eventId, {
        page: page - 1,
        size: PAGE_SIZE,
        q: debouncedQuery,
        operationStatus: statusFilter === 'all' ? '' : statusFilter,
        stockSummary: stockFilter === 'all' ? '' : stockFilter,
        placementStatus: placeFilter === 'all' ? '' : placeFilter,
      })
      .then((result) => {
        if (!alive) return
        setOperations(result)
        setLoadError('')
        setRefreshedAt(nowTime())
      })
      .catch((err) => alive && setLoadError(apiErrorMessage(err)))
    return () => {
      alive = false
    }
  }, [eventId, page, debouncedQuery, statusFilter, stockFilter, placeFilter, tick])

  const rows = operations?.booths.content ?? []
  const total = operations?.booths.totalElements ?? 0
  const pageCount = Math.max(1, operations?.booths.totalPages ?? 1)
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const summary = operations?.summary
  const selectedId = chosenId === undefined ? (rows[0]?.eventBoothId ?? null) : chosenId

  useEffect(() => {
    if (!selectedId) return
    let alive = true
    boothApi
      .getBooth(eventId, selectedId)
      .then((data) => alive && setDetail({ id: selectedId, data }))
      .catch((err) => alive && notify(apiErrorMessage(err), 'error'))
    return () => {
      alive = false
    }
  }, [eventId, selectedId, tick, notify])

  // Polling: only while the tab is visible.
  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1)
    }, AUTO_REFRESH_MS)
    return () => clearInterval(timer)
  }, [auto])

  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setTick((t) => t + 1)
    setTimeout(() => setRefreshing(false), 500)
  }

  // Esc closes the large map.
  const bigMapOpen = bigMap !== null
  useEffect(() => {
    if (!bigMapOpen) return
    const onKey = (e) => e.key === 'Escape' && setBigMap(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bigMapOpen])

  const resetPage = (fn) => (v) => {
    fn(v)
    setPage(1)
  }

  const selected = detail?.id === selectedId ? detail.data : null
  const selectedPlaced = selected?.mapPlacement != null
  const placed = selected ? placementMap(selected) : null

  // Runs a write call; failures show as a message and the data is loaded again either way.
  const write = async (action) => {
    if (busy) return
    setBusy(true)
    try {
      await action()
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
    } finally {
      setBusy(false)
      setTick((t) => t + 1)
    }
  }

  const changeOperation = (boothId, revision, status) =>
    write(() => boothApi.setOperationStatus(eventId, boothId, revision, status))

  const changeVisibility = (visibilityStatus) =>
    write(async () => {
      await boothApi.patchBooth(eventId, selected.eventBoothId, {
        revision: selected.revision,
        visibilityStatus,
      })
      notify(visibilityStatus === BOOTH_VISIBILITY.PUBLIC ? '방문객에게 공개했어요.' : '비공개로 바꿨어요.')
    })

  const changeStock = (item, stockStatus) =>
    // The backend answers with the changed item only; `write` loads the booth and the list again.
    write(() =>
      boothApi.patchItem(eventId, selected.eventBoothId, item.id, {
        revision: item.revision,
        stockStatus,
      }),
    )

  const addItem = () => {
    const name = itemForm.name.trim()
    if (!name) return notify('메뉴 이름을 입력해 주세요.', 'error')
    if (!/^\d*$/.test(itemForm.price)) return notify('가격은 숫자로 입력해 주세요.', 'error')
    write(async () => {
      await boothApi.createItem(eventId, selected.eventBoothId, {
        name,
        priceKrw: itemForm.price === '' ? null : Number(itemForm.price),
        stockStatus: itemForm.stock,
        sortOrder: selected.items.length,
      })
      setItemForm(null)
      notify('메뉴를 추가했어요.')
    })
  }

  const removeItem = (item) => {
    if (!window.confirm(`'${item.name}' 메뉴를 삭제할까요?`)) return
    write(async () => {
      await boothApi.deleteItem(eventId, selected.eventBoothId, item.id, item.revision)
      notify('메뉴를 삭제했어요.')
    })
  }

  // The large map shows the map visitors see (all public booths). If that is not published yet,
  // it falls back to this booth's own pin.
  const openBigMap = async () => {
    setBigMap({ loading: true })
    try {
      const map = await getPublicMap(eventId)
      setBigMap({
        shared: true,
        image: { url: map.image.readUrl },
        pins: map.pins.map((p) => ({
          id: p.id,
          boothId: p.eventBoothId ?? null,
          name: p.boothName ?? p.label,
          boothCode: p.boothCode ?? null,
          xRatio: Number(p.xRatio),
          yRatio: Number(p.yRatio),
        })),
      })
    } catch {
      setBigMap({ shared: false, ...placed })
    }
  }

  const stat = (label, value, tone = '') => (
    <div className={`lv-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )

  const soldOutItems = selected ? selected.items.filter((i) => i.stockStatus === 'SOLD_OUT').length : 0

  return (
    <OrganizerLayout
      active="live"
      crumb="실시간 운영 현황"
      title="실시간 운영 현황"
      subtitle="부스의 운영 상태와 재고, 배치 현황을 한눈에 확인하세요."
      actions={
        <div className="lv-refresh">
          <div className="lv-auto">
            <button
              type="button"
              className={`lv-auto-btn${auto ? ' is-on' : ''}`}
              aria-pressed={auto}
              onClick={() => setAuto((a) => !a)}
            >
              <i aria-hidden="true" />
              {auto ? '자동 갱신 중' : '자동 갱신 꺼짐'}
            </button>
            <span>최근 갱신 {refreshedAt}</span>
          </div>
          <button type="button" className="om-btn om-btn-outline" onClick={refresh} disabled={refreshing}>
            {refreshing ? '갱신 중…' : '새로고침'}
          </button>
        </div>
      }
    >
      <div className="lv-stats">
        {stat('전체 부스', summary?.total ?? 0)}
        {stat('준비 중', summary?.preparing ?? 0)}
        {stat('운영 중', summary?.open ?? 0, 'is-open')}
        {stat('품절', summary?.soldOut ?? 0, 'is-soldout')}
        {stat('마감', summary?.closed ?? 0, 'is-closed')}
      </div>

      <div className="lv-grid">
        {/* ---------- 부스 운영 목록 ---------- */}
        <section className="om-panel lv-list">
          <div className="lv-list-head">
            <h2 className="om-panel-title">부스 운영 목록</h2>
            <span>전체 {summary?.total ?? 0}개</span>
          </div>

          <div className="lv-filters">
            <label className="om-search lv-search">
              <Icon name="search" />
              <input
                placeholder="부스명 검색"
                value={query}
                onChange={(e) => resetPage(setQuery)(e.target.value)}
              />
            </label>
            <Select value={statusFilter} onChange={resetPage(setStatusFilter)}>
              <option value="all">전체 상태</option>
              {OP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select value={stockFilter} onChange={resetPage(setStockFilter)}>
              <option value="all">전체 재고 현황</option>
              {Object.entries(STOCK_SUMMARY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select value={placeFilter} onChange={resetPage(setPlaceFilter)}>
              <option value="all">전체 배치</option>
              <option value="ASSIGNED">배치 완료</option>
              <option value="UNASSIGNED">미배치</option>
            </Select>
          </div>

          <div className="lv-table-wrap">
            <table className="lv-table">
              <thead>
                <tr>
                  <th>부스 번호</th>
                  <th>부스명</th>
                  <th>운영 상태</th>
                  <th>재고 현황</th>
                  <th>배치</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b.eventBoothId}
                    className={b.eventBoothId === selectedId ? 'is-selected' : ''}
                    onClick={() => setChosenId(b.eventBoothId)}
                  >
                    <td>{b.boothCode}</td>
                    <td className="lv-name">{b.name}</td>
                    <td>
                      <MenuSelect
                        value={b.operationStatus}
                        options={OP_OPTIONS}
                        buttonClassName={OP_CLASS[b.operationStatus]}
                        ariaLabel={`${b.name} 운영 상태`}
                        disabled={busy}
                        onChange={(v) => changeOperation(b.eventBoothId, b.revision, v)}
                      />
                    </td>
                    <td className={isStockAlert(b.stockSummary) ? 'lv-alert' : ''}>
                      {STOCK_SUMMARY_LABEL[b.stockSummary] ?? b.stockSummary}
                    </td>
                    <td>{b.placementStatus === 'ASSIGNED' ? '배치 완료' : '미배치'}</td>
                    <td>
                      <button
                        type="button"
                        className="lv-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          setChosenId(b.eventBoothId)
                        }}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="lv-empty">
                    <td colSpan={6}>
                      {loadError ||
                        (operations === null
                          ? '불러오는 중…'
                          : summary.total === 0
                            ? '승인된 부스가 없어요. 부스 관리에서 신청을 승인해 주세요.'
                            : '조건에 맞는 부스가 없어요.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="lv-pager">
            <span>
              {total === 0 ? '총 0개' : `총 ${total}개 중 ${start + 1}–${start + rows.length}개`}
            </span>
            <div className="lv-pages">
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
          <p className="lv-note">
            운영 상태를 눌러 변경하세요. 재고 현황은 부스의 메뉴 재고를 모아서 보여 줘요.
          </p>
        </section>

        {/* ---------- 부스 상세 ---------- */}
        <section className="om-panel lv-detail">
          {selectedId ? (
            <>
              <div className="lv-detail-head">
                <h2 className="om-panel-title">부스 상세</h2>
                <button type="button" className="lv-x" aria-label="닫기" onClick={() => setChosenId(null)}>
                  ×
                </button>
              </div>

              {selected ? (
                <div className="lv-detail-body">
                  <h3 className="lv-booth-title">
                    <span>{selected.boothCode}</span>
                    {selected.name}
                  </h3>
                  <div className="lv-chips">
                    <span className="lv-cat">
                      {BOOTH_CATEGORY_LABEL[selected.categoryCode] ?? selected.categoryCode}
                    </span>
                    <MenuSelect
                      value={selected.operationStatus}
                      options={OP_OPTIONS}
                      buttonClassName={OP_CLASS[selected.operationStatus]}
                      ariaLabel="운영 상태 변경"
                      disabled={busy}
                      onChange={(v) => changeOperation(selected.eventBoothId, selected.revision, v)}
                    />
                    <small>주최자 변경 가능</small>
                  </div>

                  <div className="lv-facts">
                    <div>
                      <span>재고 현황</span>
                      <strong className={isStockAlert(selected.stockSummary) ? 'lv-alert' : ''}>
                        {selected.items.length === 0
                          ? STOCK_SUMMARY_LABEL[selected.stockSummary]
                          : `품절 메뉴 ${soldOutItems}/${selected.items.length}`}
                      </strong>
                    </div>
                    <div>
                      <span>최근 변경</span>
                      <strong>{timeOf(selected.lastChangedAt)}</strong>
                    </div>
                  </div>

                  <div className="lv-visibility">
                    <span>방문객 공개</span>
                    <MenuSelect
                      value={selected.visibilityStatus}
                      options={VISIBILITY_OPTIONS}
                      ariaLabel="방문객 공개 여부"
                      disabled={busy}
                      onChange={changeVisibility}
                    />
                    <small>공개해야 방문객 지도와 목록에 보여요.</small>
                  </div>

                  <div className="lv-sec-head">
                    <h4>부스 위치</h4>
                    <span className={`lv-place${selectedPlaced ? ' is-placed' : ''}`}>
                      {selectedPlaced ? '배치 완료' : '미배치'}
                    </span>
                  </div>
                  {placed ? (
                    <FloorMap
                      image={placed.image}
                      pins={placed.pins}
                      highlightBoothId={selected.eventBoothId}
                      maxHeight="190px"
                    />
                  ) : (
                    <div className="lv-map-empty">
                      <p>아직 게시된 지도에 배치되지 않았어요.</p>
                      <button type="button" className="lv-link" onClick={() => navigate('/organizer/map')}>
                        지도 제작에서 배치하고 게시하기
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="lv-wide-btn"
                    disabled={!selectedPlaced}
                    onClick={openBigMap}
                  >
                    지도에서 크게 보기
                  </button>

                  <h4 className="lv-h4">부스 소개</h4>
                  <p className="lv-intro">{selected.description || '소개가 아직 없어요.'}</p>

                  <h4 className="lv-h4">메뉴별 재고 · 클릭하여 변경</h4>
                  <ul className="lv-menus">
                    {selected.items.map((m) => (
                      <li key={m.id}>
                        <span>{m.name}</span>
                        <MenuSelect
                          value={m.stockStatus}
                          options={STOCK_OPTIONS}
                          buttonClassName={STOCK_CLASS[m.stockStatus]}
                          ariaLabel={`${m.name} 재고`}
                          disabled={busy}
                          onChange={(v) => changeStock(m, v)}
                        />
                        <button
                          type="button"
                          className="lv-item-remove"
                          aria-label={`${m.name} 삭제`}
                          disabled={busy}
                          onClick={() => removeItem(m)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                    {selected.items.length === 0 && <li>등록된 메뉴가 없어요.</li>}
                  </ul>
                  {itemForm ? (
                    <div className="lv-item-form">
                      <input
                        autoFocus
                        placeholder="메뉴 이름"
                        maxLength={100}
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      />
                      <input
                        placeholder="가격(원, 선택)"
                        inputMode="numeric"
                        maxLength={9}
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value.replace(/\D/g, '') })}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      />
                      <MenuSelect
                        value={itemForm.stock}
                        options={STOCK_OPTIONS}
                        buttonClassName={STOCK_CLASS[itemForm.stock]}
                        ariaLabel="새 메뉴 재고"
                        onChange={(stock) => setItemForm({ ...itemForm, stock })}
                      />
                      <div className="lv-item-form-actions">
                        <button type="button" className="om-chip" disabled={busy} onClick={addItem}>
                          추가
                        </button>
                        <button type="button" className="om-chip" onClick={() => setItemForm(null)}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="lv-wide-btn lv-item-add"
                      onClick={() => setItemForm({ name: '', price: '', stock: 'AVAILABLE' })}
                    >
                      + 메뉴 추가
                    </button>
                  )}
                  <p className="lv-legend">재고 단계: 무제한 / 충분 / 부족 / 품절</p>
                </div>
              ) : (
                <div className="lv-detail-empty">
                  <p>불러오는 중…</p>
                </div>
              )}
            </>
          ) : (
            <div className="lv-detail-empty">
              <Icon name="store" />
              <p>목록에서 부스를 선택하면 상세 정보가 보여요.</p>
            </div>
          )}
        </section>
      </div>

      {/* ---------- 지도에서 크게 보기 ---------- */}
      {bigMapOpen && (
        <div className="om-confirm-overlay" onClick={() => setBigMap(null)}>
          <div
            className="lv-bigmap"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lv-bigmap-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lv-bigmap-head">
              <h2 id="lv-bigmap-title">행사장 지도</h2>
              <button type="button" className="lv-x" aria-label="닫기" onClick={() => setBigMap(null)}>
                ×
              </button>
            </div>
            <p className="lv-bigmap-sub">
              {bigMap.loading
                ? '지도를 불러오는 중…'
                : bigMap.shared
                  ? `${selected ? `${selected.name} 위치를 강조해서 보여요. ` : ''}핀을 누르면 그 부스를 선택해요. (방문객에게 공개된 부스만 나와요)`
                  : '게시된 지도가 없어서 이 부스의 위치만 보여요.'}
            </p>
            <div className="lv-bigmap-body">
              {!bigMap.loading && (
                <FloorMap
                  image={bigMap.image}
                  pins={bigMap.pins}
                  highlightBoothId={selectedId}
                  labelBooths
                  onSelectBooth={setChosenId}
                  maxHeight="calc(100vh - 230px)"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </OrganizerLayout>
  )
}
