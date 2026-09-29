// End-to-end: a Learn lesson page under the production CSPs — sections, progress, bookmarks,
// runnable examples (JS Runner worker and the sandboxed DOM iframe), navigation and 404s.

import { expect, test, type Page } from '@playwright/test';

// Every test fails on console errors, uncaught exceptions or requests that leave the site.
function watch(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const problems: string[] = [];
  page.on('console', (m) => {
    // The DOM sandbox test fetches example.com on purpose to prove its CSP blocks the network.
    if (m.type() === 'error' && !m.text().includes('https://example.com/')) problems.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin !== origin) problems.push(`off-origin: ${r.url()}`);
  });
  return problems;
}

const FIRST = '/learn/javascript/what-is-javascript';
const example = (page: Page, title: string) =>
  page.locator('#main div.min-w-0.space-y-3').filter({ has: page.getByRole('heading', { level: 3, name: title }) });

let problems: string[];
test.beforeEach(({ page, baseURL }) => {
  problems = watch(page, baseURL!);
});
test.afterEach(() => {
  expect(problems).toEqual([]);
});

test('renders every section of a lesson', async ({ page }) => {
  await page.goto(FIRST);
  await expect(page).toHaveTitle('What is JavaScript? · JavaScript · Zykit');
  await expect(page.getByRole('heading', { level: 1, name: 'What is JavaScript?' })).toBeVisible();
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'Learn' })).toBeVisible();
  await expect(crumbs.getByRole('link', { name: 'JavaScript' })).toHaveAttribute('href', '/learn/javascript');
  for (const name of ['What is it?', 'Explain like I’m 10', 'Examples', 'How it works', 'Why does it exist?', 'When to use it', 'Interview questions']) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 3, name: 'When not to use it' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Line by line' }).or(page.getByText('Line by line').first())).toBeVisible();

  // Interview answers are collapsed until opened.
  const first = page.locator('details').first();
  await expect(first).not.toHaveAttribute('open');
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');

  // Table of contents links to the section ids.
  await expect(page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how-it-works');
});

test('status and bookmark persist across reloads', async ({ page }) => {
  await page.goto(FIRST);
  const progress = page.getByRole('group', { name: 'Your progress' });
  // Visiting a lesson marks it as "Learning".
  await expect(progress.getByRole('button', { name: 'Learning' })).toHaveAttribute('aria-pressed', 'true');
  await progress.getByRole('button', { name: 'Needs review' }).click();
  await expect(progress.getByRole('button', { name: 'Needs review' })).toHaveAttribute('aria-pressed', 'true');

  const bookmark = page.getByRole('button', { name: /^Bookmark/ });
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  await bookmark.click();
  await expect(bookmark).toHaveAttribute('aria-pressed', 'true');
  await expect(bookmark).toHaveText('Bookmarked');

  await page.reload();
  await expect(page.getByRole('group', { name: 'Your progress' }).getByRole('button', { name: 'Needs review' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Bookmark/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /^Bookmark/ }).click();
  await expect(page.getByRole('button', { name: /^Bookmark/ })).toHaveAttribute('aria-pressed', 'false');
});

test('runs an example in the worker, edits it and resets it', async ({ page }) => {
  await page.goto('/learn/javascript/data-types');
  const block = example(page, "Checking a value's type");
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  const out = block.getByRole('region', { name: 'Console output' });
  await expect(out).toContainText('string');
  await expect(out).toContainText('number');
  await expect(out).toContainText('boolean');
  await expect(block.getByText(/^Finished in/)).toBeVisible();

  // Edit: a trailing bare expression is logged automatically.
  const editor = block.getByRole('textbox', { name: 'Edit the code' });
  await editor.fill('const total = [1, 2, 3].reduce((a, b) => a + b, 0);\ntotal * 2');
  await editor.press('Control+Enter');
  await expect(out).toHaveText(/^(log:)?12$/);

  // A runaway loop can be stopped.
  await editor.fill('while (true) {}');
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  await block.getByRole('button', { name: 'Stop' }).click();
  await expect(out).toContainText('Stopped.');

  await block.getByRole('button', { name: 'Reset' }).click();
  await expect(editor).toHaveValue(/typeof "hello"/);
  await block.getByRole('button', { name: 'Close' }).click();
  await expect(block.getByRole('button', { name: 'Edit & run' })).toBeVisible();
});

test('runs a DOM example in the sandboxed page', async ({ page }) => {
  test.setTimeout(60_000);
  const dialogs: string[] = [];
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    void d.accept();
  });
  await page.goto(FIRST);
  const block = example(page, 'Reacting to a click');
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  const out = block.getByRole('region', { name: 'Console output' });
  // The sample button is clicked after the code runs, so the click handler's alert fires.
  await expect(out).toContainText('alert: You clicked the button!');
  await expect(block.getByText(/^Finished in/)).toBeVisible();
  expect(dialogs).toEqual(['You clicked the button!']);

  const frame = block.frameLocator('iframe[title="Sandbox page for this example"]');
  await expect(frame.getByRole('button', { name: 'Sample button' })).toBeVisible();
  await expect(block.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts allow-modals');

  // It reads and changes the sample page, and has no network access.
  const editor = block.getByRole('textbox', { name: 'Edit the code' });
  await editor.fill(
    'const h = document.querySelector("h1");\nconsole.log(h.textContent);\nh.textContent = "Changed";\n' +
      'fetch("https://example.com").then(() => console.log("network!"), () => console.log("offline"));\n' +
      'try { parent.document.title } catch (e) { console.log("isolated") }',
  );
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(out).toContainText('Sample heading');
  await expect(out).toContainText('isolated');
  await expect(out).toContainText('offline');
  await expect(out).not.toContainText('network!');
  await expect(frame.getByRole('heading', { name: 'Changed' })).toBeVisible();

  // An endless loop is stopped by the loop guard instead of freezing the page.
  await editor.fill('let i = 0;\nwhile (true) { i++ }');
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(out).toContainText(/Stopped a loop that ran for over 2 s/, { timeout: 10_000 });

  // Code that never finishes can be stopped, which removes the page…
  await editor.fill('console.log("waiting");\nawait new Promise(() => {});');
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(out).toContainText('waiting');
  await block.getByRole('button', { name: 'Stop' }).click();
  await expect(out).toContainText('Stopped. The page was reset.');
  await expect(block.locator('iframe')).toHaveCount(0);

  // …and otherwise hits the time limit.
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(out).toContainText(/Stopped after 5 s \(time limit\)/, { timeout: 10_000 });
  await expect(block.locator('iframe')).toHaveCount(0);

  // Errors are reported.
  await editor.fill('document.querySelector("#missing").textContent = "x";');
  await block.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(out).toContainText(/TypeError/);
});

