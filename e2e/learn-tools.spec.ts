import { expect, test } from '@playwright/test';

test('a DSA solution opens in the JS Runner with its example calls', async ({ page }) => {
  await page.goto('/learn/problems/arrays-hashing/two-sum');
  await expect(page.getByRole('heading', { level: 1, name: 'Two Sum' })).toBeVisible();
  await page.getByRole('link', { name: 'Open in JS Runner' }).first().click();
  await expect(page).toHaveURL(/\/tools\/js-runner$/);
  const editor = page.getByRole('textbox', { name: /(JavaScript|TypeScript) code/ });
  await expect(editor).toHaveValue(/function twoSum/);
  await expect(editor).toHaveValue(/Example 1: twoSum/);
  expect(await page.evaluate(() => sessionStorage.getItem('zykit-js-runner-handoff'))).toBeNull();

  // Saved, so a reload keeps it.
  await page.reload();
  await expect(editor).toHaveValue(/Example 1: twoSum/);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Console output' })).toContainText('Example 1');
});

test('a lesson links to tools to try it in', async ({ page }) => {
  await page.goto('/learn/databases/joins');
  const section = page.getByRole('region', { name: 'Try it in a tool' });
  await section.getByRole('link', { name: /SQL Formatter/ }).click();
  await expect(page).toHaveURL(/\/tools\/sql-formatter$/);
});

test('Learn home lists topics due for review', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const day = 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'zykit-learn-progress',
      JSON.stringify({ 'javascript/closures': 'needs-review', 'javascript/variables': 'completed', 'javascript/loops': 'completed' }),
    );
    localStorage.setItem('zykit-learn-progress-dates', JSON.stringify({ 'javascript/variables': { at: Date.now() - 10 * day }, 'javascript/loops': { at: Date.now() } }));
  });
  await page.goto('/learn');
  const due = page.getByRole('region', { name: 'Due for review' });
  await expect(due.getByRole('link')).toHaveCount(2);
  await expect(due.getByRole('link').first()).toContainText('Closures');
  await expect(due).toContainText('Completed 10 days ago');
  await due.getByRole('button', { name: 'Mark Variables as reviewed' }).click();
  await expect(due.getByRole('link')).toHaveCount(1);
});
