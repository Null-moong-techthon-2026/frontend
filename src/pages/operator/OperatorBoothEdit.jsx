import { useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { addBoothPhoto, addItem, changeBoothInfo, changeItem, getMyBoothDetail, removeItem, saveBoothPhotos } from '../../api/operatorApi'
import MobileFooter from '../../components/mobile/MobileFooter'
import MIcon from '../../components/mobile/MobileIcons'
import { BoothThumb, LoadingBlock, MiniMap, OperationChip, StockChip } from '../../components/mobile/MobileUi'
import { apiErrorMessage } from '../../constants/errors'
import { boothSubtitle, won } from '../../utils/mobileFormat'
import { useAsync } from '../../utils/useAsync'
import './operator.css'

const MAX_PHOTOS = 10

// 06-2 내 부스 정보 수정 · 부스 운영자 (정보 수정 / 미리보기)
export default function OperatorBoothEdit() {
  const { booth } = useOutletContext()
  const { data: detail, error, reload, setData } = useAsync(() => (booth ? getMyBoothDetail(booth) : null), [booth?.id])
  if (!booth) return <Navigate to="/operator/home" replace />
  if (!detail) {
    return (
      <>
        <BackRow />
        <LoadingBlock error={error} onRetry={reload} />
      </>
    )
  }
  // The editor starts from the loaded booth and keeps what is typed while photos / saves refresh `detail`.
  return <Editor key={detail.id} detail={detail} setData={setData} />
}

const toRows = (items) => items.map((i) => ({ key: i.id, id: i.id, name: i.name, price: i.priceKrw == null ? '' : String(i.priceKrw) }))

function BackRow() {
  const navigate = useNavigate()
  return (
    <button type="button" className="mb-back" onClick={() => navigate('/operator/booth')}>
      <MIcon name="back" size={18} />내 부스
    </button>
  )
}

function Editor({ detail, setData }) {
  const [tab, setTab] = useState('edit')
  const [name, setName] = useState(detail.name)
  const [intro, setIntro] = useState(detail.intro)
  const [rows, setRows] = useState(() => toRows(detail.items))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)

  const setRow = (key, fields) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...fields } : r)))
  const addRow = () => setRows((list) => [...list, { key: `new-${Date.now()}`, id: null, name: '', price: '' }])
  const removeRow = (key) => setRows((list) => list.filter((r) => r.key !== key))

  const priceOk = (price) => /^\d*$/.test(price)
  const invalid = !name.trim() || rows.some((r) => !r.name.trim() || !priceOk(r.price))

  const save = async () => {
    if (busy || invalid) return
    setBusy(true)
    setMessage('')
    setSaved(false)
    try {
      let current = detail
      if (name.trim() !== detail.name || intro !== detail.intro) {
        current = await changeBoothInfo(detail, { name: name.trim(), description: intro })
      }
      const ref = { id: current.id, eventId: current.eventId, revision: current.revision }

      // Menu: deleted rows, changed rows, new rows - one write each.
      const keep = new Set(rows.map((r) => r.id).filter(Boolean))
      for (const item of detail.items.filter((i) => !keep.has(i.id))) current = await removeItem(ref, item)
      for (const row of rows.filter((r) => r.id)) {
        const item = detail.items.find((i) => i.id === row.id)
        const priceKrw = row.price === '' ? null : Number(row.price)
        if (item && (item.name !== row.name.trim() || item.priceKrw !== priceKrw)) {
          current = await changeItem(ref, item, { name: row.name.trim(), priceKrw })
        }
      }
      for (const [index, row] of rows.filter((r) => !r.id).entries()) {
        current = await addItem(ref, { name: row.name.trim(), priceKrw: row.price === '' ? null : Number(row.price) }, detail.items.length + index)
      }
      setData(current)
      setRows(toRows(current.items))
      setSaved(true)
    } catch (err) {
      setMessage(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const preview = {
    name: name.trim() || detail.name,
    code: detail.code,
    categoryCode: detail.categoryCode,
    operationStatus: detail.operationStatus,
    intro,
    imageUrl: detail.photos[0]?.url ?? null,
  }

  return (
    <>
      <BackRow />
      <h1 className="mb-title is-sm">내 부스 정보</h1>
      <p className="mb-sub">방문객에게 보이는 정보를 관리하세요.</p>

      <div className="mb-btn-row op-tabs">
        <button type="button" className={`mb-btn is-sm ${tab === 'edit' ? 'is-primary' : 'is-outline'}`} onClick={() => setTab('edit')}>
          정보 수정
        </button>
        <button type="button" className={`mb-btn is-sm ${tab === 'preview' ? 'is-primary' : 'is-outline'}`} onClick={() => setTab('preview')}>
          미리보기
        </button>
      </div>

      {tab === 'edit' ? (
        <>
          <div className="mb-card">
            <div className="mb-card-row">
              <h3>부스 위치</h3>
              {detail.code && <span className="mb-link">{detail.code}번</span>}
            </div>
            {detail.placement ? (
              <MiniMap placement={detail.placement} label={detail.code} />
            ) : (
              <p className="mb-muted">아직 지도에 배치되지 않았어요. 위치는 주최측이 정해요.</p>
            )}
          </div>

          <div className="mb-field">
            <label className="mb-label" htmlFor="booth-name">부스명</label>
            <input id="booth-name" className="mb-input" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-field">
            <label className="mb-label" htmlFor="booth-intro">소개</label>
            <textarea id="booth-intro" className="mb-textarea" value={intro} onChange={(e) => setIntro(e.target.value)} />
          </div>
          <div className="mb-field">
            <span className="mb-label">메뉴 · 가격</span>
            {rows.map((row) => (
              <div key={row.key} className="op-menu-row">
                <input className="mb-input" placeholder="메뉴 이름" value={row.name} maxLength={100} onChange={(e) => setRow(row.key, { name: e.target.value })} />
                <input className="mb-input op-price" placeholder="가격(원)" inputMode="numeric" value={row.price} onChange={(e) => setRow(row.key, { price: e.target.value })} />
                <button type="button" className="op-trash" aria-label={`${row.name || '메뉴'} 삭제`} onClick={() => removeRow(row.key)}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="mb-btn is-outline is-sm" onClick={addRow}>
              <MIcon name="plus" size={16} /> 메뉴 추가
            </button>
          </div>

          <PhotoManager detail={detail} setData={setData} />
        </>
      ) : (
        <Preview booth={preview} rows={rows} />
      )}

      {message && <p className="mb-error" role="alert">{message}</p>}
      {saved && <p className="op-banner">저장했어요.</p>}
      <MobileFooter>
        <button type="button" className="mb-btn is-primary" disabled={busy || invalid} onClick={save}>
          {busy ? '저장 중…' : '저장하기'}
        </button>
      </MobileFooter>
    </>
  )
}

// What the visitor will see (same layout as the visitor's booth screen).
function Preview({ booth, rows }) {
  return (
    <div className="op-preview">
      <BoothThumb booth={booth} className="is-hero" />
      <div className="vs-title">
        <h2 className="mb-title is-sm">{booth.name}</h2>
        <OperationChip status={booth.operationStatus} />
      </div>
      <p className="mb-muted">{boothSubtitle(booth)}</p>
      {booth.intro && <p className="vs-intro">{booth.intro}</p>}
      <div className="mb-card">
        <h3>메뉴 · 상품</h3>
        {rows.length === 0 ? (
          <p className="mb-muted">등록된 메뉴가 없어요.</p>
        ) : (
          <ul className="vs-items">
            {rows.map((r) => (
              <li key={r.key}>
                <span>
                  <strong>{r.name || '(이름 없음)'}</strong>
                  <small>{r.price ? won(Number(r.price)) : ''}</small>
                </span>
                <StockChip status="AVAILABLE" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// 부스 사진: saved on the spot (not with 저장하기). The first photo is the cover.
function PhotoManager({ detail, setData }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const ref = { id: detail.id, eventId: detail.eventId, revision: detail.revision }
  const ids = detail.photos.map((p) => p.id)

  const run = async (call) => {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      setData(await call())
    } catch (err) {
      setMessage(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  const add = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (file) run(() => addBoothPhoto(ref, file, ids))
  }
  const remove = (id) => run(() => saveBoothPhotos(ref, ids.filter((x) => x !== id)))
  const makeCover = (id) => run(() => saveBoothPhotos(ref, [id, ...ids.filter((x) => x !== id)]))

  return (
    <div className="mb-card op-photos">
      <div className="mb-card-row">
        <h3>부스 사진</h3>
        <small className="mb-muted">
          {detail.photos.length}/{MAX_PHOTOS} · 첫 사진이 대표예요
        </small>
      </div>
      <div className="op-photo-grid">
        {detail.photos.map((p, i) => (
          <div key={p.id} className="op-photo-item">
            {p.url ? <img src={p.url} alt={`부스 사진 ${i + 1}`} /> : <span aria-hidden="true" />}
            {i === 0 ? <b>대표</b> : <button type="button" className="op-photo-cover" disabled={busy} onClick={() => makeCover(p.id)}>대표로</button>}
            <button type="button" className="op-photo-x" aria-label="사진 삭제" disabled={busy} onClick={() => remove(p.id)}>
              ×
            </button>
          </div>
        ))}
        {detail.photos.length < MAX_PHOTOS && (
          <label className={`op-photo-add${busy ? ' is-busy' : ''}`}>
            <MIcon name="plus" size={20} />
            <span>{busy ? '올리는 중…' : '사진 추가'}</span>
            <input type="file" accept="image/png,image/jpeg" hidden disabled={busy} onChange={add} />
          </label>
        )}
      </div>
      {message && <p className="mb-error">{message}</p>}
    </div>
  )
}