test('display-only examples have no Run button', async ({ page }) => {
  await page.goto('/learn/web-fundamentals/html-basics');
  const block = example(page, 'A minimal page');
  await expect(block.getByText('HTML', { exact: true })).toBeVisible();
  await expect(block.getByRole('button', { name: 'Copy code' })).toBeVisible();
  await expect(block.getByRole('button', { name: 'Run', exact: true })).toHaveCount(0);
});

test('previous / next navigation and "complete and continue"', async ({ page }) => {
  await page.goto(FIRST);
  const lessons = page.getByRole('navigation', { name: 'Lessons' });
  await expect(lessons.getByRole('link', { name: /Previous/ })).toHaveCount(0);
  await lessons.getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/learn\/javascript\/variables$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Variables' })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole('navigation', { name: 'Lessons' }).getByRole('link', { name: /Previous/ }).click();
  await expect(page).toHaveURL(new RegExp(`${FIRST}$`));

  await page.getByRole('button', { name: 'Mark as completed and continue' }).click();
  await expect(page).toHaveURL(/\/learn\/javascript\/variables$/);
  await page.goBack();
  await expect(page.getByRole('group', { name: 'Your progress' }).getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /Continue to Variables/ })).toBeVisible();
});

test('unknown lessons and subjects show a 404', async ({ page }) => {
  await page.goto('/learn/javascript/no-such-topic');
  await expect(page.getByRole('heading', { level: 1, name: /this lesson doesn.t exist/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to JavaScript' })).toHaveAttribute('href', '/learn/javascript');
  await expect(page).toHaveTitle(/Not found/);

  await page.goto('/learn/no-such-subject/closures');
  await expect(page.getByRole('heading', { level: 1, name: /doesn.t exist/i })).toBeVisible();
});

test('shows related material for DSA and system design lessons', async ({ page }) => {
  await page.goto('/learn/dsa/arrays');
  await expect(page.getByRole('heading', { level: 2, name: 'Practice problems' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Arrays & Hashing/ })).toHaveAttribute('href', '/learn/problems/arrays-hashing');

  await page.goto('/learn/system-design/caching');
  await expect(page.getByRole('heading', { level: 2, name: 'Real-world examples' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Design URL Shortener/ })).toHaveAttribute('href', '/learn/case-studies/url-shortener');
  // Related topics resolve across subjects and link to real lessons.
  const related = page.getByRole('region', { name: 'Related topics' }).getByRole('link');
  expect(await related.count()).toBeGreaterThan(0);
  await related.first().click();
  await expect(page).toHaveURL(/\/learn\/[\w-]+\/[\w-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('fits a 375px screen without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/learn/javascript/data-types');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await example(page, "Checking a value's type").getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Console output' }).first()).toContainText('string');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
