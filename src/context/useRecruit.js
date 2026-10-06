import { useContext } from 'react'
import { RecruitContext } from './RecruitContext'

// { recruit, updateRecruit, setPublished } — see RecruitProvider.
export function useRecruit() {
  const value = useContext(RecruitContext)
  if (!value) throw new Error('useRecruit must be used inside <RecruitProvider>')
  return value
}
