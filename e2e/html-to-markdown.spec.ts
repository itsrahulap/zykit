import { expect, test } from '@playwright/test';

test('HTML to Markdown works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/html-to-markdown');
  await expect(page).toHaveTitle(/HTML to Markdown/);
  await page.getByLabel('Input HTML').fill('<h2>Hi</h2><p>a <b>bold</b> <a href="https://x.y">link</a></p><ul><li>one<ul><li>two</li></ul></li></ul><script>alert(1)</script>');
  const out = page.getByRole('region', { name: 'Output' });
  await expect(out).toContainText('## Hi');
  await expect(out).toContainText('a **bold** [link](https://x.y)');
  await expect(out).toContainText('- one');
  await expect(out).not.toContainText('alert');
  await page.getByRole('button', { name: 'Underlined' }).click();
  await expect(out).toContainText('Hi');
  await expect(out).toContainText('---');

  // Rich-text paste is captured as HTML.
  await page.getByLabel('Show paste area').click();
  await page.getByRole('textbox', { name: 'Paste rich text here' }).evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData('text/html', '<h1>Pasted</h1><p><em>rich</em></p>');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(page.getByLabel('Input HTML')).toHaveValue('<h1>Pasted</h1><p><em>rich</em></p>');
  await expect(out).toContainText('*rich*');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('HTML to Markdown has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/html-to-markdown');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
