import { expect, test } from '@playwright/test';

test('JSONPath Query runs RFC 9535 queries and shows paths', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/jsonpath-query');
  await expect(page).toHaveTitle(/JSONPath Query/);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('4 matches', { exact: true })).toBeVisible();
  const matches = page.getByRole('list', { name: 'Matches' });
  await expect(matches.getByText("$['store']['book'][0]['author']")).toBeVisible();
  await expect(matches).toContainText('"Nigel Rees"');

  const query = page.getByLabel('JSONPath query');
  await query.fill("$..book[?@.price < 10 && match(@.category, 'ref.*')].title");
  await expect(page.getByText('1 match', { exact: true })).toBeVisible();
  await expect(matches).toContainText('"Sayings of the Century"');

  await page.getByRole('combobox', { name: 'Examples' }).click();
  await page.getByRole('option', { name: 'All prices' }).click();
  await expect(query).toHaveValue('$.store..price');
  await expect(page.getByText('5 matches', { exact: true })).toBeVisible();

  await query.fill('$.store[?@.price = 1]');
  await expect(page.getByText(/^Invalid query: Use '==' to compare/)).toBeVisible();
  await expect(page.getByText('Query error')).toBeVisible();

  await query.fill('$.a');
  await page.getByRole('textbox', { name: 'JSON', exact: true }).fill('{"a": }');
  await expect(page.getByText(/^Invalid JSON:/)).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('JSONPath Query has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/jsonpath-query');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('4 matches', { exact: true })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
