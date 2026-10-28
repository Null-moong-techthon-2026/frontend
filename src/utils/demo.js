// Preview mode: opening any page with ?demo=1 (or ?demo=2) shows the wireframe's sample content (비룡제 2026,
// 달빛 떡볶이, ...) instead of the server's data, so every screen can be looked at while the
// backend has no data yet. It is remembered for the browser tab.
// Normal use never touches it: without the flag only real server data is shown.

const KEY = 'boothluck.demo'

// ?demo=1 -> preview (an account that already took part in the event); ?demo=2 -> preview of a
// brand-new account (no event joined yet); ?demo=0 -> off. Remembered for the browser tab.
function flag() {
  try {
    const param = new URLSearchParams(window.location.search).get('demo')
    if (param === '1' || param === '2') sessionStorage.setItem(KEY, param)
    if (param === '0') sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export const isDemo = () => flag() !== null

// Preview of an account that has not joined anything yet (booth operator without a booth, staff
// who has not entered an invitation code).
export const isDemoNewcomer = () => flag() === '2'

// The account shown while previewing and not logged in.
export const DEMO_USER = {
  id: 'demo-user',
  nickname: '김민서',
  phoneNumber: '01000000000',
  email: 'booth@example.com',
}

// A small wait so preview screens show their loading state like real ones.
export const demoDelay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120))
