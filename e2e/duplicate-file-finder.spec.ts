import { expect, test } from '@playwright/test';

test('Duplicate File Finder finds duplicates among files', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const local = r.url().startsWith(origin) || r.url().startsWith('blob:') || r.url().startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/duplicate-file-finder');
  await expect(page).toHaveTitle(/Duplicate File Finder/);

  const same = Buffer.from('identical content here');
  await page.getByTestId('file-input').setInputFiles([
    { name: 'a.txt', mimeType: 'text/plain', buffer: same },
    { name: 'copy of a.txt', mimeType: 'text/plain', buffer: same },
    { name: 'other.txt', mimeType: 'text/plain', buffer: Buffer.from('different content!!!!') },
    { name: 'unique.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
  ]);
  await page.getByRole('button', { name: 'Find duplicates' }).click();

  const groups = page.getByRole('region', { name: 'Duplicate groups' });
  await expect(groups).toContainText('2 copies');
  await expect(groups).toContainText('a.txt');
  await expect(groups).toContainText('copy of a.txt');
  await expect(groups).not.toContainText('other.txt');
  await expect(page.getByText('1 duplicate group', { exact: false }).first()).toBeVisible();

  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV report' }).click();
  expect((await dl).suggestedFilename()).toBe('duplicates.csv');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Duplicate File Finder has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/duplicate-file-finder');
  const long = 'a-very-long-file-name-with-no-break-points-at-all-to-test-wrapping-1234567890.txt';
  const buf = Buffer.from('same');
  await page.getByTestId('file-input').setInputFiles([
    { name: long, mimeType: 'text/plain', buffer: buf },
    { name: 'b.txt', mimeType: 'text/plain', buffer: buf },
  ]);
  await page.getByRole('button', { name: 'Find duplicates' }).click();
  await expect(page.getByRole('region', { name: 'Duplicate groups' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
