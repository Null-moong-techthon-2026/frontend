import { useContext } from 'react'
import { NoticesContext } from './NoticesContext'

// { notices, saveNotice, closeNotice, reopenNotice, deleteNotice } — see NoticesProvider.
export function useNotices() {
  const value = useContext(NoticesContext)
  if (!value) throw new Error('useNotices must be used inside <NoticesProvider>')
  return value
}
