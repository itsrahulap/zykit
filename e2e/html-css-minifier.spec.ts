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

test('HTML & CSS Minifier: minify and beautify HTML and CSS locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/html-css-minifier');
  await expect(page).toHaveTitle(/Minifier/);
  const output = page.getByRole('region', { name: 'Output' }).locator('pre');
  const mode = (name: string) => page.getByRole('group', { name: 'Action' }).getByRole('button', { name });

  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(output).toContainText('<pre>');
  const html = (await output.textContent()) ?? '';
  expect(html).toContain('<pre>  keep\n    this  </pre>');
  expect(html).not.toContain('page title');
  expect(html).toContain('<p>Hello <b>world</b> !</p>');
  const before = Number((await page.getByTestId('bytes-before').textContent())!.replace(/\D/g, ''));
  const after = Number((await page.getByTestId('bytes-after').textContent())!.replace(/\D/g, ''));
  expect(after).toBeLessThan(before);
  await expect(page.getByTestId('gzip-after')).not.toHaveText('…');
  await expect(page.getByTestId('gzip-after')).toHaveText(/^(\d|n\/a)/);

  await mode('Beautify').click();
  await expect(output).toContainText('<title>Hello</title>');
  expect(await output.textContent()).toContain('\n  <head>');

  await page.getByRole('button', { name: 'CSS', exact: true }).click();
  await mode('Minify').click();
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(output).toContainText('/*! MIT license */');
  const css = (await output.textContent()) ?? '';
  expect(css).toContain('calc(100% - 2 * 8px)');
  expect(css).toContain('url("a b.png")');
  expect(css).toContain('.box>p,.box a:hover{margin:0 auto;');
  expect(css).not.toContain('/* layout */');
  await mode('Beautify').click();
  await expect(output).toContainText('margin: 0 auto;');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('HTML & CSS Minifier has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/html-css-minifier');
  await noSideScroll(page);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Size' })).toBeVisible();
  await noSideScroll(page);
});
