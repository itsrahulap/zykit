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

async function noSideScroll(page: Page, path: string) {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
}

async function loadSample(page: Page, name: string) {
  await page.getByRole('combobox', { name: 'Sample' }).click();
  await page.getByRole('option', { name }).click();
}

test('flags a spoofed email and passes a Gmail one', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/email-header-analyzer');
  await expect(page).toHaveTitle(/Email Header Analyzer/);

  await loadSample(page, 'Spoofed phishing email');
  await expect(page.getByText(/^DMARC fail for examplebank\.com/)).toBeVisible();
  await expect(page.getByText(/^SPF softfail/)).toBeVisible();
  await expect(page.getByText(/display name shows "security@examplebank\.com"/)).toBeVisible();
  await expect(page.getByText(/^Clock skew: hop 2/)).toBeVisible();
  await expect(page.getByText(/Replies go to account-check\.example\.net/)).toBeVisible();
  await expect(page.getByRole('list', { name: 'Delivery path, first hop first' }).getByRole('listitem')).toHaveCount(3);

  await loadSample(page, 'Gmail (legitimate)');
  await expect(page.getByText('Your order #1042 has shipped 🚚').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Red flags \(\d+\)/ })).toBeVisible();
  await expect(page.getByText(/High$/)).toHaveCount(0);
  await expect(page.getByText('+2 s')).toBeVisible();

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByText('Paste raw email headers to start.')).toBeVisible();

  await page.getByLabel('Raw headers').fill('Subject: =?utf-8?Q?Caf=C3=A9?=\n\tfolded\nFrom: a@b.example\n');
  await expect(page.getByText('Café folded').first()).toBeVisible();
  expect(bad).toEqual([]);
});

test('has no sideways scrolling on a phone', async ({ page }) => {
  await noSideScroll(page, '/tools/email-header-analyzer');
  await loadSample(page, 'Microsoft 365 / Outlook');
  await expect(page.getByRole('heading', { name: /Hops \(4\)/ })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
