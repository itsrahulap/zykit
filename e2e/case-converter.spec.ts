import { expect, test } from '@playwright/test';

test('shows every case at once, line by line', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/case-converter');
  await expect(page).toHaveTitle(/^Case Converter: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Text').fill('XMLHttpRequest handler\nuser_id');
  const card = (name: string) => page.getByRole('region', { name, exact: true });
  await expect(card('camelCase').locator('pre')).toHaveText('xmlHttpRequestHandler\nuserId');
  await expect(card('PascalCase').locator('pre')).toHaveText('XmlHttpRequestHandler\nUserId');
  await expect(card('snake_case').locator('pre')).toHaveText('xml_http_request_handler\nuser_id');
  await expect(card('CONSTANT_CASE').locator('pre')).toHaveText('XML_HTTP_REQUEST_HANDLER\nUSER_ID');
  await expect(card('kebab-case').locator('pre')).toHaveText('xml-http-request-handler\nuser-id');
  await expect(card('Train-Case').locator('pre')).toHaveText('Xml-Http-Request-Handler\nUser-Id');
  await expect(card('dot.case').locator('pre')).toHaveText('xml.http.request.handler\nuser.id');
  await expect(card('path/case').locator('pre')).toHaveText('xml/http/request/handler\nuser/id');

  await page.getByLabel('Text').fill('the lord of the rings');
  await expect(card('Title Case').locator('pre')).toHaveText('The Lord of the Rings');
  await expect(card('Sentence case').locator('pre')).toHaveText('The lord of the rings');
  await expect(card('UPPER CASE').locator('pre')).toHaveText('THE LORD OF THE RINGS');

  await card('kebab-case').getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('the-lord-of-the-rings');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/case-converter');
  await page.getByLabel('Text').fill('aVeryLongIdentifierNameWithoutAnySpacesThatKeepsGoingAndGoingForeverAndEver');
  await expect(page.getByRole('region', { name: 'snake_case', exact: true }).locator('pre')).toContainText('a_very_long');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
