import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/authApi'
import { setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './AuthContext'

// Who is logged in. The session itself lives in the backend's cookie; this only mirrors it.
//
//   user      null (logged out) | { id, nickname, phoneNumber, email }
//   ready     false until the first /api/me check finishes (avoid flashing the login screen)
//   login(loginId, password)  throws ApiError on failure
//   logout()                  always clears local state, even if the request fails
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Restore the session after a page refresh.
  useEffect(() => {
    let alive = true
    authApi
      .getMe()
      .then((me) => alive && setUser(me))
      .catch(() => {})
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  // Session expired / ended elsewhere: any 401 on an authenticated call logs the UI out.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(() => {})
  }, [])

  const login = useCallback(async (loginId, password) => {
    await authApi.login(loginId, password)
    setUser(await authApi.getMe())
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Already logged out on the server, or unreachable: either way, leave.
    }
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
