import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The deployed backend (Swagger: /swagger-ui/index.html).
const BACKEND = 'https://boothluck-3-26-67-198.sslip.io'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser only talks to this dev server, which forwards /api to the deployed backend, so
    // the session cookie stays first-party. (The backend answers any cross-origin call with 403.)
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        configure: (proxy) => {
          // Drop the Origin header: the call is same-origin for the browser, and the backend's CORS
          // filter would refuse the dev server's origin.
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
          // The session cookie is marked Secure; the dev server speaks plain http, so unmark it.
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie']
            if (cookies) proxyRes.headers['set-cookie'] = cookies.map((c) => c.replace(/;\s*Secure/i, ''))
          })
        },
      },
    },
  },
})
