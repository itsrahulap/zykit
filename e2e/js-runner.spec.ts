// End-to-end: the production build under the production CSP (no 'unsafe-eval'), real blob: workers.

import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/tools/js-runner');
  await expect(page.getByRole('heading', { name: /run code right in your browser/i })).toBeVisible();
}

const editor = (page: Page) => page.getByRole('textbox', { name: /(JavaScript|TypeScript) code/ });
const output = (page: Page) => page.getByRole('region', { name: 'Console output' });
const status = (page: Page) => page.locator('[aria-live="polite"]').filter({ hasText: /Ready|Running|Finished|Stopped|Could not|Main code|Compiling/ });

async function runCode(page: Page, code: string) {
  await editor(page).fill(code);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
}

test('runs JavaScript and shows console output', async ({ page }) => {
  const offOrigin: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.hostname !== 'localhost') offOrigin.push(r.url());
  });
  await open(page);
  await runCode(page, "console.log('hello from', 1 + 1);\nconsole.warn('careful');\nconsole.log({ a: [1, 2] });");
  await expect(output(page)).toContainText('hello from 2');
  await expect(output(page)).toContainText('careful');
  await expect(output(page)).toContainText('{ a: [ 1, 2 ] }');
  await expect(output(page).getByText('warning', { exact: true })).toBeVisible();
  await expect(status(page)).toContainText(/Finished\. Ran in/);
  expect(offOrigin).toEqual([]);
});

test('Ctrl+Enter runs, and top-level await with timers works', async ({ page }) => {
  await open(page);
  await editor(page).fill("await new Promise((r) => setTimeout(r, 50));\nconsole.log('after await');\nsetTimeout(() => console.log('late timer'), 200);");
  await editor(page).press('Control+Enter');
  await expect(output(page)).toContainText('after await');
  await expect(output(page)).toContainText('late timer');
  await expect(status(page)).toContainText('Finished');
});

test('runs TypeScript', async ({ page }) => {
  await open(page);
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'TypeScript' }).click();
  await runCode(page, 'interface Box<T> { value: T }\nconst b: Box<number> = { value: 41 };\nconsole.log(b.value + 1 as number);');
  await expect(output(page)).toContainText('42');

  await page.getByLabel('Show compiled JS').check();
  await expect(page.getByText('const b = { value: 41 };')).toBeVisible();

  await runCode(page, 'const ok = 1;\nlet bad: = 2;');
  await expect(output(page)).toContainText(/TypeScript syntax error: .*\(line 2/);
});

test('syntax and runtime errors point at the right line', async ({ page }) => {
  await open(page);
  await runCode(page, 'const a = 1;\nconst b = 2;\nconst = 3;');
  await expect(output(page)).toContainText(/SyntaxError.*\(line 3/);

  await runCode(page, "const x = 1;\nfunction boom() {\n  throw new Error('kaboom');\n}\nboom();");
  await expect(output(page)).toContainText('Uncaught Error: kaboom');
  await expect(output(page)).toContainText('line 3:9');
  await expect(output(page)).not.toContainText('blob:');
});

test('an infinite loop does not freeze the page and can be stopped', async ({ page }) => {
  await open(page);
  await runCode(page, 'while (true) {}');
  await expect(status(page)).toContainText('Running');
  // The page stays responsive while the worker spins.
  expect(await page.evaluate(() => 1 + 1)).toBe(2);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(status(page)).toContainText('Stopped');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
});

test('the time limit stops runaway code', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Time limit' }).click();
  await page.getByRole('option', { name: '5 s' }).click();
  await runCode(page, 'let i = 0;\nwhile (true) { i++; }');
  await expect(output(page)).toContainText('Stopped after 5 s (time limit).', { timeout: 10_000 });
});

test('network requests to other sites are blocked', async ({ page }) => {
  await open(page);
  await runCode(
    page,
    "try {\n  await fetch('https://example.com');\n  console.log('reached the network');\n} catch (e) {\n  console.error('blocked', e.name);\n}",
  );
  await expect(output(page)).toContainText('blocked TypeError');
  await expect(output(page)).not.toContainText('reached the network');
});

test('import statements get a friendly explanation, and code persists', async ({ page }) => {
  await open(page);
  await runCode(page, "import _ from 'lodash';\nconsole.log(_);");
  await expect(output(page)).toContainText(/`import` statements aren't supported \(line 1\)/);
  await page.reload();
  await expect(editor(page)).toHaveValue("import _ from 'lodash';\nconsole.log(_);");
});

test('the styled dropdowns work with the keyboard', async ({ page }) => {
  await page.goto('/tools/js-runner');
  const limit = page.getByRole('combobox', { name: 'Time limit' });
  await limit.focus();
  await page.keyboard.press('ArrowDown');
  await expect(limit).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('option', { name: '10 s' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(limit).toHaveAttribute('aria-expanded', 'false');
  await expect(limit).toHaveText('30 s');
  await expect(limit).toBeFocused();

  // Escape closes without changing the value
  await page.keyboard.press('Home');
  await page.keyboard.press('Escape');
  await expect(limit).toHaveText('30 s');

  // Clicking outside closes the list
  await limit.click();
  await expect(page.getByRole('listbox', { name: 'Time limit' })).toBeVisible();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(page.getByRole('listbox', { name: 'Time limit' })).toBeHidden();
});
