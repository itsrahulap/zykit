// End-to-end: real browser, real encoded images (produced by the browser's own
// canvas encoder), real Web Worker, production build served under the production CSP.

import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { analyzeImage } from '../src/features/metadata/metadata.service';
import { bytes, cat, jpegSegment, riff, sampleTiff, u32le, XMP_PACKET } from '../tests/fixtures/builders';
import { buildPngChunk } from '../src/features/sanitizer/png.sanitizer';
import { walkWebp } from '../src/features/formats/webp.structure';

async function canvasImage(page: Page, mime: string): Promise<Uint8Array> {
  const data = await page.evaluate(async (type) => {
    const c = document.createElement('canvas');
    c.width = 240;
    c.height = 120;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 240, 120);
    grad.addColorStop(0, '#0ea5e9');
    grad.addColorStop(1, '#f97316');
    g.fillStyle = grad;
    g.fillRect(0, 0, 240, 120);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), type, 0.9));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, mime);
  return new Uint8Array(data);
}

/** Injects EXIF (with GPS + orientation 6), XMP and a comment into a real JPEG. */
function withJpegMetadata(jpeg: Uint8Array) {
  const exif = jpegSegment(0xe1, cat(bytes('Exif\0\0'), sampleTiff(6)));
  const xmp = jpegSegment(0xe1, cat(bytes('http://ns.adobe.com/xap/1.0/\0'), bytes(XMP_PACKET)));
  const com = jpegSegment(0xfe, bytes('secret comment'));
  return cat(jpeg.subarray(0, 2), exif, xmp, com, jpeg.subarray(2), bytes('TRAILER'));
}

function withPngMetadata(png: Uint8Array) {
  const ihdrEnd = 8 + 25;
  const text = buildPngChunk('tEXt', cat(bytes('parameters\0'), bytes('a fox, Steps: 30, Sampler: DPM++')));
  const exif = buildPngChunk('eXIf', sampleTiff(1));
  return cat(png.subarray(0, ihdrEnd), text, exif, png.subarray(ihdrEnd));
}

/** Adds EXIF + XMP chunks to a real WebP, creating or updating the VP8X header. */
function withWebpMetadata(webp: Uint8Array) {
  const chunks = walkWebp(webp).chunks;
  const inner = chunks.filter((ch) => ch.fourcc !== 'VP8X').map((ch) => webp.subarray(ch.start, ch.end));
  const hasIcc = chunks.some((ch) => ch.fourcc === 'ICCP');
  const w = 239, h = 119; // canvas size minus one, 24-bit little-endian
  const flags = 0x08 | 0x04 | (hasIcc ? 0x20 : 0);
  const vp8x = riff('VP8X', [flags, 0, 0, 0, w & 0xff, w >> 8, 0, h & 0xff, h >> 8, 0]);
  const body = cat(vp8x, ...inner, riff('EXIF', sampleTiff(1)), riff('XMP ', bytes(XMP_PACKET)));
  return cat(bytes('RIFF'), u32le(body.length + 4), bytes('WEBP'), body);
}

const CASES = [
  { name: 'photo.jpg', mime: 'image/jpeg', build: withJpegMetadata, orientation: 6 },
  { name: 'render.png', mime: 'image/png', build: withPngMetadata, orientation: undefined },
  { name: 'shot.webp', mime: 'image/webp', build: withWebpMetadata, orientation: undefined },
];

for (const c of CASES) {
  test(`cleans a real ${c.mime} end to end without network uploads`, async ({ page }) => {
    const origin = 'http://localhost:4173';
    const requests: { url: string; method: string }[] = [];
    const consoleErrors: string[] = [];
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    page.on('pageerror', (e) => consoleErrors.push(e.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /remove hidden metadata/i })).toBeVisible();

    const input = c.build(await canvasImage(page, c.mime));
    await page.locator('input[type=file]').setInputFiles({ name: c.name, mimeType: c.mime, buffer: Buffer.from(input) });

    await expect(page.getByRole('heading', { name: 'Metadata found' })).toBeVisible();
    await expect(page.getByText('GPSLatitude').first()).toBeVisible();
    await expect(page.getByRole('img', { name: /original image preview/i })).toBeVisible();

    await page.getByRole('button', { name: 'Clean image' }).click();
    await expect(page.getByText('Your clean image is ready')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why an AI detector may still flag this image' })).toBeVisible();

    // Every verification check must pass in a real browser, including decoding.
    const verification = page.locator('section', { has: page.getByRole('heading', { name: 'Verification' }) });
    await expect(verification.getByText('Browser can decode the output')).toBeVisible();
    await expect(verification.getByText(/^(Failed|Warning|Skipped):$/)).toHaveCount(0);

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: /download/i }).click()]);
    expect(download.suggestedFilename()).toBe(c.name.replace(/\.(\w+)$/, '-clean.$1'));
    const out = new Uint8Array(await readFile((await download.path())!));

    const report = await analyzeImage(out);
    expect(report.entries.filter((e) => e.key !== 'Orientation' && e.category !== 'ICC')).toEqual([]);
    expect(report.orientation).toBe(c.orientation);
    expect([report.width, report.height]).toEqual([240, 120]);

    // Privacy: only same-origin GET requests for the app's own assets.
    for (const r of requests) {
      expect(r.method).toBe('GET');
      expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
    }
    expect(consoleErrors).toEqual([]);
  });
}

test('rejects a non-image file with a friendly message', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('definitely not a jpeg') });
  await expect(page.getByRole('alert')).toContainText("doesn't look like a JPEG, PNG or WebP");
});

test('keyboard users can reach the file picker', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab'); // logo
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Select image' })).toBeFocused();
});
