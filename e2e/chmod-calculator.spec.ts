import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    const local = url.startsWith(origin) || url.startsWith('blob:') || url.startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('chmod Calculator works locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/chmod-calculator');
  await expect(page).toHaveTitle(/chmod Calculator/);
  await page.getByLabel('Octal', { exact: true }).fill('644');
  await expect(page.getByLabel('Symbolic', { exact: true })).toHaveValue('rw-r--r--');
  await page.getByLabel('Owner execute').check();
  await expect(page.getByLabel('Octal', { exact: true })).toHaveValue('744');
  await page.getByLabel(/^setgid/).check();
  await expect(page.getByTestId('row-ls -l')).toHaveText('-rwxr-Sr--');
  await page.getByLabel('Symbolic', { exact: true }).fill('rwxr-sr-t');
  await expect(page.getByLabel('Octal', { exact: true })).toHaveValue('3755');

  await page.getByRole('button', { name: /^755 / }).click();
  await page.getByLabel(/^Expression/).fill('u+x,g-w,o=r');
  await expect(page.getByTestId('expr-result')).toHaveText('754 · -rwxr-xr--');
  await page.getByRole('button', { name: 'Use this mode' }).click();
  await expect(page.getByTestId('row-chmod')).toHaveText('chmod 754 file');

  await page.getByLabel('umask', { exact: true }).fill('027');
  await expect(page.getByTestId('umask-file')).toHaveText('640 -rw-r-----');
  await expect(page.getByTestId('umask-dir')).toHaveText('750 drwxr-x---');

  await page.getByRole('button', { name: /^777 / }).click();
  await expect(page.getByText(/777 lets every user/)).toBeVisible();
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('chmod Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/chmod-calculator');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
