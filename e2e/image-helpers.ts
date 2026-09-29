// Helpers for the image tool specs: real images from the browser's own canvas encoder, request and
// console watching, ZIP reading and the 320 px check.

import { expect, test, type Download, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** A gradient image encoded by the page's canvas (optionally with a transparent half). */
export async function canvasImage(page: Page, mime: string, width = 240, height = 120, transparent = false): Promise<Buffer> {
  const data = await page.evaluate(
    async ({ type, w, h, alpha }) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0ea5e9');
      grad.addColorStop(1, '#f97316');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, alpha ? w / 2 : w);
      if (!alpha) g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) {
        g.fillStyle = `hsl(${(i * 37) % 360} 70% 50%)`;
        g.fillRect((i * 13) % w, (i * 7) % h, 3, 3);
      }
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), type, 0.95));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { type: mime, w: width, h: height, alpha: transparent },
  );
  return Buffer.from(data);
}

/** Collects console errors and any request that isn't a same-origin GET (blob:/data: are local). */
export function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const bad: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    const local = url.startsWith(origin) || url.startsWith('blob:') || url.startsWith('data:');
    if (!local || r.method() !== 'GET') bad.push(`${r.method()} ${url.slice(0, 80)}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => {
    errors.push(`dialog: ${d.message()}`);
    void d.dismiss();
  });
  return {
    check() {
      expect(bad).toEqual([]);
      expect(errors).toEqual([]);
    },
  };
}

export async function downloaded(d: Download): Promise<Uint8Array> {
  return new Uint8Array(await readFile((await d.path())!));
}

/** Entries of a stored (uncompressed) ZIP, via its central directory. */
export function readZip(zip: Uint8Array): { name: string; data: Uint8Array }[] {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const eocd = zip.length - 22;
  expect(v.getUint32(eocd, true)).toBe(0x06054b50);
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < count; i++) {
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const local = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(zip.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    out.push({ name, data: zip.subarray(start, start + size) });
    p += 46 + nameLen + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return out;
}

export async function expectNoSideScroll(page: Page) {
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
}
