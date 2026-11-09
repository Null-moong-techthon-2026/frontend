import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { getPublicMapView, listPublicBooths } from '../../api/visitorApi'
import MIcon from '../../components/mobile/MobileIcons'
import { BoothThumb, LoadingBlock, OperationChip } from '../../components/mobile/MobileUi'
import { BOOTH_CATEGORY, BOOTH_CATEGORY_LABEL, BOOTH_OPERATING_STATUS as OP } from '../../constants/booth'
import { FACILITIES, PIN_TYPE } from '../../constants/map'
import { boothSubtitle, hoursText } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_STEP = 0.5
const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))

// 03 지도 · 일반 사용자 (+ 03-1 핀을 눌렀을 때 아래에 미니 카드)
export default function VisitorMap() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  return (
    <EventMap
      eventId={event.id}
      action={(booth) => (
        <button type="button" className="mb-btn is-primary" onClick={() => navigate(`${base}/booths/${booth.id}`)}>
          부스 상세 보기
        </button>
      )}
    />
  )
}

// The floor map of one event: filters, pins, pinch zoom. `action(booth)` gives the button under the
// card of the booth that was picked (the visitor app opens the booth page, the booth operator's
// app opens their own booth). The picked booth can come with the address: ?booth=<id>.
export function EventMap({ eventId, action }) {
  const [params] = useSearchParams()
  const { data: map, loading: mapLoading, error: mapError, reload } = useAsync(() => getPublicMapView(eventId), [eventId])
  const { data: booths } = useAsync(() => listPublicBooths(eventId), [eventId])

  const [category, setCategory] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [hiddenTypes, setHiddenTypes] = useState([]) // pin types switched off with the chips
  const [selectedId, setSelectedId] = useState(params.get('booth'))
  const [zoom, setZoom] = useState(1)
  const viewRef = useRef(null) // the scrolling frame of the picture
  const innerRef = useRef(null) // the picture + pins, as wide as the zoom says
  const zoomRef = useRef(1)
  const anchor = useRef(null) // the spot of the picture that stays under the fingers while zooming
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  // Zoom to `next`, keeping the picture point under (x, y) of the frame where it is.
  const zoomAround = (next, x, y) => {
    const view = viewRef.current
    const inner = innerRef.current
    if (!view || !inner) return setZoom(clampZoom(next))
    anchor.current = {
      fx: (view.scrollLeft + x) / inner.offsetWidth,
      fy: (view.scrollTop + y) / inner.offsetHeight,
      x,
      y,
    }
    setZoom(clampZoom(next))
  }
  useLayoutEffect(() => {
    const a = anchor.current
    const view = viewRef.current
    const inner = innerRef.current
    if (!a || !view || !inner) return
    view.scrollLeft = a.fx * inner.offsetWidth - a.x
    view.scrollTop = a.fy * inner.offsetHeight - a.y
    anchor.current = null
  }, [zoom])

  // Pinch with two fingers to zoom; one finger scrolls the zoomed picture (or the page) as usual.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return undefined
    let start = null // { dist, zoom }
    const spread = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = (e) => {
      if (e.touches.length === 2) start = { dist: spread(e.touches), zoom: zoomRef.current }
    }
    const onMove = (e) => {
      if (e.touches.length !== 2 || !start) return
      e.preventDefault() // otherwise the browser zooms the whole page
      const box = view.getBoundingClientRect()
      const x = (e.touches[0].clientX + e.touches[1].clientX) / 2 - box.left
      const y = (e.touches[0].clientY + e.touches[1].clientY) / 2 - box.top
      zoomAround(start.zoom * (spread(e.touches) / start.dist), x, y)
    }
    const onEnd = (e) => {
      if (e.touches.length < 2) start = null
    }
    view.addEventListener('touchstart', onStart, { passive: true })
    view.addEventListener('touchmove', onMove, { passive: false })
    view.addEventListener('touchend', onEnd, { passive: true })
    view.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      view.removeEventListener('touchstart', onStart)
      view.removeEventListener('touchmove', onMove)
      view.removeEventListener('touchend', onEnd)
      view.removeEventListener('touchcancel', onEnd)
    }
  }, [map])

  const boothById = useMemo(() => new Map((booths ?? []).map((b) => [b.id, b])), [booths])
  const selected = selectedId ? boothById.get(selectedId) : null

  const visiblePins = (map?.pins ?? []).filter((pin) => {
    if (hiddenTypes.includes(pin.pinType)) return false
    if (pin.pinType !== PIN_TYPE.BOOTH) return true
    const booth = boothById.get(pin.boothId)
    if (!booth) return true
    if (category && booth.categoryCode !== category) return false
    return !openOnly || booth.operationStatus === OP.OPEN
  })

  const toggleType = (type) =>
    setHiddenTypes((list) => (list.includes(type) ? list.filter((t) => t !== type) : [...list, type]))
  // The buttons zoom around the middle of what is on screen.
  const changeZoom = (delta) => {
    const view = viewRef.current
    zoomAround(zoomRef.current + delta, (view?.clientWidth ?? 0) / 2, (view?.clientHeight ?? 0) / 2)
  }

  if (!map) {
    return (
      <>
        <h1 className="mb-title">지도</h1>
        {mapLoading || mapError ? (
          <LoadingBlock error={mapError} onRetry={reload} />
        ) : (
          <p className="mb-empty">아직 공개된 행사장 지도가 없어요.</p>
        )}
      </>
    )
  }

  return (
    <>
      <h1 className="mb-title">지도</h1>
      <div className="vs-filters" style={{ marginTop: 14 }}>
        <select className="mb-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="카테고리">
          <option value="">전체 카테고리</option>
          {Object.values(BOOTH_CATEGORY).map((c) => (
            <option key={c} value={c}>
              {BOOTH_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <label className="vs-check">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
          운영 중만 보기
        </label>
      </div>
      <div className="vs-types">
        {FACILITIES.map((f) => (
          <button
            key={f.key}
            type="button"
            className={hiddenTypes.includes(f.key) ? '' : 'is-on'}
            aria-pressed={!hiddenTypes.includes(f.key)}
            onClick={() => toggleType(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="vs-map-box">
      <div className={`vs-map${zoom > 1 ? ' is-zoomed' : ''}`} ref={viewRef}>
        <div className="vs-map-inner" ref={innerRef} style={{ width: `${zoom * 100}%` }}>
          <img src={map.image.url} alt="행사장 평면도" draggable={false} />
          {visiblePins.map((pin) => {
            const booth = pin.boothId ? boothById.get(pin.boothId) : null
            const isBooth = pin.pinType === PIN_TYPE.BOOTH
            const open = booth?.operationStatus === OP.OPEN
            const tone = !isBooth ? 'is-facility' : open ? 'is-open' : 'is-off'
            const label = isBooth ? (booth?.code ?? '') : pin.label
            return (
              <button
                key={pin.id}
                type="button"
                className={`vs-pin ${tone}${pin.boothId && pin.boothId === selectedId ? ' is-selected' : ''}`}
                style={{ left: `${pin.xRatio * 100}%`, top: `${pin.yRatio * 100}%` }}
                aria-label={booth ? `${booth.name} 선택` : pin.label}
                onClick={() => setSelectedId(pin.boothId ?? null)}
              >
                <MIcon name="pin" size={22} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="vs-zoom is-float">
        <button type="button" onClick={() => changeZoom(ZOOM_STEP)} aria-label="확대" disabled={zoom >= ZOOM_MAX}>
          +
        </button>
        <button type="button" onClick={() => changeZoom(-ZOOM_STEP)} aria-label="축소" disabled={zoom <= ZOOM_MIN}>
          −
        </button>
        {zoom > 1 && (
          <button type="button" className="is-wide" onClick={() => zoomAround(1, 0, 0)}>
            전체
          </button>
        )}
      </div>
      </div>

      <div className="vs-map-tools">
        <ul className="vs-legend">
          <li>
            <i className="is-open" /> 운영 중
          </li>
          <li>
            <i className="is-off" /> 준비 중 · 마감
          </li>
          <li>
            <i className="is-facility" /> 편의시설
          </li>
        </ul>
        <span className="mb-muted">핀을 눌러보세요</span>
      </div>
      <p className="mb-muted vs-map-tip">두 손가락으로 벌려서 확대하고, 한 손가락으로 끌어서 움직여요.</p>

      {selected && (
        <div className="mb-card vs-mini">
          <div className="vs-mini-row">
            <BoothThumb booth={selected} />
            <span className="vs-booth-body">
              <span className="vs-booth-head">
                <strong>{selected.name}</strong>
                <OperationChip status={selected.operationStatus} />
              </span>
              <small>{[boothSubtitle(selected), hoursText(selected.hours)].filter(Boolean).join(' · ')}</small>
            </span>
          </div>
          {action?.(selected)}
        </div>
      )}
    </>
  )
}
