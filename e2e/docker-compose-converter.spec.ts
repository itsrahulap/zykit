import { expect, test } from '@playwright/test';

test('docker run ↔ Compose works locally', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const local = r.url().startsWith(origin) || r.url().startsWith('blob:') || r.url().startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/docker-compose-converter');
  await expect(page).toHaveTitle(/docker run/);

  await page.locator('#compose-input').fill('docker run -d --rm --name web -p 8080:80 -v data:/d --network net1 --bogus nginx:alpine');
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.locator('pre')).toContainText('image: nginx:alpine');
  await expect(output.locator('pre')).toContainText('- "8080:80"');
  await expect(output.locator('pre')).toContainText('external: true');
  await expect(page.getByText('Unknown flag --bogus was ignored.')).toBeVisible();
  await expect(page.getByText(/--rm: Compose services/)).toBeVisible();

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('container_name: web');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .yml' }).click();
  expect((await dl).suggestedFilename()).toBe('docker-compose.yml');

  // And back.
  await page.getByRole('button', { name: 'Compose example' }).click();
  await expect(page.getByLabel('Compose file')).toBeVisible();
  await expect(output.locator('pre')).toContainText('docker run -d');
  await expect(output.locator('pre')).toContainText('--name db');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('docker run ↔ Compose has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/docker-compose-converter');
  await page.getByRole('button', { name: 'docker run example' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
