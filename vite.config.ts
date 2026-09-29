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
        const sandbox = (req.url ?? '').startsWith('/sandbox/')
        res.setHeader('Content-Security-Policy', sandbox ? SANDBOX_CSP : CSP)
        res.setHeader('X-Frame-Options', sandbox ? 'SAMEORIGIN' : 'DENY')
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin(), previewSecurityHeaders()],
  worker: { format: 'es' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
