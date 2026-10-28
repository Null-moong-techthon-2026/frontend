// Preview mode: opening any page with ?demo=1 shows the wireframe's sample content (비룡제 2026,
// 달빛 떡볶이, ...) instead of the server's data, so every screen can be looked at while the
// backend has no data yet. ?demo=0 turns it off. It is remembered for the browser tab.
// Normal use never touches it: without the flag only real server data is shown.

const KEY = 'boothluck.demo'

export function isDemo() {
  try {
    const flag = new URLSearchParams(window.location.search).get('demo')
    if (flag === '1') sessionStorage.setItem(KEY, '1')
    if (flag === '0') sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// The account shown while previewing and not logged in.
export const DEMO_USER = {
  id: 'demo-user',
  nickname: '김민서',
  phoneNumber: '01000000000',
  email: 'booth@example.com',
}

// A small wait so preview screens show their loading state like real ones.
export const demoDelay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120))
