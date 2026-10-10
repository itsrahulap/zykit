import { expect, test } from '@playwright/test';

test('a full mock test runs, submits with blanks and is saved to history', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /AWS Cloud Practitioner exam/ }).click();
  await expect(page).toHaveURL(/\/learn\/exams\/aws-cloud-practitioner$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cloud Practitioner');

  await page.getByRole('button', { name: 'Start mock test' }).click();
  await expect(page.getByRole('timer', { name: 'Time remaining' })).toHaveText(/^1:(30|29):\d\d$/);
  await expect(page.getByRole('navigation', { name: 'Questions' }).getByRole('button')).toHaveCount(65);
  await expect(page.getByText('Question 1 of 65')).toBeVisible();

  await page.locator('fieldset input').first().check();
  await page.getByRole('button', { name: /^Next/ }).click();
  await expect(page.getByText('Question 2 of 65')).toBeVisible();

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Submit test' }).last().click();
  await expect(page.getByText('Mock test result')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Score by domain' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Incorrect \(\d+\)$/ })).toBeVisible();

  await page.getByRole('button', { name: 'Back to exam overview' }).click();
  await expect(page.getByRole('heading', { name: 'Your attempts' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Full mock test' })).toBeVisible();
});

test('practice mode shows the answer and explanation after checking', async ({ page }) => {
  await page.goto('/learn/exams/aws-cloud-practitioner');
  await page.getByRole('listitem').filter({ hasText: 'Security and Compliance' }).getByRole('button', { name: 'Practice' }).click();
  await expect(page.getByText(/^Practice · Security and Compliance$/)).toBeVisible();

  const check = page.getByRole('button', { name: 'Check answer' });
  await expect(check).toBeDisabled();
  await page.locator('fieldset input').first().check();
  await check.click();
  await expect(page.getByRole('status').filter({ hasText: /Correct|Not quite/ })).toBeVisible();
});

test('the exam page has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/learn/exams/aws-cloud-practitioner');
  await page.getByRole('button', { name: 'Start mock test' }).click();
  await expect(page.getByText('Question 1 of 65')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
