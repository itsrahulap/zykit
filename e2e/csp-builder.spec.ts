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

test('builds, evaluates and exports a policy locally', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/csp-builder');
  await expect(page).toHaveTitle(/CSP Builder/);
  const evaluation = page.locator('section[aria-label="Evaluation"]');
  const output = page.locator('section[aria-label="Output"]');

  await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Static site' }).click();
  await expect(evaluation).toContainText('Grade A');
  await expect(output).toContainText("default-src 'none'");

  await page.getByLabel('Paste an existing policy').fill("script-src 'self' 'unsafe-inline'");
  await page.getByRole('button', { name: 'Load into builder' }).click();
  await expect(evaluation).toContainText('allows inline scripts');
  await expect(evaluation).toContainText('object-src is missing');
  await page.getByRole('button', { name: "Add 'strict-dynamic' to script-src" }).click();
  await page.getByRole('button', { name: 'Remove \'unsafe-inline\' from script-src' }).click();
  await page.getByLabel('Add a source to script-src').fill('https://cdn.jsdelivr.net');
  await page.getByRole('button', { name: 'Add source to script-src' }).click();
  await expect(evaluation).toContainText('bypass');

  await page.getByRole('group', { name: 'Format' }).getByRole('button', { name: 'nginx' }).click();
  await expect(output.locator('pre')).toContainText('add_header Content-Security-Policy "script-src');
  await page.getByRole('group', { name: 'Format' }).getByRole('button', { name: 'Meta tag' }).click();
  await expect(output.locator('pre')).toContainText('<meta http-equiv="Content-Security-Policy"');

  await page.getByLabel('Inline script or style', { exact: true }).fill('');
  await page.getByLabel('Inline script or style', { exact: true }).fill('alert(1)');
  await expect(page.locator('pre', { hasText: "'sha256-" })).toBeVisible();
  expect(bad).toEqual([]);
});

test('CSP builder has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/csp-builder');
  await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Single-page app' }).click();
  await expect(page.locator('section[aria-label="Evaluation"]')).toContainText('Grade');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
