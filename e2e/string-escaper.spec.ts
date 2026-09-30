import { expect, test } from '@playwright/test';

test('String Escaper escapes and unescapes', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/string-escaper');
  await expect(page).toHaveTitle(/String Escaper/);
  const output = page.getByRole('region', { name: 'Output' }).locator('pre');
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('say "hi"\n<b>');
  await expect(output).toHaveText('say \\"hi\\"\\n<b>');
  await expect(page.getByText(/Round trip checked/)).toBeVisible();

  await page.getByRole('combobox', { name: 'Format' }).click();
  await page.getByRole('option', { name: "Shell (POSIX '…')" }).click();
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill("it's");
  await expect(output).toHaveText(`'it'\\''s'`);

  await page.getByRole('button', { name: 'Use output as input' }).click();
  await expect(page.getByRole('textbox', { name: 'Escaped text' })).toHaveValue(`'it'\\''s'`);
  await expect(output).toHaveText("it's");

  await page.getByRole('combobox', { name: 'Format' }).click();
  await page.getByRole('option', { name: 'JSON string' }).click();
  await page.getByRole('textbox', { name: 'Escaped text' }).fill('bad \\q escape');
  await expect(page.getByText('Unknown escape sequence \\q.').first()).toBeVisible();
  await expect(page.getByText('Line 1, column 5')).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('String Escaper has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/string-escaper');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
