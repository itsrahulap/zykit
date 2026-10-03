import { expect, test } from '@playwright/test';

test('JSON-LD Generator builds and validates structured data locally', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/json-ld-generator');
  await expect(page).toHaveTitle(/JSON-LD Generator/);
  const snippet = page.getByRole('region', { name: 'Output' });
  await expect(snippet).toContainText('"@type": "Article"');

  await page.getByLabel('Headline', { exact: true }).fill('</script> Hello');
  await expect(snippet).toContainText('"headline": "\\u003c/script> Hello"');
  await page.getByLabel('Date published', { exact: true }).fill('31/03/2025');
  await expect(page.getByText('Check this: use ISO 8601')).toBeVisible();
  await expect(page.getByText('Invalid values (1)')).toBeVisible();

  await page.getByLabel('Schema type').selectOption('product');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(snippet).toContainText('"priceCurrency": "USD"');
  await expect(page.getByText('All required properties are present.')).toBeVisible();
  await page.getByLabel('Currency', { exact: true }).fill('usd');
  await expect(page.getByText(/3-letter ISO 4217 code/).first()).toBeVisible();

  await page.getByLabel('Schema type').selectOption('faq');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(snippet).toContainText('"@type": "Question"');
  await page.getByRole('button', { name: 'Copy snippet' }).click();
  await expect(page.getByText('Copied')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<script type="application/ld+json">');

  await page.getByRole('button', { name: 'Validate existing' }).click();
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByRole('heading', { name: 'Product', exact: true })).toBeVisible();
  await expect(page.getByText('Invalid values (2)')).toBeVisible();
  await expect(page.getByText('Missing recommended').first()).toBeVisible();
  await page.getByLabel('JSON-LD to check').fill('{ nope');
  await expect(page.getByRole('alert')).toContainText('Not valid JSON');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('JSON-LD Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const id of ['article', 'organization', 'event', 'job']) {
    await page.goto('/tools/json-ld-generator');
    await page.getByLabel('Schema type').selectOption(id);
    await page.getByRole('button', { name: 'Load example' }).click();
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    expect(sw, id).toBeLessThanOrEqual(vw);
  }
});
