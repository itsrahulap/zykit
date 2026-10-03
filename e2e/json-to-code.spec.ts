import { expect, test } from '@playwright/test';

test('JSON to Code generates models locally', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const local = r.url().startsWith(origin) || r.url().startsWith('blob:') || r.url().startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/json-to-code');
  await expect(page).toHaveTitle(/JSON to Code/);
  await page.getByLabel('Input JSON').fill('{"user_id":1,"tags":["a"],"owner":[{"nick":"x"},{"nick":null}]}');

  const output = page.getByRole('region', { name: 'Go output' });
  await expect(output.locator('pre')).toContainText('UserID');
  await expect(output.locator('pre')).toContainText('`json:"user_id"`');
  await expect(output.locator('pre')).toContainText('*string');

  const lang = page.getByRole('group', { name: 'Language' });
  await lang.getByRole('button', { name: 'Rust' }).click();
  await expect(page.getByRole('region', { name: 'Rust output' }).locator('pre')).toContainText('pub user_id: i64');
  await lang.getByRole('button', { name: 'Python' }).click();
  await page.getByRole('group', { name: 'Python style' }).getByRole('button', { name: 'Pydantic v2' }).click();
  await expect(page.getByRole('region', { name: 'Python output' }).locator('pre')).toContainText('class Root(BaseModel):');

  await page.getByRole('region', { name: 'Python output' }).getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('BaseModel');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .py' }).click();
  expect((await dl).suggestedFilename()).toBe('models.py');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('JSON to Code has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/json-to-code');
  await page.getByLabel('Input JSON').fill('{"a_very_long_field_name_that_goes_on":{"another_long_nested_field_name":[1,2,3]}}');
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Java' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
