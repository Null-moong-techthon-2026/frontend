import { useContext } from 'react'
import { InvitationContext } from './InvitationContext'

// { invitation, issued, loading, issue, revoke } — see InvitationProvider.
export function useInvitation() {
  const value = useContext(InvitationContext)
  if (!value) throw new Error('useInvitation must be used inside <InvitationProvider>')
  return value
}
