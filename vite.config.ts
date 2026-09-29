/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { seoPlugin } from './scripts/seo-plugin.ts'

// Same policy as public/_headers and vercel.json; applied to `vite preview` so e2e tests run under it.
const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; font-src 'self'; " +
  "connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; base-uri 'none'; form-action 'none'; " +
  "frame-ancestors 'none'; object-src 'none'"

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  worker: { format: 'es' },
  preview: { headers: { 'Content-Security-Policy': CSP } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
