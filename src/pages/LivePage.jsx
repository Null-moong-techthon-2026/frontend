import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FloorMap from '../components/FloorMap'
import MenuSelect from '../components/MenuSelect'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Select from '../components/Select'
import {
  BOOTH_CATEGORY_LABEL,
  BOOTH_OPERATING_STATUS as OP,
  BOOTH_OPERATING_STATUS_LABEL,
  BOOTH_STATUS,
  STOCK_LEVEL,
  STOCK_LEVEL_LABEL,
} from '../constants/booth'
import { useBooths } from '../context/useBooths'
import { useMap } from '../context/useMap'
import { nowTime } from '../utils/date'
import './live.css'

const PAGE_SIZE = 8
const AUTO_REFRESH_MS = 30000

// Display order of the operating statuses (stat cards, filter, dropdowns).
const OP_ORDER = [OP.PREPARING, OP.OPEN, OP.SOLD_OUT, OP.CLOSED]
const OP_OPTIONS = OP_ORDER.map((value) => ({ value, label: BOOTH_OPERATING_STATUS_LABEL[value] }))
const STOCK_OPTIONS = Object.keys(STOCK_LEVEL_LABEL).map((value) => ({
  value,
  label: STOCK_LEVEL_LABEL[value],
}))

const OP_CLASS = {
  [OP.PREPARING]: 'st-preparing',
  [OP.OPEN]: 'st-open',
  [OP.SOLD_OUT]: 'st-soldout',
  [OP.CLOSED]: 'st-closed',
}

const soldOutCount = (booth) => booth.menus.filter((m) => m.stock === STOCK_LEVEL.SOLDOUT).length

