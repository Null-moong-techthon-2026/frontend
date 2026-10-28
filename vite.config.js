import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser only talks to this dev server, which forwards /api to the backend, so the session
    // cookie stays first-party. Backend: `docker compose up -d --wait db` + `.\gradlew.bat bootRun`
    // in backend-main.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        configure: (proxy) => {
          // The backend's CORS filter only accepts the Origin http://127.0.0.1:5173 and answers
          // anything else (e.g. http://localhost:5173) with 403 "Invalid CORS request". Through this
          // proxy the call is same-origin for the browser, so drop the header: the page works from
          // localhost and 127.0.0.1 alike.
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
