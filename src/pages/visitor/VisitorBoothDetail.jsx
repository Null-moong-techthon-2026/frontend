import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { getPublicBooth } from '../../api/visitorApi'
import MobileLayoutFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { BoothThumb, LoadingBlock, OperationChip, StockChip } from '../../components/mobile/MobileUi'
import { boothSubtitle, hoursText, won } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './visitor.css'

// 02-1 부스 상세 · 일반 사용자
export default function VisitorBoothDetail() {
  const navigate = useNavigate()
  const { boothId } = useParams()
  const { event, base } = useOutletContext()
  const { data: booth, error, reload } = useAsync(() => getPublicBooth(event.id, boothId), [event.id, boothId])

  if (!booth) {
    return (
      <>
        <button type="button" className="mb-back" onClick={() => navigate(`${base}/booths`)}>
          <MIcon name="back" size={18} />
          부스 목록
        </button>
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      <button type="button" className="mb-back" onClick={() => navigate(`${base}/booths`)}>
        <MIcon name="back" size={18} />
        부스 목록
      </button>
      <BoothThumb booth={booth} className="is-hero" />
      {booth.photos?.length > 1 && (
        <div className="vs-gallery">
          {booth.photos.slice(1).map((url) => (
            <img key={url} src={url} alt="" />
          ))}
        </div>
      )}
      <div className="vs-title">
        <h1 className="mb-title is-sm">{booth.name}</h1>
        <OperationChip status={booth.operationStatus} />
      </div>
      <p className="mb-muted">{boothSubtitle(booth)}</p>
      {booth.intro && <p className="vs-intro">{booth.intro}</p>}
      {booth.hours && (
        <p className="vs-hours">
          <MIcon name="clock" size={15} />
          {hoursText(booth.hours)}
        </p>
      )}

      <div className="mb-card">
        <h3>메뉴 · 상품</h3>
        {booth.items.length === 0 ? (
          <p className="mb-muted">등록된 메뉴가 없어요.</p>
        ) : (
          <ul className="vs-items">
            {booth.items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{won(item.priceKrw)}</small>
                </span>
                <StockChip status={item.stockStatus} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {booth.snsUrl && (
        <a className="mb-card vs-sns" href={booth.snsUrl} target="_blank" rel="noreferrer">
          부스 SNS 보기
          <MIcon name="external" size={16} />
        </a>
      )}

      <MobileLayoutFooter>
        <button
          type="button"
          className="mb-btn is-primary"
          disabled={!booth.placement}
          onClick={() => navigate(`${base}/map?booth=${booth.id}`)}
        >
          {booth.placement ? '지도에서 보기' : '지도에 아직 배치되지 않았어요'}
        </button>
      </MobileLayoutFooter>
    </>
  )
}
