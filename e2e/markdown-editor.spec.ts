import { expect, test } from '@playwright/test';

const XSS = [
  '[js](javascript:window.__xss=1)',
  '[js2](JaVaScRiPt:window.__xss=1)',
  '<a href="data:text/html,<script>window.__xss=1</script>">data link</a>',
  '<img src=x onerror="window.__xss=1">',
  '<svg onload="window.__xss=1"><circle r=5 /></svg>',
  '<math><mtext><table><mglyph><style><img src=x onerror="window.__xss=1"></style></mglyph></table></mtext></math>',
  '<form action="/x"><input type="text" name="q"><button formaction="javascript:window.__xss=1">go</button></form>',
  '<script>window.__xss=1</script>',
  '<iframe src="javascript:window.__xss=1"></iframe>',
  '<object data="x"></object><embed src="x">',
  '<div style="background:red" onclick="window.__xss=1" id="root">styled</div>',
  '<a href="https://example.com/">external</a>',
  '![remote](https://example.com/pixel.png)',
  '![inline](data:image/gif;base64,R0lGODlhAQABAAAAACw=)',
].join('\n\n');

test('renders GFM safely: sanitizes XSS payloads and blocks remote images', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/markdown-editor');
  await expect(page).toHaveTitle(/^Markdown Editor: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;
  const preview = page.getByTestId('md-preview');
  await expect(preview.locator('h1')).toHaveText('Welcome to the Markdown editor');

  await page.getByLabel('Markdown', { exact: true }).fill(XSS);
  await expect(preview.getByText('external')).toBeVisible();
  const report = await preview.evaluate((root) => {
    const all = [...root.querySelectorAll('*')];
    return {
      eventAttrs: all.flatMap((el) => [...el.attributes].filter((a) => a.name.startsWith('on')).map((a) => `${el.tagName}.${a.name}`)),
      styleAttrs: all.filter((el) => el.hasAttribute('style')).length,
      badHrefs: [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')!).filter((h) => /^\s*(javascript|data):/i.test(h)),
      forbidden: root.querySelectorAll('script,style,iframe,object,embed,form,svg,math,button,textarea').length,
      textInputs: root.querySelectorAll('input:not([type=checkbox])').length,
      imgSrcs: [...root.querySelectorAll('img')].map((i) => i.getAttribute('src')),
      external: [...root.querySelectorAll('a')].find((a) => a.textContent === 'external')?.outerHTML,
      ids: all.map((el) => el.id).filter(Boolean),
    };
  });
  expect(report.eventAttrs).toEqual([]);
  expect(report.styleAttrs).toBe(0);
  expect(report.badHrefs).toEqual([]);
  expect(report.forbidden).toBe(0);
  expect(report.textInputs).toBe(0);
  expect(report.imgSrcs.filter((s) => s && !s.startsWith('data:image/'))).toEqual([]);
  expect(report.imgSrcs).toContain('data:image/gif;base64,R0lGODlhAQABAAAAACw=');
  expect(report.external).toMatch(/target="_blank"/);
  expect(report.external).toMatch(/rel="noopener noreferrer"/);
  expect(report.ids.every((id) => id.startsWith('md-'))).toBe(true);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  await expect(page.getByText(/remote images? (was|were) not loaded/)).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('GFM features, toolbar, shortcuts, exports and draft persistence', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const consoleErrors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  await page.goto('/tools/markdown-editor');
  const editor = page.getByLabel('Markdown', { exact: true });
  const preview = page.getByTestId('md-preview');

  await editor.fill('# Hello World\n\n[jump](#hello-world) ~~old~~ www.example.com\n\n- [x] done\n- [ ] todo\n\n| a | b |\n|---|--:|\n| 1 | 2 |');
  await expect(preview.locator('h1#md-hello-world')).toHaveText('Hello World');
  await expect(preview.getByRole('link', { name: 'jump' })).toHaveAttribute('href', '#md-hello-world');
  await expect(preview.getByRole('link', { name: 'jump' })).not.toHaveAttribute('target', '_blank');
  await expect(preview.locator('del')).toHaveText('old');
  await expect(preview.getByRole('link', { name: 'www.example.com' })).toHaveAttribute('href', 'http://www.example.com');
  await expect(preview.locator('input[type=checkbox]')).toHaveCount(2);
  await expect(preview.locator('input[type=checkbox]').first()).toBeChecked();
  await expect(preview.locator('td[align=right]')).toHaveText('2');
  await expect(page.getByText(/\d+ words · \d+ characters/)).toBeVisible();

  // Shortcuts and toolbar.
  await editor.fill('hi');
  await editor.selectText();
  await editor.press('Control+b');
  await expect(editor).toHaveValue('**hi**');
  await expect(preview.locator('strong')).toHaveText('hi');
  await editor.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 6));
  await editor.press('Control+k');
  await expect(editor).toHaveValue('**hi**[link text](https://)');
  await editor.fill('item');
  await page.getByRole('button', { name: 'Bulleted list' }).click();
  await expect(editor).toHaveValue('- item');
  await page.getByRole('button', { name: 'Insert table' }).click();
  await expect(preview.locator('table th')).toHaveCount(2);

  // Copy HTML and downloads.
  await editor.fill('# Doc\n\ntext');
  await expect(preview.locator('h1')).toHaveText('Doc');
  await page.getByRole('button', { name: 'Copy HTML' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('<h1 id="md-doc">Doc</h1>\n<p>text</p>\n');
  let download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .md' }).click();
  expect((await download).suggestedFilename()).toBe('document.md');
  download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .html' }).click();
  const html = await download;
  expect(html.suggestedFilename()).toBe('document.html');
  const fs = await import('node:fs/promises');
  const saved = await fs.readFile(await html.path(), 'utf8');
  expect(saved).toMatch(/^<!doctype html>[\s\S]*<title>Doc<\/title>[\s\S]*<h1 id="md-doc">Doc<\/h1>/);

  // Draft survives a reload.
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByLabel('Markdown', { exact: true })).toHaveValue('# Doc\n\ntext');

  // Open a file.
  await page.getByTestId('file-input').setInputFiles({ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('## From file') });
  await expect(preview.locator('h2')).toHaveText('From file');
  expect(consoleErrors).toEqual([]);
});

test('uses Edit/Preview tabs and has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/markdown-editor');
  await expect(page.getByLabel('Markdown', { exact: true })).toBeVisible();
  await expect(page.getByTestId('md-preview')).toBeHidden();
  await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByTestId('md-preview').locator('table')).toBeVisible();
  await expect(page.getByLabel('Markdown', { exact: true })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
