import { expect, test } from '@playwright/test';

test('a tool page shows its docs below the tool, with collapsible FAQs', async ({ page }) => {
  await page.goto('/tools/jwt-decoder');
  for (const heading of ['How to use JWT Decoder', 'Limits', 'How it works', 'Privacy', 'Frequently asked questions']) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  const faq = page.locator('details').filter({ hasText: 'Does decoding a JWT prove it is genuine?' });
  await expect(faq.getByText('Only a successful signature check')).toBeHidden();
  await faq.locator('summary').click();
  await expect(faq.getByText('Only a successful signature check')).toBeVisible();
});

test('docs are loaded with the tool, never on the home page', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /useful tools/i })).toBeVisible();
  expect(scripts.filter((u) => /\/assets\/docs-/.test(u))).toEqual([]);
});

test('the docs have no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/cron-builder');
  await expect(page.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
