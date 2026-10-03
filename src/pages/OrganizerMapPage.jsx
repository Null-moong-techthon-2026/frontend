import { useEffect, useRef, useState } from 'react'
import boothLogo from '../assets/booth-logo.png'
import './organizer-map.css'

const NAV = [
  { key: 'dashboard', label: '대시보드', icon: 'grid' },
  { key: 'map', label: '지도 제작', icon: 'map', active: true },
  { key: 'booths', label: '부스 관리', icon: 'store' },
  { key: 'recruit', label: '부스 모집', icon: 'megaphone' },
  { key: 'live', label: '실시간 운영 현황', icon: 'chart' },
  { key: 'notice', label: '공지사항', icon: 'bell' },
  { key: 'settle', label: '정산 관리', icon: 'won', badge: '준비중' },
]

const FACILITIES = [
  { key: 'booth', label: '부스', icon: 'store' },
  { key: 'toilet', label: '화장실', icon: 'user' },
  { key: 'info', label: '안내소', icon: 'info' },
  { key: 'medical', label: '의무실', icon: 'plus-cross' },
  { key: 'etc', label: '기타 시설', icon: 'grid' },
]

const BOOTHS = [
  { n: 9, name: '알빨 떡볶이', category: '식사', assigned: false },
  { n: 10, name: '오늘의 커피', category: '음료', assigned: false },
  { n: 11, name: '컬러스 포토', category: '체험', assigned: false },
  { n: 12, name: '평온상점', category: '굿즈', assigned: false },
]

