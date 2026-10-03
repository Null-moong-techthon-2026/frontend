import { useEffect, useRef, useState } from 'react'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import { BOOTH_STATUS } from '../constants/booth'
import { FACILITIES, PIN_TYPE } from '../constants/map'
import { useBooths } from '../context/useBooths'
import pinBooth from '../assets/pins/pin-booth.svg'
import pinToilet from '../assets/pins/pin-toilet.svg'
import pinInfo from '../assets/pins/pin-info.svg'
import pinMedical from '../assets/pins/pin-medical.svg'
import pinEtc from '../assets/pins/pin-etc.svg'
import './organizer-map.css'

const PIN_IMAGES = {
  [PIN_TYPE.BOOTH]: pinBooth,
  [PIN_TYPE.TOILET]: pinToilet,
  [PIN_TYPE.INFO]: pinInfo,
  [PIN_TYPE.MEDICAL]: pinMedical,
  [PIN_TYPE.ETC]: pinEtc,
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

// Number field that only commits (clamped) on blur/Enter, so typing a multi-digit value isn't fought.
function CoordInput({ label, value, max, onCommit }) {
  const [draft, setDraft] = useState(null)
  const commit = () => {
    const n = Number(draft)
    if (draft !== null && draft.trim() !== '' && Number.isFinite(n)) {
      onCommit(Math.min(max, Math.max(0, Math.round(n))))
    }
    setDraft(null)
  }
  return (
    <label className="om-coord">
      <span>{label}</span>
      <input
        className="om-input"
        type="number"
        min={0}
        max={max}
        value={draft ?? value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  )
}

export default function OrganizerMapPage() {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('unplaced')
  const [facility, setFacility] = useState(PIN_TYPE.BOOTH)
  const [image, setImage] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState('cursor')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pinConfirmOpen, setPinConfirmOpen] = useState(false)
  const pinDragRef = useRef(null)
  const suppressClickRef = useRef(false)
  const downWasActiveRef = useRef(false)
  const nextPinId = useRef(1)
  const [placing, setPlacing] = useState(false)
  // Pin coords are in the uploaded image's own pixel space (0..width, 0..height), not screen px.
  // TODO(backend): initialise image + pins from the saved map (GET /map); see BACKEND_INTEGRATION.md.
  const [pins, setPins] = useState([])
  const [activePinId, setActivePinId] = useState(null)
  const stageRef = useRef(null)
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  // A booth counts as placed once some pin carries its number.
  // Only approved booths (from 부스 관리) can be placed on the map.
  const BOOTHS = useBooths().booths.filter((b) => b.status === BOOTH_STATUS.APPROVED)
  const isPlaced = (id) => pins.some((p) => p.boothId === id)
  const visibleBooths = tab === 'unplaced' ? BOOTHS.filter((b) => !isPlaced(b.id)) : BOOTHS
  const totalCount = BOOTHS.length
  const placedCount = BOOTHS.filter((b) => isPlaced(b.id)).length

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

  // TODO(backend): upload the file and keep the returned server URL instead of a blob: URL.
  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { url: URL.createObjectURL(file), name: file.name, width: 0, height: 0 }
    })
    setPins([])
    setPlacing(false)
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
    setPins([])
    setPlacing(false)
  }

  // Fraction of the square stage that the object-fit:contain image occupies.
  const containRect = () => {
    const { width, height } = image
    if (!width || !height) return null
    const w = width >= height ? 1 : width / height
    const h = height >= width ? 1 : height / width
    return { w, h, ox: (1 - w) / 2, oy: (1 - h) / 2 }
  }

  const activePin = pins.find((p) => p.id === activePinId) ?? null

  const removePin = (id) => {
    setPins((prev) => prev.filter((p) => p.id !== id))
    setActivePinId(null)
    setSelected(null)
  }

  const assignBooth = () => {
    const booth = BOOTHS.find((b) => b.id === selected)
    if (!activePin || activePin.type !== PIN_TYPE.BOOTH || !booth || isPlaced(booth.id)) return
    setPins((prev) =>
      prev.map((p) => (p.id === activePin.id ? { ...p, boothId: booth.id, name: booth.name } : p)),
    )
  }

  // Screen point -> image pixel coords (unclamped). The stage's bounding rect already
  // includes pan/zoom, so this maps back to stage space.
  const toImagePoint = (clientX, clientY) => {
    const box = containRect()
    if (!box) return null
    const r = stageRef.current.getBoundingClientRect()
    const u = ((clientX - r.left) / r.width - box.ox) / box.w
    const v = ((clientY - r.top) / r.height - box.oy) / box.h
    return { x: u * image.width, y: v * image.height }
  }

  const movePin = (id, x, y) => {
    const cx = Math.min(image.width, Math.max(0, Math.round(x)))
    const cy = Math.min(image.height, Math.max(0, Math.round(y)))
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x: cx, y: cy } : p)))
  }

  const handlePinPointerDown = (e, pin) => {
    if (tool !== 'cursor' || e.button !== 0) return
    const pt = toImagePoint(e.clientX, e.clientY)
    if (!pt) return
    pinDragRef.current = {
      id: pin.id,
      startX: e.clientX,
      startY: e.clientY,
      dx: pin.x - pt.x,
      dy: pin.y - pt.y,
      moved: false,
    }
    downWasActiveRef.current = activePinId === pin.id
    e.currentTarget.setPointerCapture(e.pointerId)
    setActivePinId(pin.id)
    setSelected(pin.boothId)
  }

  const handlePinPointerMove = (e) => {
    const d = pinDragRef.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 4) return
    d.moved = true
    const pt = toImagePoint(e.clientX, e.clientY)
    if (pt) movePin(d.id, pt.x + d.dx, pt.y + d.dy)
  }

  const handlePinPointerUp = () => {
    const d = pinDragRef.current
    pinDragRef.current = null
    if (d?.moved) {
      suppressClickRef.current = true
      setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }
  }

  const handlePinClick = (e) => {
    e.stopPropagation()
    if (suppressClickRef.current || tool !== 'cursor') return
    // Pointer-down already selected it; a plain click on an already-selected pin deselects.
    if (downWasActiveRef.current) {
      setActivePinId(null)
      setSelected(null)
    }
  }

  const handleMapClick = (e) => {
    if (suppressClickRef.current) return
    setActivePinId(null)
    setSelected(null)
    if (!image || !placing || tool !== 'cursor') return
    const pt = toImagePoint(e.clientX, e.clientY)
    if (!pt) return
    const u = pt.x / image.width
    const v = pt.y / image.height
    if (u < 0 || u > 1 || v < 0 || v > 1) return
    const id = nextPinId.current++
    setActivePinId(id)
    setSelected(null)
    setPins((prev) => [
      ...prev,
      {
        id,
        type: facility,
        name: '',
        boothId: null,
        x: Math.round(u * image.width),
        y: Math.round(v * image.height),
      },
    ])
    setPlacing(false)
  }

  return (
    <OrganizerLayout
      active="map"
      crumb="지도 제작"
      title="지도 제작"
      subtitle="평면도 위에 핀을 만들고, 승인된 부스를 배치하세요."
      actions={
        <>
          <button type="button" className="om-btn om-btn-outline">미리보기</button>
          {/* TODO(backend): save { floorplan: image, pins } (PUT /map). */}
          <button type="button" className="om-btn om-btn-primary">저장하기</button>
        </>
      }
    >
        <div className="om-grid">
          <section className="om-panel">
            <h2 className="om-panel-title">평면도</h2>
            {!image && (
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
            )}
            {image && (
              <div className="om-file">
                <Icon name="image" />
                <span className="om-file-name">{image.name}</span>
              </div>
            )}

            <h2 className="om-panel-title om-mt">핀 생성하기</h2>
            <p className="om-panel-sub">
              {!image
                ? '먼저 평면도를 업로드하세요.'
                : placing
                  ? '지도에서 핀을 놓을 위치를 클릭하세요.'
                  : '생성할 핀을 선택해 지도에 추가하세요.'}
            </p>
            <ul className="om-facility-list">
              {FACILITIES.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    className={`om-facility${placing && facility === f.key ? ' is-selected' : ''}`}
                    onClick={() => {
                      setFacility(f.key)
                      setPlacing(image ? !(placing && facility === f.key) : false)
                    }}
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
                  className={`om-map-viewport${tool === 'hand' && zoom > 1 ? ' is-pannable' : ''}${placing && tool === 'cursor' ? ' is-placing' : ''}`}
                  onClick={handleMapClick}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <div
                    ref={stageRef}
                    className="om-map-stage"
                    style={{
                      transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
                    }}
                  >
                    <img
                      src={image.url}
                      alt="행사장 평면도"
                      className="om-map-image"
                      draggable={false}
                      onLoad={(e) => {
                        // Read before the updater runs: currentTarget is null by then.
                        const { naturalWidth: width, naturalHeight: height } = e.currentTarget
                        setImage((prev) => prev && { ...prev, width, height })
                      }}
                    />
                    {pins.map((pin) => {
                      const box = containRect()
                      if (!box) return null
                      return (
                        <span
                          key={pin.id}
                          className={`om-pin${activePinId === pin.id ? ' is-active' : ''}`}
                          style={{
                            left: `${(box.ox + (pin.x / image.width) * box.w) * 100}%`,
                            top: `${(box.oy + (pin.y / image.height) * box.h) * 100}%`,
                            transform: `translate(-50%, -100%) scale(${1 / zoom})`,
                          }}
                        >
                          <button
                            type="button"
                            className="om-pin-btn"
                            aria-label={`${pin.name}번 핀`}
                            onPointerDown={(e) => handlePinPointerDown(e, pin)}
                            onPointerMove={handlePinPointerMove}
                            onPointerUp={handlePinPointerUp}
                            onPointerCancel={handlePinPointerUp}
                            onClick={handlePinClick}
                          >
                            <img src={PIN_IMAGES[pin.type]} alt="" draggable={false} />
                          </button>
                        </span>
                      )
                    })}
                  </div>
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

          {pinConfirmOpen && activePin && (
            <div className="om-confirm-overlay" onClick={() => setPinConfirmOpen(false)}>
              <div
                className="om-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="om-pin-confirm-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="om-pin-confirm-title">핀을 삭제할까요?</h2>
                <p>
                  {activePin.name ? `'${activePin.name}' 핀이` : '선택한 핀이'} 지도에서 삭제되며,
                  할당된 부스는 미배치로 돌아가요.
                </p>
                <div className="om-confirm-actions">
                  <button type="button" className="om-btn om-btn-outline" onClick={() => setPinConfirmOpen(false)}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="om-btn om-btn-danger"
                    onClick={() => {
                      removePin(activePin.id)
                      setPinConfirmOpen(false)
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}

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
                {activePin && (
                  <>
                    <span className="om-tag">
                      {FACILITIES.find((f) => f.key === activePin.type).label} 핀
                    </span>
                    <button type="button" className="om-chip" onClick={() => setPinConfirmOpen(true)}>
                      삭제하기
                    </button>
                  </>
                )}
              </div>
            </div>

            <label className="om-label">핀 이름</label>
            <input className="om-input om-input-lg" value={activePin ? activePin.name : ''} readOnly />

            <label className="om-label om-mt-sm">핀 좌표 (이미지 픽셀)</label>
            <div className="om-coords">
              <CoordInput
                label="X"
                value={activePin ? activePin.x : ''}
                max={image?.width ?? 0}
                onCommit={(x) => movePin(activePin.id, x, activePin.y)}
              />
              <CoordInput
                label="Y"
                value={activePin ? activePin.y : ''}
                max={image?.height ?? 0}
                onCommit={(y) => movePin(activePin.id, activePin.x, y)}
              />
            </div>

            <div className="om-row-between om-mt-sm">
              <span className="om-label">할당 상태</span>
              {activePin && (
                <span className="om-pill-highlight">{activePin.boothId ? '할당 완료' : '미할당'}</span>
              )}
            </div>

            <h2 className="om-panel-title om-mt">승인된 부스 할당</h2>
            <p className="om-panel-sub">승인된 부스만 지도에 배치할 수 있어요.</p>

            <div className="om-stats">
              <div className="om-stat">
                <span>총원</span>
                <strong>{totalCount}</strong>
              </div>
              <div className="om-stat">
                <span>배치 완료</span>
                <strong>{placedCount}</strong>
              </div>
              <div className="om-stat is-highlight">
                <span>미배치</span>
                <strong>{totalCount - placedCount}</strong>
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
                <li key={b.id}>
                  <button
                    type="button"
                    className={`om-booth${selected === b.id ? ' is-selected' : ''}`}
                    disabled={isPlaced(b.id) && activePin?.boothId !== b.id}
                    onClick={() => setSelected(b.id)}
                  >
                    <span className={`om-radio${selected === b.id ? ' is-on' : ''}`} />
                    <span className="om-booth-no">{b.id}</span>
                    <span className="om-booth-name">{b.name}</span>
                    <span className="om-booth-cat">{b.category}</span>
                    <span className="om-tag-fill">{isPlaced(b.id) ? '배치 완료' : '미배치'}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="om-note">선택한 부스가 지도에 배치돼요.</p>
            <button
              type="button"
              className="om-btn om-btn-primary om-btn-block"
              disabled={
                !activePin || activePin.type !== PIN_TYPE.BOOTH || selected === null || isPlaced(selected)
              }
              onClick={assignBooth}
            >
              부스 할당하기
            </button>
          </section>
        </div>
    </OrganizerLayout>
  )
}
