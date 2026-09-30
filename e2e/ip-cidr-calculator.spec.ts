import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    const local = url.startsWith(origin) || url.startsWith('blob:') || url.startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('IP / CIDR Calculator works locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/ip-cidr-calculator');
  await expect(page).toHaveTitle(/IP \/ CIDR Calculator/);
  const input = page.getByLabel('IP / CIDR');
  await input.fill('10.1.2.3 255.255.255.0');
  const details = page.getByRole('region', { name: 'Network details' });
  await expect(details.getByText('10.1.2.0/24').first()).toBeVisible();
  await expect(details.getByText('10.1.2.255')).toBeVisible();
  await expect(page.getByTestId('usable-hosts')).toHaveText('254');
  await expect(details.getByText('RFC 1918', { exact: false })).toBeVisible();

  await page.getByLabel('IP or CIDR to check').fill('10.1.2.200');
  await expect(page.getByTestId('in-range')).toContainText('Yes');
  await page.getByLabel('IP or CIDR to check').fill('10.1.3.1');
  await expect(page.getByTestId('in-range')).toContainText('No');

  await page.getByLabel('Prefix', { exact: true }).fill('26');
  await expect(page.getByTestId('subnets').locator('li')).toHaveCount(4);

  await page.getByLabel('CIDRs or IPs (one per line)').fill('192.168.0.0/24\n192.168.1.0/24');
  await expect(page.getByTestId('summary')).toHaveText('192.168.0.0/23');

  await input.fill('2001:0db8:0000:0000:0000:0000:0000:0001/64');
  await expect(details.getByText('2001:db8::1', { exact: true })).toBeVisible();
  await expect(details.getByText('Documentation (RFC 3849', { exact: false })).toBeVisible();
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('IP / CIDR Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/ip-cidr-calculator');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
