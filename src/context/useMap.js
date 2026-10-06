import { useContext } from 'react'
import { MapContext } from './MapContext'

// { image, setImage, pins, setPins } — see MapProvider.
export function useMap() {
  const value = useContext(MapContext)
  if (!value) throw new Error('useMap must be used inside <MapProvider>')
  return value
}
