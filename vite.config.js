import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The backend has no CORS configuration, so the dev server forwards /api to it. The browser
    // then only talks to this origin, which keeps the session cookie first-party.
    // Backend: `docker compose up -d --wait db` + `.\gradlew.bat bootRun` in backend-main.
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
})