function Icon({ name }) {
  const paths = {
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
    store: <path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />,
    megaphone: <path d="M3 10v4h4l9 5V5L7 10H3Zm16-1a3 3 0 0 1 0 6" />,
    chart: <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />,
    bell: <path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4h4" />,
    won: <path d="M4 8h16M4 12h16M7 4l3 16 2-10 2 10 3-16" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
    info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v5m0-8v.5" />,
    'plus-cross': <path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5Z" />,
    upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />,
    image: <path d="M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    trash: <path d="M4 7h16M9 7V4h6v3m-7 0 1 13h8l1-13" />,
    pin: <path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Z" />,
    cursor: <path d="M5 3l14 8-6 1.5L10 20 5 3Z" />,
    hand: <path d="M8 13V5a1.5 1.5 0 0 1 3 0v5m0-3a1.5 1.5 0 0 1 3 0v3m0-2a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3a1.5 1.5 0 0 1 2.5-1.6L8 13" />,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25
const WHEEL_STEP = 1.1

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

// Pan is stored in percent of the viewport so it stays valid when the viewport resizes.
const clampPan = (p, z) => {
  const max = Math.max(0, (z - 1) * 50)
  const clamp = (v) => Math.min(max, Math.max(-max, v))
  return { x: clamp(p.x), y: clamp(p.y) }
}

export default function OrganizerMapPage() {
  const [selected, setSelected] = useState(9)
  const [tab, setTab] = useState('unplaced')
  const [facility, setFacility] = useState('booth')
  const [image, setImage] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState('cursor')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const visibleBooths = tab === 'unplaced' ? BOOTHS : BOOTHS.filter((b) => b.assigned)

  const zoomTo = (nz) => {
    const z = clampZoom(nz)
    setZoom(z)
    setPan((p) => clampPan(p, z))
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const nz = clampZoom(zoom * (e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP))
      setZoom(nz)
      setPan((p) => clampPan(p, nz))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [image, zoom])

  const handlePointerDown = (e) => {
    if (!image || zoom <= 1 || tool !== 'hand') return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pan }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const width = e.currentTarget.clientWidth
    const height = e.currentTarget.clientHeight
    const next = {
      x: d.origin.x + ((e.clientX - d.startX) / width) * 100,
      y: d.origin.y + ((e.clientY - d.startY) / height) * 100,
    }
    setPan(clampPan(next, zoom))
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { url: URL.createObjectURL(file), name: file.name }
    })
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    loadFile(e.dataTransfer.files[0])
  }

  const removeImage = () => {
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="om-app">
      <aside className="om-sidebar">
        <div className="om-brand">
          <img src={boothLogo} alt="" className="om-brand-logo" />
          <span className="om-brand-name">부스럭</span>
        </div>

        <div className="om-event-card">
          <p className="om-event-name">비룡제 2026</p>
          <p className="om-event-date">2026.09.22 ~ 09.24</p>
          <span className="om-badge">준비 중</span>
        </div>

        <nav className="om-nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`om-nav-item${item.active ? ' is-active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="om-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="om-main">
        <header className="om-topbar">
          <p className="om-crumb">행사 운영 / 지도 제작</p>
          <div className="om-topbar-right">
            <button type="button" className="om-icon-btn" aria-label="알림">
              <Icon name="bell" />
            </button>
            <button type="button" className="om-user">
              <span className="om-avatar" />
              운영자님
              <Icon name="chevron" />
            </button>
          </div>
        </header>

        <div className="om-page-head">
          <div>
            <h1>지도 제작</h1>
            <p>평면도 위에 핀을 만들고, 승인된 부스를 배치하세요.</p>
          </div>
          <div className="om-page-actions">
            <button type="button" className="om-btn om-btn-outline">미리보기</button>
            <button type="button" className="om-btn om-btn-primary">저장하기</button>
          </div>
        </div>

        <div className="om-grid">
          <section className="om-panel">
            <h2 className="om-panel-title">평면도</h2>
            <label
              className={`om-dropzone${dragging ? ' is-dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                className="om-file-input"
                onChange={(e) => loadFile(e.target.files[0])}
              />
              <Icon name="upload" />
              <p className="om-dropzone-title">평면도 업로드</p>
              <p className="om-dropzone-sub">이미지를 끌어서 놓거나 클릭해서 선택하세요.</p>
              <p className="om-dropzone-sub">PNG, JPG</p>
            </label>
            {image && (
              <div className="om-file">
                <Icon name="image" />
                <span className="om-file-name">{image.name}</span>
              </div>
            )}

            <h2 className="om-panel-title om-mt">핀 생성하기</h2>
            <p className="om-panel-sub">생성할 핀을 선택해 지도에 추가하세요.</p>
            <ul className="om-facility-list">
              {FACILITIES.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    className={`om-facility${facility === f.key ? ' is-selected' : ''}`}
                    onClick={() => setFacility(f.key)}
                  >
                    <Icon name={f.icon} />
                    <span>{f.label}</span>
                    <Icon name="plus" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="om-panel om-panel-map">
            <div className="om-panel-head">
              <h2 className="om-panel-title">행사장 평면도</h2>
              <div className="om-tools">
                <button
                  type="button"
                  className={`om-tool${tool === 'cursor' ? ' is-active' : ''}`}
                  aria-label="선택"
                  onClick={() => setTool('cursor')}
                >
                  <Icon name="cursor" />
                </button>
                <button
                  type="button"
                  className={`om-tool${tool === 'hand' ? ' is-active' : ''}`}
                  aria-label="이동"
                  onClick={() => setTool('hand')}
                >
                  <Icon name="hand" />
                </button>
                <button
                  type="button"
                  className="om-tool"
                  aria-label="업로드한 이미지 삭제"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!image}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
            <div className="om-map-wrap">
              {image ? (
                <div
                  ref={viewportRef}
                  className={`om-map-viewport${tool === 'hand' && zoom > 1 ? ' is-pannable' : ''}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <img
                    src={image.url}
                    alt="행사장 평면도"
                    className="om-map-image"
                    style={{
                      transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="om-map-empty" />
              )}
              {image && (
                <div className="om-zoom">
                  <button
                    type="button"
                    aria-label="확대"
                    onClick={() => zoomTo(zoom + ZOOM_STEP)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label="축소"
                    onClick={() => zoomTo(zoom - ZOOM_STEP)}
                  >
                    −
                  </button>
                </div>
              )}
            </div>
            <div className="om-map-foot">
              <div className="om-legend">
                <span><i className="om-dot om-dot-primary" />배치 완료</span>
                <span><i className="om-dot om-dot-muted" />미할당</span>
              </div>
              <div className="om-map-foot-right">
                <button type="button" className="om-chip" onClick={() => zoomTo(1)}>
                  {Math.round(zoom * 100)}%
                </button>
                <button type="button" className="om-chip" onClick={() => zoomTo(1)}>
                  전체 보기
                </button>
              </div>
            </div>
          </section>

          {confirmOpen && (
            <div className="om-confirm-overlay" onClick={() => setConfirmOpen(false)}>
              <div
                className="om-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="om-confirm-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="om-confirm-title">평면도를 삭제할까요?</h2>
                <p>업로드한 이미지가 삭제되며, 이 작업은 되돌릴 수 없어요.</p>
                <div className="om-confirm-actions">
                  <button type="button" className="om-btn om-btn-outline" onClick={() => setConfirmOpen(false)}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="om-btn om-btn-danger"
                    onClick={() => {
                      removeImage()
                      setConfirmOpen(false)
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="om-panel">
            <div className="om-panel-head">
              <h2 className="om-panel-title">선택한 핀</h2>
              <div className="om-tools">
                <span className="om-tag">부스 핀</span>
                <button type="button" className="om-chip">삭제하기</button>
                <button type="button" className="om-chip">핀 등록</button>
              </div>
            </div>

            <label className="om-label">핀 이름</label>
            <input className="om-input" value={String(selected)} readOnly />

            <div className="om-row-between om-mt-sm">
              <span className="om-label">할당 상태</span>
              <span className="om-pill-highlight">미할당</span>
            </div>

            <h2 className="om-panel-title om-mt">승인된 부스 할당</h2>
            <p className="om-panel-sub">승인된 부스만 지도에 배치할 수 있어요.</p>

            <div className="om-stats">
              <div className="om-stat">
                <span>총원</span>
                <strong>12</strong>
              </div>
              <div className="om-stat">
                <span>배치 완료</span>
                <strong>8</strong>
              </div>
              <div className="om-stat is-highlight">
                <span>미배치</span>
                <strong>4</strong>
              </div>
            </div>

            <label className="om-search">
              <Icon name="search" />
              <input placeholder="부스명 · 부스 번호 검색" />
            </label>

            <div className="om-segment">
              <button
                type="button"
                className={tab === 'all' ? 'is-active' : ''}
                onClick={() => setTab('all')}
              >
                전체
              </button>
              <button
                type="button"
                className={tab === 'unplaced' ? 'is-active' : ''}
                onClick={() => setTab('unplaced')}
              >
                미배치
              </button>
            </div>

            <ul className="om-booth-list">
              {visibleBooths.map((b) => (
                <li key={b.n}>
                  <button
                    type="button"
                    className={`om-booth${selected === b.n ? ' is-selected' : ''}`}
                    onClick={() => setSelected(b.n)}
                  >
                    <span className={`om-radio${selected === b.n ? ' is-on' : ''}`} />
                    <span className="om-booth-no">{b.n}</span>
                    <span className="om-booth-name">{b.name}</span>
                    <span className="om-booth-cat">{b.category}</span>
                    <span className="om-tag-fill">미배치</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="om-note">선택한 부스가 지도에 배치돼요.</p>
            <button type="button" className="om-btn om-btn-primary om-btn-block">
              부스 할당하기
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
