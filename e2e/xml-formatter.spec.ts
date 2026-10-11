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

const SAMPLE =
  '<?xml version="1.0"?><catalog xmlns:dc="http://purl.org/dc/elements/1.1/"><book id="1"><dc:title>XML &amp; You</dc:title><price>12.50</price></book><book id="2"><dc:title>Learning XPath</dc:title><price>8</price></book></catalog>';

test('XML Formatter: format, minify, validate and XPath work locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/xml-formatter');
  await expect(page).toHaveTitle(/XML Formatter/);
  await page.getByLabel('Input XML').fill(SAMPLE);

  const output = page.getByRole('region', { name: 'Output' });
  const action = page.getByRole('group', { name: 'Action' });
  await expect(output.locator('pre')).toContainText('<price>12.50</price>');
  expect(await output.locator('pre').textContent()).toContain('\n  <book id="1">\n    <dc:title>XML &amp; You</dc:title>');
  await action.getByRole('button', { name: 'Minify' }).click();
  expect(await output.locator('pre').textContent()).toContain('</book><book id="2">');
  await action.getByRole('button', { name: 'Validate' }).click();
  await expect(page.getByText(/Valid XML: 7 elements/)).toBeVisible();

  const xpath = page.getByLabel('XPath expression');
  const matches = page.getByRole('list', { name: 'XPath matches' });
  await xpath.fill('//book[price > 10]/@id');
  await expect(page.getByText('1 match', { exact: true })).toBeVisible();
  await expect(matches).toContainText('/catalog/book[1]/@id');
  await expect(matches).toContainText('(attribute)');
  await xpath.fill('//dc:title');
  await expect(page.getByText('2 matches', { exact: true })).toBeVisible();
  await expect(matches).toContainText('/catalog/book[2]/dc:title');
  await expect(matches).toContainText('Learning XPath');
  await xpath.fill('count(//book)');
  await expect(page.getByText(/Result \(number\)/)).toContainText('2');
  await xpath.fill('//[');
  await expect(page.getByRole('status').filter({ hasText: /xpath|expression|valid/i }).last()).toBeVisible();

  await page.getByLabel('Input XML').fill('<r xmlns="urn:x"><i>1</i><i>2</i></r>');
  await xpath.fill('//x:i');
  await page.getByLabel(/Namespace prefixes/).fill('x=urn:x');
  await expect(page.getByText('2 matches', { exact: true })).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('XML Formatter reports the error line and column', async ({ page }) => {
  await page.goto('/tools/xml-formatter');
  await page.getByLabel('Input XML').fill('<a>\n<b></a>');
  await expect(page.getByText('Invalid XML: Expected </b> but found </a>. (line 2, column 4)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jump to error in input' })).toBeVisible();
});

test('XML Formatter has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/xml-formatter');
  await noSideScroll(page);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.getByLabel('XPath expression').fill('//book/@id');
  await expect(page.getByRole('list', { name: 'XPath matches' })).toBeVisible();
  await noSideScroll(page);
});
