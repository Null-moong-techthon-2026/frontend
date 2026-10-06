import { useContext } from 'react'
import { BoothsContext } from './BoothsContext'

// { booths, setStatus, editNotes, setOperatingStatus, setMenuStock } — see BoothsProvider.
export function useBooths() {
  const value = useContext(BoothsContext)
  if (!value) throw new Error('useBooths must be used inside <BoothsProvider>')
  return value
}
