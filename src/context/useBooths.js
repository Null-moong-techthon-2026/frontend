import { useContext } from 'react'
import { BoothsContext } from './BoothsContext'

// { summary, loading, error, refreshSummary } — see BoothsProvider.
export function useBooths() {
  const value = useContext(BoothsContext)
  if (!value) throw new Error('useBooths must be used inside <BoothsProvider>')
  return value
}
