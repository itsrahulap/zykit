import { expect, test } from '@playwright/test';

test('diffs two JSON documents with tree, list and JSON Patch', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/json-diff');
  await expect(page).toHaveTitle(/^JSON Diff: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Left JSON').fill('{"users":[{"name":"a"},{"name":"b"}],"n":1,"gone":true}');
  await page.getByLabel('Right JSON').fill('{"users":[{"name":"a"},{"name":"B"}],"n":1.0,"new":null}');
  const result = page.getByRole('region', { name: 'Differences' });
  await expect(page.getByText('4 differences found')).toBeVisible();
  await expect(result.getByText('1 added')).toBeVisible();
  await expect(result.getByText('1 removed')).toBeVisible();
  await expect(result.getByText('2 changed', { exact: true })).toBeVisible();

  const tree = result.getByRole('list', { name: 'Diff tree' });
  await expect(tree).toContainText('"b" → "B"');
  await tree.getByRole('button', { name: /^users/ }).click();
  await expect(tree).not.toContainText('"b" → "B"');

  await page.getByLabel('Compare numbers by value (1 = 1.0)').check();
  await expect(page.getByText('3 differences found')).toBeVisible();

  await result.getByRole('group', { name: 'View' }).getByRole('button', { name: 'List' }).click();
  const list = result.getByRole('list', { name: 'Changes' });
  await expect(list).toContainText('$.users[1].name');
  await expect(list).toContainText('$.gone');
  await expect(list).toContainText('$.new');

  await result.getByRole('button', { name: 'Copy JSON Patch' }).click();
  const patch = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(patch).toEqual([
    { op: 'replace', path: '/users/1/name', value: 'B' },
    { op: 'remove', path: '/gone' },
    { op: 'add', path: '/new', value: null },
  ]);

  await page.getByLabel('Ignore keys').fill('name, gone, new');
  await expect(page.getByText('The documents are equivalent')).toBeVisible();

  await page.getByLabel('Ignore keys').fill('');
  await page.getByRole('button', { name: 'Swap sides' }).click();
  await expect(page.getByLabel('Left JSON')).toHaveValue('{"users":[{"name":"a"},{"name":"B"}],"n":1.0,"new":null}');
  await expect(list).toContainText('"B"');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('ignores array order when asked', async ({ page }) => {
  await page.goto('/tools/json-diff');
  await page.getByLabel('Left JSON').fill('[1, 2, {"a": 1}]');
  await page.getByLabel('Right JSON').fill('[{"a": 1}, 2, 1]');
  await expect(page.getByText(/differences? found/)).toBeVisible();
  await page.getByLabel('Ignore array order').check();
  await expect(page.getByText('The documents are equivalent')).toBeVisible();
});

test('reports parse errors per side', async ({ page }) => {
  await page.goto('/tools/json-diff');
  await page.getByLabel('Left JSON').fill('{"a": 1}');
  await page.getByLabel('Right JSON').fill('{\n  "a": 1,\n}');
  await expect(page.getByRole('alert')).toContainText("Right: Unexpected '}' — trailing comma? (line 3, column 1)");
  await expect(page.getByLabel('Right JSON')).toHaveAttribute('aria-invalid', 'true');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/json-diff');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Differences' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'List' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
