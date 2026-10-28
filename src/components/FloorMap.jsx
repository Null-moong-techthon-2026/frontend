import './floor-map.css'

// Read-only view of the event map: the floor-plan image with its pins. Pin positions are ratios
// (0..1) of the image, drawn as percentages of the image box, so they stay exact at any size.
//
//   image             null | { url }; renders nothing when null
//   pins              { id, xRatio, yRatio, boothId, name, boothCode }[]
//                     boothId is the event booth the pin stands for (null for facilities);
//                     name / boothCode are that booth's, used for the labels
//   highlightBoothId  booth whose pin is emphasised (shows its booth code)
//   labelBooths       write each booth's name next to its pin (for the large view)
//   onSelectBooth     (boothId) => void — makes booth pins clickable
//   maxHeight         CSS length limiting the picture's height
export default function FloorMap({
  image,
  pins,
  highlightBoothId = null,
  labelBooths = false,
  onSelectBooth,
  maxHeight = '260px',
}) {
  if (!image) return null

  return (
    <div className="fm-wrap">
      <div className="fm" style={{ '--fm-max-h': maxHeight }}>
        <img src={image.url} alt="행사장 평면도" draggable={false} />
        {pins.map((pin) => {
          const isBooth = pin.boothId != null
          const selected = isBooth && pin.boothId === highlightBoothId
          const style = {
            left: `${pin.xRatio * 100}%`,
            top: `${pin.yRatio * 100}%`,
          }
          const className = `fm-pin${isBooth ? ' is-booth' : ' is-other'}${selected ? ' is-selected' : ''}`
          const content = (
            <>
              {selected ? <span className="fm-num">{pin.boothCode ?? ''}</span> : null}
              {labelBooths && isBooth && !selected ? <span className="fm-label">{pin.name}</span> : null}
              {labelBooths && selected ? <span className="fm-label is-selected">{pin.name}</span> : null}
            </>
          )
          return isBooth && onSelectBooth ? (
            <button
              key={pin.id}
              type="button"
              className={className}
              style={style}
              aria-label={`${pin.name} 선택`}
              onClick={() => onSelectBooth(pin.boothId)}
            >
              {content}
            </button>
          ) : (
            <span key={pin.id} className={className} style={style}>
              {content}
            </span>
          )
        })}
      </div>
    </div>
  )
}
