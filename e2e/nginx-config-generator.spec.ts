import { expect, test } from '@playwright/test';

test('nginx Config Generator works locally', async ({ page, context }) => {
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

  await page.goto('/tools/nginx-config-generator');
  await expect(page).toHaveTitle(/nginx Config Generator/);
  const pre = page.getByLabel('Edit nginx.conf');
  await expect(pre).toHaveValue(/try_files \$uri \$uri\/ =404;/);

  await page.getByRole('textbox', { name: /^server_name/ }).fill('app.test');
  await expect(pre).toHaveValue(/server_name app\.test;/);
  await page.getByRole('button', { name: 'Reverse proxy' }).click();
  await page.getByLabel('Upstreams').fill('127.0.0.1:8000\n127.0.0.1:8001');
  await page.getByLabel('WebSocket headers').check();
  await expect(pre).toHaveValue(/server 127\.0\.0\.1:8001;/);
  await expect(pre).toHaveValue(/proxy_set_header Upgrade \$http_upgrade;/);

  await page.getByRole('region', { name: 'Output' }).getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('proxy_pass http://app_test_backend;');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .conf' }).click();
  expect((await dl).suggestedFilename()).toBe('nginx.conf');

  await page.getByRole('textbox', { name: /^server_name/ }).fill('bad; } name');
  await expect(page.getByText(/Ignored server name/).first()).toBeVisible();

  // Hand edits are linted, kept across option changes, and reset on demand.
  await expect(page.getByRole('region', { name: 'Config checks' })).toHaveCount(0);
  const edited = (await pre.inputValue()).replace('proxy_set_header Host $host;', '');
  await pre.fill(edited);
  await expect(page.getByRole('region', { name: 'Config checks' })).toContainText('proxy_set_header Host');
  await page.getByLabel('gzip').uncheck();
  await expect(page.getByText('Options changed since you edited')).toBeVisible();
  await page.getByRole('button', { name: 'Reset to generated' }).click();
  await expect(pre).toHaveValue(/proxy_set_header Host \$host;/);
  await expect(page.getByRole('region', { name: 'Config checks' })).toHaveCount(0);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('nginx Config Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/nginx-config-generator');
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
