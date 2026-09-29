import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { downloaded, expectNoSideScroll, watch } from './image-helpers';

const fixture = (n: string) => readFileSync(new URL(`../tests/tools/svg-optimizer/fixtures/${n}`, import.meta.url), 'utf8');

test('optimizes and sanitizes a hostile SVG without running it', async ({ page }) => {
  const w = watch(page); // also fails on any alert() dialog
  await page.goto('/tools/svg-optimizer');
  await expect(page).toHaveTitle(/SVG Optimizer/);
  await page.getByLabel('SVG input').fill(fixture('malicious.svg'));

  await expect(page.getByText('Removed <script> element')).toBeVisible();
  await expect(page.getByText('Removed onload event handler')).toBeVisible();
  const out = page.getByRole('region', { name: 'Output' });
  await expect(out.locator('pre')).not.toContainText('script');
  await expect(out.locator('pre')).not.toContainText('javascript');

  // Previews are <img> elements pointing at blob: URLs; the SVG is never inlined.
  const previews = page.getByRole('img', { name: /SVG preview/ });
  await expect(previews).toHaveCount(2);
  for (const src of await previews.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src))) expect(src.startsWith('blob:')).toBe(true);
  expect(await page.locator('main svg rect, main svg circle[r="20"]').count()).toBe(0);

  const [dl] = await Promise.all([page.waitForEvent('download'), out.getByRole('button', { name: /download/i }).click()]);
  expect(dl.suggestedFilename()).toBe('image.min.svg');
  const text = new TextDecoder().decode(await downloaded(dl));
  expect(text).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  expect(text).not.toMatch(/onload|<script|javascript/i);
  w.check();
});

test('shrinks an Inkscape file and reports syntax errors', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/svg-optimizer');
  const src = fixture('inkscape.svg');
  await page.locator('input[type=file]').first().setInputFiles({ name: 'drawing.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(src) });
  await expect(page.getByText(/Optimized: 2\.\d KB →/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What changed' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).not.toContainText('inkscape');

  await page.getByLabel('SVG input').fill('<svg>\n  <g>\n</svg>');
  await expect(page.getByText('Expected </g> but found </svg>.')).toBeVisible();
  await expect(page.getByText('Line 3, column 1')).toBeVisible();
  w.check();
});

test('SVG Optimizer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/svg-optimizer');
  await page.getByLabel('SVG input').fill(fixture('figma.svg'));
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  await expectNoSideScroll(page);
});
