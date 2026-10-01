import { expect, test } from '@playwright/test';

test('converts cURL to fetch, Node, axios and Python without sending anything', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/curl-converter');
  await expect(page).toHaveTitle(/^cURL ↔ Fetch: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('cURL command').fill(`curl https://api.example.com/items -H 'Content-Type: application/json' -d '{"name":"Ann"}'`);
  const pre = page.getByRole('region', { name: 'Output' }).locator('pre');
  await expect(pre).toHaveText(
    `const response = await fetch('https://api.example.com/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Ann',
  }),
});

const data = await response.text();
console.log(data);
`,
  );
  await expect(page.getByText('POST https://api.example.com/items → JavaScript fetch')).toBeVisible();

  const language = page.getByRole('group', { name: 'Language' });
  await language.getByRole('button', { name: 'Python requests' }).click();
  await expect(pre).toContainText("json_data = {\n    'name': 'Ann',\n}");
  await language.getByRole('button', { name: 'axios' }).click();
  await expect(pre).toContainText("import axios from 'axios';");
  await language.getByRole('button', { name: 'Node.js fetch' }).click();
  await expect(pre).toContainText('await fetch(');

  await page.getByRole('region', { name: 'Output' }).getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("await fetch('https://api.example.com/items'");

  // Converting must never fire the request itself.
  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('flags credentials, warnings and errors', async ({ page }) => {
  await page.goto('/tools/curl-converter');
  await page.getByLabel('cURL command').fill('curl -u ann:pw --frobnicate https://a.example');
  await expect(page.getByText('Contains credentials').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Warnings' })).toContainText('Unknown option ignored: --frobnicate.');
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText("Authorization: 'Basic YW5uOnB3',");

  await page.getByLabel('cURL command').fill("curl 'https://a.example");
  await expect(page.getByRole('alert')).toHaveText("Unterminated single quote (')");
  await expect(page.getByLabel('cURL command')).toHaveAttribute('aria-invalid', 'true');
});

test('converts fetch code back into cURL', async ({ page }) => {
  await page.goto('/tools/curl-converter');
  await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'fetch → cURL' }).click();
  await page.getByLabel('fetch() code').fill(
    `fetch('https://a.example/x', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: "it's" }) })`,
  );
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toHaveText(
    `curl https://a.example/x \\\n  -X PUT \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"msg":"it'\\''s"}' \\\n  -L`,
  );
});

test('loads examples and has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/curl-converter');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('JSON.stringify');
  await expect(page.getByText('Contains credentials').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'fetch → cURL' }).click();
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('curl https://api.example.com/v1/orders');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
