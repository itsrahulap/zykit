import { expect, test } from '@playwright/test';

test('Webhook Payload Builder signs and builds requests locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/webhook-payload-builder');
  await expect(page).toHaveTitle(/Webhook Payload Builder/);
  const req = page.getByRole('region', { name: 'Request' });

  await page.getByLabel('Test secret').fill('test-secret');
  await page.getByLabel('JSON body').fill('{"ok":true}');
  await expect(req).toContainText(/X-Hub-Signature-256: sha256=[0-9a-f]{64}/);
  await expect(req).toContainText(`--data-raw '{"ok":true}'`);
  await expect(req).toContainText(`body: '{"ok":true}'`);

  await page.getByRole('group', { name: 'Signature' }).getByRole('button', { name: 'Stripe style' }).click();
  await expect(req).toContainText(/Stripe-Signature: t=\d+,v1=[0-9a-f]{64}/);

  await page.getByLabel('JSON body').fill('{"broken":}');
  await expect(page.getByText('JSON error')).toBeVisible();
  await expect(req).toHaveCount(0);

  await page.getByRole('combobox', { name: 'Sample event' }).click();
  await page.getByRole('option', { name: 'payment.succeeded' }).click();
  await expect(page.getByLabel('JSON body')).toHaveValue(/"type": "payment.succeeded"/);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download fixture JSON' }).click();
  expect((await download).suggestedFilename()).toBe('payment.succeeded.json');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Webhook Payload Builder has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/webhook-payload-builder');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
