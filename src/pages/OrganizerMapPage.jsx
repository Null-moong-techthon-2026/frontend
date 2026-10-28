import { useEffect, useRef, useState } from 'react'
import { listAllBooths } from '../api/boothApi'
import OrganizerLayout, { Icon } from '../components/OrganizerLayout'
import Toast from '../components/Toast'
import { BOOTH_CATEGORY_LABEL } from '../constants/booth'
import { apiErrorMessage } from '../constants/errors'
import { FACILITIES, MAP_IMAGE_MAX_BYTES, MAP_IMAGE_TYPES, MAP_PIN_MAX, PIN_TYPE } from '../constants/map'
import { useEvent } from '../context/useEvent'
import { useMap } from '../context/useMap'
import { useToast } from '../utils/useToast'
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
  // The draft floor plan and its pins live in MapProvider (saved to / loaded from the backend).
  const {
    image,
    pins,
    setPins,
    draft,
    published,
    dirty,
    loading,
    error: mapError,
    uploadFloorPlan,
    startFromPublished,
    savePins,
    publish,
    discardDraft,
  } = useMap()
  const { event } = useEvent()
  const { toast, notify } = useToast()
  const [busy, setBusy] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [boothQuery, setBoothQuery] = useState('')
  const [booths, setBooths] = useState([]) // { id, code, name, category } of every registered booth
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState('cursor')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pinConfirmOpen, setPinConfirmOpen] = useState(false)
  const pinDragRef = useRef(null)
  const suppressClickRef = useRef(false)
  const downWasActiveRef = useRef(false)
  const [placing, setPlacing] = useState(false)
  // Pin coords are in the uploaded image's own pixel space (0..width, 0..height), not screen px.
  const [activePinId, setActivePinId] = useState(null)
  const stageRef = useRef(null)
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  // A booth counts as placed once some pin carries its id.
  // Only approved or registered booths (from 부스 관리) exist as booths and can be placed.
  const BOOTHS = booths
  const isPlaced = (id) => pins.some((p) => p.boothId === id)
  const search = boothQuery.trim().toLowerCase()
  const visibleBooths = BOOTHS.filter((b) => tab === 'all' || !isPlaced(b.id)).filter(
    (b) => !search || b.name.toLowerCase().includes(search) || b.code.toLowerCase().includes(search),
  )
  const totalCount = BOOTHS.length
  const placedCount = BOOTHS.filter((b) => isPlaced(b.id)).length
  // What a pin is called: the booth's name, or the facility's label.
  const pinName = (pin) =>
    pin.boothId
      ? (BOOTHS.find((b) => b.id === pin.boothId)?.name ?? '')
      : pin.type === PIN_TYPE.BOOTH
        ? ''
        : pin.label

  // What visitors will NOT see on the published map: booth pins without a booth, and pins whose
  // booth is still hidden from visitors (the backend leaves both out of the public map).
  const boothPins = pins.filter((p) => p.type === PIN_TYPE.BOOTH)
  const unassignedPins = boothPins.filter((p) => !p.boothId).length
  const hiddenPins = boothPins.filter(
    (p) => p.boothId && !BOOTHS.find((b) => b.id === p.boothId)?.visible,
  ).length
  const publishWarnings = [
    unassignedPins > 0 &&
      `부스가 할당되지 않은 부스 핀이 ${unassignedPins}개 있어요. 게시해도 방문객 지도에는 나오지 않아요.`,
    hiddenPins > 0 &&
      `핀에 할당된 부스 ${hiddenPins}개가 방문객에게 비공개 상태예요. 실시간 운영 현황에서 공개로 바꾸기 전까지 방문객 지도에 나오지 않아요.`,
  ].filter(Boolean)

  useEffect(() => {
    let alive = true
    listAllBooths(event.id)
      .then((list) => {
        if (!alive) return
        setBooths(
          list.map((b) => ({
            id: b.eventBoothId,
            code: b.boothCode,
            name: b.name,
            category: b.categoryCode,
            visible: b.visibilityStatus === 'PUBLIC',
          })),
        )
      })
      .catch((err) => alive && notify(apiErrorMessage(err), 'error'))
    return () => {
      alive = false
    }
  }, [event.id, notify])

  // Runs a backend call with the buttons locked; failures show as a message.
  const run = async (action, successMessage) => {
    if (busy) return false
    setBusy(true)
    try {
      await action()
      if (successMessage) notify(successMessage)
      return true
    } catch (err) {
      notify(apiErrorMessage(err), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }

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

  // Uploads the image and starts a draft map with it.
  const loadFile = async (file) => {
    if (!file) return
    if (!MAP_IMAGE_TYPES.includes(file.type)) return notify('PNG 또는 JPG 이미지만 올릴 수 있어요.', 'error')
    if (file.size > MAP_IMAGE_MAX_BYTES) return notify('이미지는 최대 10MB까지 올릴 수 있어요.', 'error')
    const ok = await run(() => uploadFloorPlan(file), '평면도를 올렸어요.')
    if (ok) {
      setPlacing(false)
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    loadFile(e.dataTransfer.files[0])
  }

  // Deleting the image deletes the whole draft (its pins too). The published map stays.
  const removeImage = async () => {
    const ok = await run(discardDraft, '편집 중이던 지도를 삭제했어요.')
    if (ok) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setPlacing(false)
      setActivePinId(null)
      setSelected(null)
    }
  }

  const save = () => run(savePins, '지도를 저장했어요.')

  const publishNow = async () => {
    setPublishOpen(false)
    const ok = await run(publish, '지도를 게시했어요. 이제 방문객에게 보여요.')
    if (ok) {
      setActivePinId(null)
      setSelected(null)
    }
  }

  const startFromPublishedMap = async () => {
    const ok = await run(startFromPublished, '게시된 지도로 편집을 시작했어요.')
    if (ok) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
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
      prev.map((p) => (p.id === activePin.id ? { ...p, boothId: booth.id, label: booth.code } : p)),
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
    if (pins.length >= MAP_PIN_MAX) {
      setPlacing(false)
      return notify(`핀은 최대 ${MAP_PIN_MAX}개까지 만들 수 있어요.`, 'error')
    }
    // Pin ids are made here (the backend keeps them), so use a UUID.
    const id = crypto.randomUUID()
    setActivePinId(id)
    setSelected(null)
    setPins((prev) => [
      ...prev,
      {
        id,
        type: facility,
        label: FACILITIES.find((f) => f.key === facility).label,
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
          {dirty && <span className="om-dirty">저장하지 않은 변경 사항이 있어요</span>}
          <button type="button" className="om-btn om-btn-outline">미리보기</button>
          <button
            type="button"
            className="om-btn om-btn-outline"
            disabled={!draft || busy || !dirty}
            onClick={save}
          >
            저장하기
          </button>
          <button
            type="button"
            className="om-btn om-btn-primary"
            disabled={!draft || busy}
            onClick={() => setPublishOpen(true)}
          >
            게시하기
          </button>
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
                accept="image/png,image/jpeg"
                className="om-file-input"
                disabled={busy || loading}
                onChange={(e) => {
                  loadFile(e.target.files[0])
                  e.target.value = ''
                }}
              />
              <Icon name="upload" />
              <p className="om-dropzone-title">{busy ? '올리는 중…' : '평면도 업로드'}</p>
              <p className="om-dropzone-sub">이미지를 끌어서 놓거나 클릭해서 선택하세요.</p>
              <p className="om-dropzone-sub">PNG, JPG · 최대 10MB</p>
            </label>
            )}
            {!image && published && (
              <div className="om-published">
                <p>
                  <strong>게시된 지도 v{published.versionNo}</strong>가 있어요. 방문객에게는 이 지도가
                  보여요.
                </p>
                <button
                  type="button"
                  className="om-btn om-btn-outline om-btn-block"
                  disabled={busy}
                  onClick={startFromPublishedMap}
                >
                  게시된 지도로 수정 시작
                </button>
              </div>
            )}
            {mapError && !loading && <p className="om-map-error">{apiErrorMessage(mapError)}</p>}
            {image && (
              <div className="om-file">
                <Icon name="image" />
                <span className="om-file-name">{image.name}</span>
                {draft && <span className="om-file-version">초안 v{draft.versionNo}</span>}
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
                            aria-label={`${pinName(pin) || '부스'} 핀`}
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
                  {pinName(activePin) ? `'${pinName(activePin)}' 핀이` : '선택한 핀이'} 지도에서 삭제되며,
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
                <p>
                  편집 중인 평면도와 핀이 모두 삭제되며, 이 작업은 되돌릴 수 없어요. 이미 게시한 지도는
                  그대로 남아요.
                </p>
                <div className="om-confirm-actions">
                  <button type="button" className="om-btn om-btn-outline" onClick={() => setConfirmOpen(false)}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="om-btn om-btn-danger"
                    onClick={() => {
                      setConfirmOpen(false)
                      removeImage()
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
            <input className="om-input om-input-lg" value={activePin ? pinName(activePin) : ''} readOnly />

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
            <p className="om-panel-sub">승인했거나 직접 등록한 부스만 지도에 배치할 수 있어요.</p>

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

            {publishWarnings.length > 0 && (
              <ul className="om-warn">
                {publishWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

            <label className="om-search om-booth-search">
              <Icon name="search" />
              <input
                placeholder="부스명 · 부스 번호 검색"
                value={boothQuery}
                onChange={(e) => setBoothQuery(e.target.value)}
              />
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
                    <span className="om-booth-no">{b.code}</span>
                    <span className="om-booth-name">{b.name}</span>
                    <span className="om-booth-cat">{BOOTH_CATEGORY_LABEL[b.category] ?? b.category}</span>
                    <span className="om-tag-fill">{isPlaced(b.id) ? '배치 완료' : '미배치'}</span>
                  </button>
                </li>
              ))}
              {visibleBooths.length === 0 && (
                <li className="om-booth-empty">
                  {BOOTHS.length === 0
                    ? '아직 승인된 부스가 없어요. 부스 관리에서 신청을 승인해 주세요.'
                    : '조건에 맞는 부스가 없어요.'}
                </li>
              )}
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
      {publishOpen && (
        <div className="om-confirm-overlay" onClick={() => setPublishOpen(false)}>
          <div
            className="om-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="om-publish-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="om-publish-title">지도를 게시할까요?</h2>
            <p>
              {dirty ? '저장하지 않은 변경 사항을 저장한 뒤 ' : ''}편집 중인 지도를 게시해요. 방문객에게는
              이 지도가 보이고, 이전에 게시한 지도는 보관돼요.
            </p>
            {publishWarnings.length > 0 && (
              <ul className="om-warn">
                {publishWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            <div className="om-confirm-actions">
              <button type="button" className="om-btn om-btn-outline" onClick={() => setPublishOpen(false)}>
                취소
              </button>
              <button type="button" className="om-btn om-btn-primary" onClick={publishNow}>
                게시
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </OrganizerLayout>
  )
}
