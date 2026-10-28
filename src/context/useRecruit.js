import { useContext } from 'react'
import { RecruitContext } from './RecruitContext'

// { recruit, loading, error, reload, saveRecruit, setPublished } — see RecruitProvider.
// `recruit` is null until the first load finishes.
export function useRecruit() {
  const value = useContext(RecruitContext)
  if (!value) throw new Error('useRecruit must be used inside <RecruitProvider>')
  return value
}
