import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const DDL = `CREATE TABLE users (id bigint PRIMARY KEY, email text NOT NULL UNIQUE);
CREATE TABLE orders (id bigint PRIMARY KEY, user_id bigint REFERENCES users (id), note text DEFAULT 'a; b');
CREATE TABLE tags (id int PRIMARY KEY, label text);
CREATE VIEW v AS SELECT 1;`;

test('SQL Schema Visualizer draws, searches and exports locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/sql-schema-visualizer');
  await expect(page).toHaveTitle(/SQL Schema Visualizer/);
  await page.getByLabel('PostgreSQL DDL').fill(DDL);
  await expect(page.getByText('3 tables · 1 foreign key · 1 note')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Line 4' })).toBeVisible();

  const diagram = page.getByRole('region', { name: 'ER diagram' });
  await expect(diagram.locator('[data-table]')).toHaveCount(3);
  await expect(diagram.locator('path[marker-end]')).toHaveCount(1);

  // Search highlights the match and its linked table; the unrelated one is dimmed.
  await page.getByLabel('Find table').fill('orders');
  await expect(diagram.locator('g.opacity-25[data-table]')).toHaveCount(1);
  await page.getByLabel('Find table').fill('');

  // Keyboard pan and zoom change the view transform.
  const view = diagram.locator('svg > g');
  const before = await view.getAttribute('transform');
  await diagram.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('+');
  await expect(view).not.toHaveAttribute('transform', before!);

  await expect(page.getByRole('region', { name: 'Output' })).toContainText('users |o--o{ orders');

  const svg = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG' }).click();
  expect((await svg).suggestedFilename()).toBe('schema.svg');
  const png = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG' }).click();
  expect((await png).suggestedFilename()).toBe('schema.png');

  await page.getByRole('button', { name: 'Open in Query Builder' }).click();
  await expect(page).toHaveURL(/postgres-query-builder/);
  const saved = await page.evaluate(() => localStorage.getItem('zykit-postgres-query-builder'));
  expect(saved).toContain('"name": "orders"');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('SQL Schema Visualizer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/sql-schema-visualizer');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'ER diagram' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`SQL Schema Visualizer diagram state has no axe violations (${colorScheme})`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('zykit-theme', theme), colorScheme);
    await page.goto('/tools/sql-schema-visualizer');
    await page.getByRole('button', { name: 'Try an example' }).click();
    await expect(page.getByRole('region', { name: 'ER diagram' })).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
