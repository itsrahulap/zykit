import { expect, test, type Page } from '@playwright/test';

function watch(page: Page, baseURL: string | undefined) {
  const origin = new URL(baseURL!).origin;
  const bad: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (!url.startsWith(`${origin}/`) || r.method() !== 'GET') bad.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && bad.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  return bad;
}

test('checks records and builds DMARC and SPF locally', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/email-dns-records');
  await expect(page).toHaveTitle(/SPF \/ DKIM \/ DMARC Checker/);
  await page.getByLabel('TXT records or zone snippet').fill('example.com. IN TXT "v=spf1 +all"\n_dmarc.example.com. IN TXT "v=DMARC1; p=none"');
  await expect(page.getByRole('article', { name: 'SPF record' })).toContainText('authorises every server');
  await expect(page.getByRole('article', { name: 'DMARC record' })).toContainText('monitoring only');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('article', { name: 'BIMI record' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'MTA-STS record' })).toBeVisible();

  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Build DMARC' }).click();
  await page.getByLabel('Aggregate report addresses (rua)').fill('dmarc@example.com');
  await expect(page.locator('pre', { hasText: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com' }).first()).toBeVisible();

  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Build SPF' }).click();
  await page.getByLabel('Include other senders').fill('_spf.google.com');
  await expect(page.locator('pre', { hasText: 'v=spf1 include:_spf.google.com ~all' }).first()).toBeVisible();
  expect(bad).toEqual([]);
});

test('Email DNS records has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/email-dns-records');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('article', { name: 'SPF record' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
