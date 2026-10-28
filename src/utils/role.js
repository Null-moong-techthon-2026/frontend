// The backend does not store whether an account signed up as organizer or booth operator
// (onboardingType is dropped, /api/me does not return it). To still tell them apart in this
// browser, the signup screen remembers the operator accounts it created here.
// TODO(backend): replace with a role from /api/me once the backend stores it.

const KEY = 'boothrock.operatorAccounts'

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function rememberOperator(accountId) {
  try {
    const list = read()
    if (!list.includes(accountId)) localStorage.setItem(KEY, JSON.stringify([...list, accountId]))
  } catch {
    // Storage can be blocked; the account is then recognised by its applications / booths instead.
  }
}

export const isRememberedOperator = (accountId) => read().includes(accountId)
