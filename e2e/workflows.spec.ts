import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test('CSV → JSON → Send to JSON to TypeScript shows types', async ({ page }) => {
  await page.goto('/tools/csv-json');
  await page.getByLabel('Input CSV').fill('id,name,active\n1,Ann,true\n2,Bob,false');
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.locator('pre')).toContainText('"name": "Ann"');

  await output.getByRole('button', { name: 'Send to…' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'JSON Formatter' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'CSV ↔ JSON' })).toHaveCount(0);
  await menu.getByRole('menuitem', { name: 'JSON to TypeScript' }).click();

  await expect(page).toHaveURL(/\/tools\/json-to-typescript$/);
  await expect(page.getByLabel('Input JSON')).toHaveValue(/"name": "Ann"/);
  const ts = page.getByRole('region', { name: 'TypeScript output' });
  await expect(ts).toContainText('name: string');
  await expect(ts).toContainText('active: boolean');
  expect(await page.evaluate(() => sessionStorage.getItem('zykit-handoff'))).toBeNull();

  // Consumed once: a reload shows the tool as usual.
  await page.reload();
  await expect(page.getByLabel('Input JSON')).toHaveValue('');
});

test('the Send to menu works from the keyboard', async ({ page }) => {
  await page.goto('/tools/csv-json');
  await page.getByLabel('Input CSV').fill('a\n1');
  const button = page.getByRole('region', { name: 'Output' }).getByRole('button', { name: 'Send to…' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(button).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tools\/json-formatter$/);
  await expect(page.getByLabel('Input JSON')).toHaveValue(/"a": 1/);
});

test('cURL converter → Send to HTTP Headers', async ({ page }) => {
  await page.goto('/tools/curl-converter');
  await page.getByLabel('cURL command').fill(`curl https://api.example.com/items -H 'Content-Type: application/json' -H 'X-Trace: abc'`);
  await page.getByRole('region', { name: 'Request headers' }).getByRole('button', { name: 'Send to…' }).click();
  await page.getByRole('menuitem', { name: /HTTP Headers/ }).click();
  await expect(page).toHaveURL(/\/tools\/http-headers$/);
  const box = page.getByRole('textbox', { name: /Raw headers/ });
  await expect(box).toHaveValue(/Content-Type: application\/json/);
  await expect(box).toHaveValue(/X-Trace: abc/);
});

test('a .json file dropped on JSON Formatter is opened', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  const input = page.getByLabel('Input JSON');
  const dt = await page.evaluateHandle(() => {
    const d = new DataTransfer();
    d.items.add(new File(['{"dropped":true,"n":[1,2]}'], 'data.json', { type: 'application/json' }));
    return d;
  });
  await input.dispatchEvent('dragenter', { dataTransfer: dt });
  await expect(page.getByText('Drop a file to open it')).toBeVisible();
  await input.dispatchEvent('drop', { dataTransfer: dt });
  await expect(page.getByText('Drop a file to open it')).toBeHidden();
  await expect(input).toHaveValue('{"dropped":true,"n":[1,2]}');
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('"dropped": true');

  // Binary files are refused with a friendly message.
  const bin = await page.evaluateHandle(() => {
    const d = new DataTransfer();
    d.items.add(new File([new Uint8Array([0x89, 0x50, 0x00, 0x01])], 'x.png', { type: 'image/png' }));
    return d;
  });
  await input.dispatchEvent('drop', { dataTransfer: bin });
  await expect(page.getByRole('alert')).toContainText("x.png doesn't look like a text file.");
  await expect(input).toHaveValue('{"dropped":true,"n":[1,2]}');
});

test('Ctrl/⌘+Shift+C copies the main output, even while typing', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  const input = page.getByLabel('Input JSON');
  await input.fill('{"b":1,"a":[true]}');
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('"b": 1');
  await input.focus();
  await page.keyboard.press('ControlOrMeta+Shift+C');
  await expect(page.getByRole('status').filter({ hasText: 'Output copied' })).toBeVisible();
  expect(await clipboard(page)).toBe('{\n  "b": 1,\n  "a": [\n    true\n  ]\n}');
});

test('"?" opens the keyboard shortcuts help, but not while typing', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  const input = page.getByLabel('Input JSON');
  await input.focus();
  await page.keyboard.type('?');
  await expect(input).toHaveValue('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toHaveCount(0);

  await page.getByRole('heading', { level: 1 }).click();
  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Search tools, lessons and posts');
  await expect(dialog).toContainText('Copy the main output');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();
  await expect(dialog).toBeVisible();
});

test('a Regex Tester share link restores its state in a new page', async ({ page, context }) => {
  await page.goto('/tools/regex-tester');
  await page.getByLabel('Pattern', { exact: true }).fill('(\\d{4})-(\\d{2})');
  await page.getByLabel('Test text').fill('from 2024-01 to 1999-12');
  await expect(page.getByText('2 matches', { exact: true })).toBeVisible();

  const share = page.getByRole('button', { name: 'Copy share link' });
  await expect(share).toHaveAttribute('title', /never sent to a server/);
  await share.click();
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  const url = await clipboard(page);
  expect(url).toMatch(/\/tools\/regex-tester#s=[A-Za-z0-9_-]+$/);

  const other = await context.newPage();
  const requests: string[] = [];
  other.on('request', (r) => requests.push(r.url()));
  await other.goto(url);
  await expect(other.getByLabel('Pattern', { exact: true })).toHaveValue('(\\d{4})-(\\d{2})');
  await expect(other.getByLabel('Test text')).toHaveValue('from 2024-01 to 1999-12');
  await expect(other.getByText('2 matches', { exact: true })).toBeVisible();
  expect(requests.some((r) => r.includes('#') || r.includes('s='))).toBe(false);

  // A tampered fragment is ignored instead of breaking the page.
  await other.goto('/tools/regex-tester#s=dNOT-VALID');
  await expect(other.getByLabel('Pattern', { exact: true })).toHaveValue('');
});

test('tools that handle secrets have no share button', async ({ page }) => {
  await page.goto('/tools/jwt-decoder');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy share link' })).toHaveCount(0);
  await page.goto('/tools/json-formatter');
  await expect(page.getByRole('button', { name: 'Copy share link' })).toBeVisible();
});
