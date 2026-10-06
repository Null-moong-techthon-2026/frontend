import { useState } from 'react'
import { MapContext } from './MapContext'

// Single source of truth for the event map: the uploaded floor plan and the pins on it.
// 지도 제작 edits it; 실시간 운영 현황 reads it (booth positions), so both always agree and the
// map survives switching pages (until the page is reloaded).
//
//   image  null | { url, name, width, height }   width/height = natural pixels of the image
//   pins   { id, type, name, boothId, x, y }[]   x/y are pixels of the ORIGINAL image
//
// `setImage` / `setPins` are plain React state setters (they also accept an updater function).
//
// TODO(backend): initialise both from GET /map and save with PUT /map
// (see "Where to connect" in BACKEND_INTEGRATION.md).
export default function MapProvider({ children }) {
  const [image, setImage] = useState(null)
  const [pins, setPins] = useState([])

  return (
    <MapContext.Provider value={{ image, setImage, pins, setPins }}>{children}</MapContext.Provider>
  )
}
