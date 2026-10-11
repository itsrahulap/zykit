import { expect, test } from '@playwright/test';

test('Notepad works locally', async ({ page, context }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/notepad');
  await expect(page).toHaveTitle(/Notepad/);
  await expect(page.getByText('Your notes live only in this browser')).toBeVisible();

  const title = page.getByLabel('Title');
  const body = page.getByLabel('Note text');
  await title.fill('Groceries');
  await body.fill('# Shopping\n\n- milk\n- eggs <script>alert(1)</script>');
  await expect(page.getByText('6 words').or(page.getByText(/\d+ words?/)).first()).toBeVisible();

  // Autosaves to localStorage and survives a reload.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('zykit-notepad') ?? '')).toContain('Groceries');
  await page.reload();
  await expect(page.getByLabel('Title')).toHaveValue('Groceries');

  // Second note, search, pin.
  await page.getByRole('button', { name: 'New note' }).click();
  await page.getByLabel('Title').fill('Ideas');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('zykit-notepad') ?? '')).toContain('Ideas');
  const list = page.getByRole('region', { name: 'Notes' });
  await expect(list.getByRole('button', { name: /Groceries/ })).toBeVisible();
  await page.getByLabel('Search notes').fill('milk');
  await expect(list.getByRole('button', { name: /Ideas/ })).toHaveCount(0);
  await page.getByLabel('Search notes').fill('');
  await page.getByRole('button', { name: 'Pin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible();

  // Markdown preview is sanitized.
  await list.getByRole('button', { name: /Groceries/ }).click();
  await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Markdown preview' }).click();
  const preview = page.getByTestId('note-preview');
  await expect(preview.getByRole('listitem').first()).toHaveText('milk');
  expect(await preview.locator('script').count()).toBe(0);

  // Export the note as a download, and import a file.
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export note' }).click()]);
  expect(download.suggestedFilename()).toBe('Groceries.md');
  await page.getByLabel('Import notes').setInputFiles({ name: 'todo.txt', mimeType: 'text/plain', buffer: Buffer.from('call mom') });
  await expect(page.getByLabel('Title')).toHaveValue('todo');

  await expect.poll(() => page.evaluate(() => localStorage.getItem('zykit-notepad') ?? '')).toContain('call mom');
  // Cross-tab sync.
  const other = await context.newPage();
  await other.goto('/tools/notepad');
  await expect(other.getByRole('region', { name: 'Notes' }).getByRole('button', { name: /todo/ })).toBeVisible();
  await other.getByRole('region', { name: 'Notes' }).getByRole('button', { name: /todo/ }).click();
  await other.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Edit' }).click();
  await other.getByLabel('Note text').fill('call dad');
  await expect(page.getByTestId('note-preview')).toHaveText('call dad');
  await other.close();

  // Delete asks first.
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Delete this note?')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(list.getByRole('button', { name: /todo/ })).toHaveCount(0);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Notepad has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/notepad');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
