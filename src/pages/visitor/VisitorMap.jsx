import { useMemo, useState } from 'react'
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
const ZOOM_MAX = 3
const ZOOM_STEP = 0.5

// 03 지도 · 일반 사용자 (+ 03-1 핀을 눌렀을 때 아래에 미니 카드)
export default function VisitorMap() {
  const navigate = useNavigate()
  const { event, base } = useOutletContext()
  const [params] = useSearchParams()
  const { data: map, loading: mapLoading, error: mapError, reload } = useAsync(() => getPublicMapView(event.id), [event.id])
  const { data: booths } = useAsync(() => listPublicBooths(event.id), [event.id])

  const [category, setCategory] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [hiddenTypes, setHiddenTypes] = useState([]) // pin types switched off with the chips
  const [selectedId, setSelectedId] = useState(params.get('booth'))
  const [zoom, setZoom] = useState(1)

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
  const changeZoom = (delta) => setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)))

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

      <div className={`vs-map${zoom > 1 ? ' is-zoomed' : ''}`}>
        <div className="vs-map-inner" style={{ width: `${zoom * 100}%` }}>
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
      <div className="vs-zoom">
        <button type="button" onClick={() => changeZoom(ZOOM_STEP)} aria-label="확대" disabled={zoom >= ZOOM_MAX}>
          +
        </button>
        <button type="button" onClick={() => changeZoom(-ZOOM_STEP)} aria-label="축소" disabled={zoom <= ZOOM_MIN}>
          −
        </button>
        <button type="button" className="is-wide" onClick={() => setZoom(1)}>
          전체 보기
        </button>
      </div>

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
          <button type="button" className="mb-btn is-primary" onClick={() => navigate(`${base}/booths/${selected.id}`)}>
            부스 상세 보기
          </button>
        </div>
      )}
    </>
  )
}
