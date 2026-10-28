import { useContext } from 'react'
import { MapContext } from './MapContext'

// { image, pins, setPins, draft, published, dirty, loading, error, reload, uploadFloorPlan,
//   startFromPublished, savePins, publish, discardDraft } — see MapProvider.
export function useMap() {
  const value = useContext(MapContext)
  if (!value) throw new Error('useMap must be used inside <MapProvider>')
  return value
}
