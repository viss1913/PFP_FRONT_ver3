import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function siteOriginHtmlPlugin(origin: string): Plugin {
  const normalized = origin.replace(/\/$/, '')
  return {
    name: 'site-origin-html',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_ORIGIN__', normalized)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteOrigin =
    env.VITE_SITE_URL?.trim() || 'https://family-office.bank-future.com'

  return {
  plugins: [react(), siteOriginHtmlPlugin(siteOrigin)],
  server: {
    proxy: {
      '/api': {
        target: 'https://pfpbackend-production.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
