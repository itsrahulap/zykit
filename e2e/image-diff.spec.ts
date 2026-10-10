import { expect, test, type Page } from '@playwright/test';
import { downloaded, expectNoSideScroll, watch } from './image-helpers';
import { sniffImageType } from '../src/shared/lib/image';

/** Solid grey PNG, optionally with a 10x10 white square at (20,10). */
async function png(page: Page, w: number, h: number, square: boolean): Promise<Buffer> {
  const data = await page.evaluate(
    async ({ w, h, square }) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      if (square) {
        g.fillStyle = '#ffffff';
        g.fillRect(20, 10, 10, 10);
      }
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    },
    { w, h, square },
  );
  return Buffer.from(data);
}

test('compares two images, reports changes and exports the diff', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-diff');
  await expect(page).toHaveTitle(/Image Diff/);
  const inputs = page.locator('input[type=file]');
  await inputs.nth(0).setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: await png(page, 60, 40, false) });
  await inputs.nth(1).setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: await png(page, 60, 40, true) });

  const stats = page.getByLabel('Statistics');
  await expect(stats).toContainText('100 of 2,400 (4.17%)');
  await expect(stats).toContainText('x 20, y 10, 10 × 10 px');
  await expect(page.getByRole('img', { name: 'Difference heatmap' })).toBeVisible();

  await page.getByLabel('Tolerance').fill('255');
  await expect(stats).toContainText('0 of 2,400');
  await page.getByLabel('Tolerance').fill('10');
  await expect(stats).toContainText('100 of 2,400');

  const view = page.getByRole('group', { name: 'View' });
  for (const name of ['Side by side', 'Slider', 'Onion skin', 'Blink']) {
    await view.getByRole('button', { name }).click();
    await expect(page.getByRole('img', { name: /^Image A/ })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Switch', exact: true }).click();
  await expect(page.getByText('Showing image B')).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download diff PNG' }).click()]);
  expect(dl.suggestedFilename()).toBe('image-diff.png');
  expect(sniffImageType(await downloaded(dl))?.mime).toBe('image/png');

  // Different sizes: offer alignment; top-left grows the canvas.
  await inputs.nth(1).setInputFiles({ name: 'c.png', mimeType: 'image/png', buffer: await png(page, 80, 40, false) });
  await expect(page.getByText(/The sizes differ/)).toBeVisible();
  await expect(stats).toContainText('80 × 40 px');
  await page.getByRole('button', { name: 'Scale B to A' }).click();
  await expect(stats).toContainText('60 × 40 px');
  w.check();
});

test('has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-diff');
  await expectNoSideScroll(page);
});
