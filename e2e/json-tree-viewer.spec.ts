import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

const noSideScroll = async (page: Page) => {
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
};

const DOC = '{"a":[{"b":1},"x"],"name":"Ada","n":12345678901234567890}';

test('JSON Tree Viewer: expand, search, copy path and keyboard work locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/json-tree-viewer');
  await expect(page).toHaveTitle(/JSON Tree Viewer/);
  await page.getByLabel('Input JSON').fill(DOC);

  const tree = page.getByRole('tree', { name: 'JSON tree' });
  const items = tree.getByRole('treeitem');
  const path = page.getByTestId('path');
  await expect(items).toHaveCount(4);
  await expect(tree).toContainText('12345678901234567890');
  await expect(tree).toContainText('object');

  await items.nth(1).click();
  await expect(path).toHaveText('$.a');

  await tree.focus();
  await page.keyboard.press('ArrowRight'); // open a
  await expect(items).toHaveCount(6);
  await page.keyboard.press('ArrowDown'); // a[0]
  await page.keyboard.press('ArrowRight'); // open a[0]
  await page.keyboard.press('ArrowDown'); // b
  await expect(path).toHaveText('$.a[0].b');
  await page.keyboard.press('ArrowLeft'); // to parent a[0]
  await expect(path).toHaveText('$.a[0]');

  await page.getByRole('button', { name: 'Collapse all' }).click();
  await expect(items).toHaveCount(1);
  await page.getByRole('button', { name: 'Expand to depth' }).click();
  await expect(items).toHaveCount(6);

  const region = page.getByRole('region', { name: 'Tree' });
  await region.getByLabel('Search').fill('b');
  await expect(region.getByRole('status').first()).toContainText('1 of 1');
  await expect(path).toHaveText('$.a[0].b');
  await expect(items).toHaveCount(7);
  await region.getByLabel('Search').fill('ada');
  await expect(path).toHaveText('$.name');
  await region.getByLabel('Search').fill('zzz');
  await expect(region.getByRole('status').first()).toContainText('No matches');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('JSON Tree Viewer: a large file is parsed in a worker and rendered virtually', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/json-tree-viewer');
  const big = JSON.stringify({ items: Array.from({ length: 150_000 }, (_, i) => i * 7), last: 'end' });
  expect(big.length).toBeGreaterThan(1_000_000);
  await page.getByTestId('file-input').setInputFiles({ name: 'big.json', mimeType: 'application/json', buffer: Buffer.from(big) });
  await expect(page.getByText('Parsed:')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Depth').fill('2');
  await page.getByRole('button', { name: 'Expand to depth' }).click();
  const count = await page.getByRole('tree', { name: 'JSON tree' }).getByRole('treeitem').count();
  expect(count).toBeGreaterThan(5);
  expect(count).toBeLessThan(100);
  await page.getByRole('region', { name: 'Tree' }).getByLabel('Search').fill('end');
  await expect(page.getByTestId('path')).toHaveText('$.last');
  expect(errors).toEqual([]);
  expect(offOrigin).toEqual([]);
});

test('JSON Tree Viewer shows a syntax error and has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/json-tree-viewer');
  await noSideScroll(page);
  await page.getByLabel('Input JSON').fill('{"a":1,}');
  await expect(page.getByText(/Invalid JSON/)).toBeVisible();
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('tree', { name: 'JSON tree' })).toBeVisible();
  await noSideScroll(page);
});
