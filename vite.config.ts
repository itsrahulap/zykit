/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { seoPlugin } from './scripts/seo-plugin.ts'

// Same policies as public/_headers and vercel.json; applied to `vite preview` so e2e tests run under them.
const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; font-src 'self'; " +
  "connect-src 'self'; worker-src 'self' blob:; frame-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; " +
  "frame-ancestors 'none'; object-src 'none'"
// The SQLite worker of Query CSV with SQL (assets/sql-worker-*.js) compiles WebAssembly. A dedicated
// worker takes its CSP from its own script response, so only that script gets 'wasm-unsafe-eval'.
const SQL_WORKER_CSP = CSP.replace("script-src 'self'", "script-src 'self' 'wasm-unsafe-eval'")
// The lesson-code sandbox (public/sandbox/, loaded in <iframe sandbox>): may eval, may be framed by this site, no network.
const SANDBOX_CSP =
  "default-src 'none'; script-src 'self' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; " +
  "base-uri 'none'; form-action 'none'; frame-ancestors 'self'; object-src 'none'"

/** Sets the CSP per path in `vite preview` (a single global header can't express the sandbox's policy). */
function previewSecurityHeaders(): Plugin {
  return {
    name: 'preview-security-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        const sandbox = url.startsWith('/sandbox/')
        const sqlWorker = url.startsWith('/assets/sql-worker-')
        res.setHeader('Content-Security-Policy', sandbox ? SANDBOX_CSP : sqlWorker ? SQL_WORKER_CSP : CSP)
        res.setHeader('X-Frame-Options', sandbox ? 'SAMEORIGIN' : 'DENY')
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin(), previewSecurityHeaders()],
  worker: {
    format: 'es',
    // Stable name for the SQLite worker so vercel.json / public/_headers can give it its own CSP.
    rolldownOptions: {
      output: { entryFileNames: (chunk) => (chunk.name === 'sql.worker' ? 'assets/sql-worker-[hash].js' : 'assets/[name]-[hash].js') },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