export default function LivePage() {
  const navigate = useNavigate()
  const { booths, setOperatingStatus, setMenuStock } = useBooths()
  const { image, pins } = useMap()

  // Only approved booths take part in the event, so only they are listed (and counted).
  const approved = booths
    .filter((b) => b.status === BOOTH_STATUS.APPROVED)
    .sort((a, b) => (a.boothNo ?? Infinity) - (b.boothNo ?? Infinity))
  // Placement comes from 지도 제작: a booth is placed once one of its pins carries its id.
  const isPlaced = (id) => pins.some((p) => p.boothId === id)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'has' | 'none' sold-out menus
  const [placeFilter, setPlaceFilter] = useState('all') // 'all' | 'placed' | 'unplaced'
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(() => approved[0]?.id ?? null)
  const [bigMapOpen, setBigMapOpen] = useState(false)

  // ---- refresh clock (nothing to fetch yet: all data is local) ----
  const [refreshedAt, setRefreshedAt] = useState(nowTime)
  const [auto, setAuto] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // TODO(backend): refetch booths (operating status, menu stock) here instead of only stamping the time.
  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => setRefreshedAt(nowTime()), AUTO_REFRESH_MS)
    return () => clearInterval(timer)
  }, [auto])

  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setTimeout(() => {
      setRefreshedAt(nowTime())
      setRefreshing(false)
    }, 500)
  }

  useEffect(() => {
    if (!bigMapOpen) return
    const onKey = (e) => e.key === 'Escape' && setBigMapOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bigMapOpen])

  // ---- numbers on the stat cards: computed from the booth list, like the dashboard ----
  const countOp = (op) => approved.filter((b) => b.operatingStatus === op).length

  // ---- filtering + paging ----
  const filtered = approved
    .filter((b) => b.name.includes(query.trim()))
    .filter((b) => statusFilter === 'all' || b.operatingStatus === statusFilter)
    .filter(
      (b) =>
        stockFilter === 'all' || (stockFilter === 'has' ? soldOutCount(b) > 0 : soldOutCount(b) === 0),
    )
    .filter(
      (b) =>
        placeFilter === 'all' || (placeFilter === 'placed' ? isPlaced(b.id) : !isPlaced(b.id)),
    )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)
  const resetPage = (fn) => (v) => {
    fn(v)
    setPage(1)
  }

  const selected = approved.find((b) => b.id === selectedId) ?? null
  const selectedPlaced = selected ? isPlaced(selected.id) : false

  const stat = (label, value, tone = '') => (
    <div className={`lv-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )

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
        {stat('전체 부스', approved.length)}
        {stat('준비 중', countOp(OP.PREPARING))}
        {stat('운영 중', countOp(OP.OPEN), 'is-open')}
        {stat('품절', countOp(OP.SOLD_OUT), 'is-soldout')}
        {stat('마감', countOp(OP.CLOSED), 'is-closed')}
      </div>

      <div className="lv-grid">
        {/* ---------- 부스 운영 목록 ---------- */}
        <section className="om-panel lv-list">
          <div className="lv-list-head">
            <h2 className="om-panel-title">부스 운영 목록</h2>
            <span>전체 {approved.length}개</span>
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
              <option value="all">전체 품절 현황</option>
              <option value="has">품절 메뉴 있음</option>
              <option value="none">품절 메뉴 없음</option>
            </Select>
            <Select value={placeFilter} onChange={resetPage(setPlaceFilter)}>
              <option value="all">전체 배치</option>
              <option value="placed">배치 완료</option>
              <option value="unplaced">미배치</option>
            </Select>
          </div>

          <div className="lv-table-wrap">
            <table className="lv-table">
              <thead>
                <tr>
                  <th>부스 번호</th>
                  <th>부스명</th>
                  <th>운영 상태</th>
                  <th>품절 현황</th>
                  <th>배치</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((b) => {
                  const sold = soldOutCount(b)
                  return (
                    <tr
                      key={b.id}
                      className={b.id === selectedId ? 'is-selected' : ''}
                      onClick={() => setSelectedId(b.id)}
                    >
                      <td>{b.boothNo ?? '-'}</td>
                      <td className="lv-name">{b.name}</td>
                      <td>
                        <MenuSelect
                          value={b.operatingStatus}
                          options={OP_OPTIONS}
                          buttonClassName={OP_CLASS[b.operatingStatus]}
                          ariaLabel={`${b.name} 운영 상태`}
                          onChange={(v) => setOperatingStatus(b.id, v)}
                        />
                      </td>
                      <td className={sold > 0 ? 'lv-alert' : ''}>
                        품절 메뉴 {sold}/{b.menus.length}
                      </td>
                      <td>{isPlaced(b.id) ? '배치 완료' : '미배치'}</td>
                      <td>
                        <button
                          type="button"
                          className="lv-view"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedId(b.id)
                          }}
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {pageRows.length === 0 && (
                  <tr className="lv-empty">
                    <td colSpan={6}>
                      {approved.length === 0
                        ? '승인된 부스가 없어요. 부스 관리에서 신청을 승인해 주세요.'
                        : '조건에 맞는 부스가 없어요.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="lv-pager">
            <span>
              {filtered.length === 0
                ? '총 0개'
                : `총 ${filtered.length}개 중 ${start + 1}–${start + pageRows.length}개`}
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
            운영 상태를 눌러 변경하세요. 품절 메뉴 수 / 전체 메뉴 수를 표시합니다.
          </p>
        </section>

        {/* ---------- 부스 상세 ---------- */}
        <section className="om-panel lv-detail">
          {selected ? (
            <>
              <div className="lv-detail-head">
                <h2 className="om-panel-title">부스 상세</h2>
                <button type="button" className="lv-x" aria-label="닫기" onClick={() => setSelectedId(null)}>
                  ×
                </button>
              </div>

              <div className="lv-detail-body">
                <h3 className="lv-booth-title">
                  {selected.boothNo != null && <span>{selected.boothNo}</span>}
                  {selected.name}
                </h3>
                <div className="lv-chips">
                  <span className="lv-cat">{BOOTH_CATEGORY_LABEL[selected.category]}</span>
                  <MenuSelect
                    value={selected.operatingStatus}
                    options={OP_OPTIONS}
                    buttonClassName={OP_CLASS[selected.operatingStatus]}
                    ariaLabel="운영 상태 변경"
                    onChange={(v) => setOperatingStatus(selected.id, v)}
                  />
                  <small>주최자 변경 가능</small>
                </div>

                <div className="lv-facts">
                  <div>
                    <span>품절 현황</span>
                    <strong className={soldOutCount(selected) > 0 ? 'lv-alert' : ''}>
                      품절 메뉴 {soldOutCount(selected)}/{selected.menus.length}
                    </strong>
                  </div>
                  <div>
                    <span>최근 변경</span>
                    <strong>{selected.statusChangedAt.slice(11, 16)}</strong>
                  </div>
                </div>

                <div className="lv-sec-head">
                  <h4>부스 위치</h4>
                  <span className={`lv-place${selectedPlaced ? ' is-placed' : ''}`}>
                    {selectedPlaced ? '배치 완료' : '미배치'}
                  </span>
                </div>
                {image ? (
                  <FloorMap
                    image={image}
                    pins={pins}
                    booths={booths}
                    highlightBoothId={selected.id}
                    maxHeight="190px"
                  />
                ) : (
                  <div className="lv-map-empty">
                    <p>아직 평면도가 없어요.</p>
                    <button type="button" className="lv-link" onClick={() => navigate('/organizer/map')}>
                      지도 제작에서 평면도 올리기
                    </button>
                  </div>
                )}
                {image && !selectedPlaced && (
                  <p className="lv-map-hint">
                    지도 제작에서 이 부스를 핀에 할당하면 위치가 표시돼요.
                  </p>
                )}
                <button
                  type="button"
                  className="lv-wide-btn"
                  disabled={!image}
                  onClick={() => setBigMapOpen(true)}
                >
                  지도에서 크게 보기
                </button>

                <h4 className="lv-h4">부스 소개</h4>
                <p className="lv-intro">{selected.intro}</p>

                <h4 className="lv-h4">메뉴별 재고 · 클릭하여 변경</h4>
                <ul className="lv-menus">
                  {selected.menus.map((m) => (
                    <li key={m.id}>
                      <span>{m.name}</span>
                      <MenuSelect
                        value={m.stock}
                        options={STOCK_OPTIONS}
                        buttonClassName={`sk-${m.stock}`}
                        ariaLabel={`${m.name} 재고`}
                        onChange={(v) => setMenuStock(selected.id, m.id, v)}
                      />
                    </li>
                  ))}
                </ul>
                <p className="lv-legend">재고 단계: 무제한 / 충분 / 부족 / 품절</p>
              </div>
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
      {bigMapOpen && image && (
        <div className="om-confirm-overlay" onClick={() => setBigMapOpen(false)}>
          <div
            className="lv-bigmap"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lv-bigmap-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lv-bigmap-head">
              <h2 id="lv-bigmap-title">행사장 지도</h2>
              <button type="button" className="lv-x" aria-label="닫기" onClick={() => setBigMapOpen(false)}>
                ×
              </button>
            </div>
            <p className="lv-bigmap-sub">
              {selected ? `${selected.name} 위치를 강조해서 보여요. ` : ''}
              핀을 누르면 그 부스를 선택해요.
            </p>
            <div className="lv-bigmap-body">
              <FloorMap
                image={image}
                pins={pins}
                booths={booths}
                highlightBoothId={selectedId}
                labelBooths
                onSelectBooth={setSelectedId}
                maxHeight="calc(100vh - 230px)"
              />
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}
