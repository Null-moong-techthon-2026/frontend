import './floor-map.css'

// Read-only view of the event map made in 지도 제작: the floor-plan image with its pins.
// Pin positions are pixels of the ORIGINAL image, so they are drawn as percentages of the
// image box and stay exact at any size.
//
//   image             MapProvider's image ({ url, width, height }); renders nothing when null
//   pins              MapProvider's pins
//   booths            Booth[] — used to show the number of the highlighted booth
//   highlightBoothId  booth whose pin is emphasised
//   labelBooths       write each booth's name next to its pin (for the large view)
//   onSelectBooth     (boothId) => void — makes booth pins clickable
//   maxHeight         CSS length limiting the picture's height
export default function FloorMap({
  image,
  pins,
  booths,
  highlightBoothId = null,
  labelBooths = false,
  onSelectBooth,
  maxHeight = '260px',
}) {
  if (!image) return null
  const ready = image.width > 0 && image.height > 0

  return (
    <div className="fm-wrap">
      <div className="fm" style={{ '--fm-max-h': maxHeight }}>
        <img src={image.url} alt="행사장 평면도" draggable={false} />
        {ready &&
          pins.map((pin) => {
            const booth = pin.boothId != null ? booths.find((b) => b.id === pin.boothId) : null
            const selected = booth != null && booth.id === highlightBoothId
            const style = {
              left: `${(pin.x / image.width) * 100}%`,
              top: `${(pin.y / image.height) * 100}%`,
            }
            const className = `fm-pin${booth ? ' is-booth' : ' is-other'}${selected ? ' is-selected' : ''}`
            const content = (
              <>
                {selected ? <span className="fm-num">{booth.boothNo ?? ''}</span> : null}
                {labelBooths && booth && !selected ? <span className="fm-label">{booth.name}</span> : null}
                {labelBooths && selected ? <span className="fm-label is-selected">{booth.name}</span> : null}
              </>
            )
            return booth && onSelectBooth ? (
              <button
                key={pin.id}
                type="button"
                className={className}
                style={style}
                aria-label={`${booth.name} 선택`}
                onClick={() => onSelectBooth(booth.id)}
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
