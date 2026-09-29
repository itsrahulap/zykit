# Privacy

- Images are processed locally in your browser and are never uploaded by the application.
- Metadata is parsed locally. No image, file name, hash, EXIF/GPS value or other metadata leaves the device.
- There is no backend, database, analytics or error telemetry.
- Object URLs for previews and downloads are revoked when you start over or load another image.
- Nothing is written to localStorage or IndexedDB.

## How this is enforced

1. **Architecture:** all file handling runs in a Web Worker (`src/tools/clean-image/workers/image.worker.ts`) that contains no network code.
2. **Content Security Policy:** `connect-src 'self'` and `default-src 'none'` block requests to any third-party origin, even if a dependency tried to make one. Headers ship in `public/_headers` (Netlify/Cloudflare) and `vercel.json`. `vite preview` uses the same policy.
3. **Automated check:** `e2e/clean-image.spec.ts` records every request while an image is processed and fails if any request is not a same-origin `GET`, or if any console/CSP error occurs.

## Verify it yourself

Open DevTools → Network, clear the log, then drop an image and clean it. The only requests you'll see are the app's own static assets (e.g. the worker script on first use), plus `blob:` URLs, which are local.

## C2PA

When a C2PA manifest is present, CleanImage shows the claim generator and whether the manifest references AI-generated content. It does **not** validate signatures. Removing the embedded manifest does not remove provenance records the issuer may keep elsewhere.
