import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!(u.startsWith(origin) || u.startsWith('blob:') || u.startsWith('data:')) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('Lorem Ipsum Generator makes reproducible text in several formats', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/lorem-ipsum');
  await expect(page).toHaveTitle(/Lorem Ipsum Generator/);
  const output = page.getByRole('region', { name: 'Output', exact: true }).locator('pre');
  await expect(output).toHaveText(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit/);

  await page.getByLabel('Seed').fill('e2e');
  const first = await output.textContent();
  await page.getByRole('button', { name: 'Regenerate' }).click();
  await expect(output).not.toHaveText(first!);
  await page.getByLabel('Seed').fill('e2e');
  await expect(output).toHaveText(first!);

  await page.getByRole('group', { name: 'Unit' }).getByRole('button', { name: 'Words' }).click();
  await page.getByLabel('How many').fill('5');
  await expect(output).toHaveText('Lorem ipsum dolor sit amet.');

  await page.getByRole('group', { name: 'Unit' }).getByRole('button', { name: 'List items' }).click();
  await page.getByRole('group', { name: 'Format' }).getByRole('button', { name: 'HTML' }).click();
  await expect(output).toHaveText(/^<ul>\n {2}<li>Lorem ipsum dolor sit amet<\/li>/);

  await page.getByRole('group', { name: 'Words' }).getByRole('button', { name: 'English' }).click();
  await expect(output).not.toContainText('Lorem');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download \.html/ }).click();
  expect((await download).suggestedFilename()).toBe('lorem-ipsum.html');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Lorem Ipsum Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/lorem-ipsum');
  await expect(page.getByRole('region', { name: 'Output', exact: true })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
