import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// { user, ready, login, logout } — see AuthProvider.
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
