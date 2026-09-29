import { expect, test } from '@playwright/test';

test('generates passwords and passphrases without storing them', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/password-generator');
  await expect(page).toHaveTitle(/Password Generator/);
  const origin = new URL(page.url()).origin;
  const generated = page.getByTestId('generated');

  await expect(generated).toHaveCount(5);
  await page.getByRole('spinbutton', { name: 'Length' }).fill('32');
  await page.getByLabel('Symbols (!@#…)').uncheck();
  await page.getByLabel('Exclude look-alikes (0 O 1 l I |)').check();
  const first = await generated.first().textContent();
  expect(first).toMatch(/^[a-zA-Z2-9]{32}$/);
  expect(first).not.toMatch(/[0O1lI]/);
  await expect(page.getByRole('region', { name: 'Strength' })).toContainText('bits');

  await page.getByRole('button', { name: 'Generate' }).click();
  await expect.poll(() => generated.first().textContent()).not.toBe(first);

  await page.getByRole('spinbutton', { name: 'How many' }).fill('12');
  await expect(generated).toHaveCount(12);

  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Passphrase' }).click();
  await page.getByRole('spinbutton', { name: 'Words' }).fill('6');
  await page.getByLabel('Capitalise words').check();
  const phrase = (await generated.first().textContent()) ?? '';
  expect(phrase.split('-')).toHaveLength(6);
  expect(phrase).toMatch(/^([A-Z][a-z]+-){5}[A-Z][a-z]+$/);

  const list = page.getByRole('region', { name: 'Generated' });
  await list.getByRole('button', { name: 'Copy all' }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).split('\n')).toHaveLength(12);

  // The site may keep its own settings (e.g. theme), but never a generated value.
  const stored = await page.evaluate(() =>
    [localStorage, sessionStorage].flatMap((s) => Object.keys(s).map((k) => `${k}=${s.getItem(k)}`)).join('\n'),
  );
  expect(stored).not.toContain(phrase);
  expect(stored).not.toContain(first);
  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/password-generator');
  await page.getByRole('spinbutton', { name: 'Length' }).fill('128');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
