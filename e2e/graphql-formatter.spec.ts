import { expect, test } from '@playwright/test';

test('GraphQL Formatter works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/graphql-formatter');
  await expect(page).toHaveTitle(/GraphQL Formatter/);
  await page.getByLabel('Input GraphQL').fill('query Q($id:ID!){user(id:$id){name,...F}} fragment F on User{email}');
  const out = page.getByRole('region', { name: 'Output' });
  await expect(out).toContainText('query Q($id: ID!) {');
  await expect(out).toContainText('...F');
  await page.getByRole('button', { name: 'Minify' }).click();
  await expect(out).toContainText('query Q($id:ID!){user(id:$id){name...F}}fragment F on User{email}');

  await page.getByLabel('Input GraphQL').fill('{\n  a(b: )\n}');
  await expect(page.getByRole('main').getByText('Line 2, column 8', { exact: true })).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('GraphQL Formatter has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/graphql-formatter');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
