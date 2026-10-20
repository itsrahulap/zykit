import { expect, test, type Page } from '@playwright/test';

const type = async (page: Page, line: string) => {
  const input = page.getByRole('textbox', { name: 'Command', exact: true });
  await input.fill(line);
  await input.press('Enter');
};

test('Git Playground solves a challenge, stages from the Files panel and draws the graph, locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/git-playground');
  await expect(page).toHaveTitle(/Git Playground/);
  const log = page.getByRole('log', { name: 'Terminal output' });
  const graph = page.getByRole('region', { name: 'Commit graph' });

  // Challenge 1: init, stage README.md with the Files panel button, commit.
  await expect(page.getByRole('heading', { name: 'Challenge 1 of 8: Your first commit' })).toBeVisible();
  await type(page, 'git status');
  await expect(log).toContainText('not a git repository');
  await type(page, 'git init');
  await expect(log).toContainText('Initialized empty Git repository');
  await expect(page.getByText('New, not tracked')).toBeVisible();
  await page.getByRole('button', { name: 'Stage' }).click();
  await expect(log).toContainText('$ git add README.md');
  await type(page, 'git commit -m "First commit"');
  await expect(page.getByText('Solved! Nice work.')).toBeVisible();
  await expect(graph.getByRole('button', { name: /First commit \(HEAD -> main\)/ })).toBeVisible();

  // Challenge 4: the conflict is shown with markers and resolved through the editor.
  await page.getByRole('button', { name: /4\. Fix a merge conflict/ }).click();
  await type(page, 'git merge feature');
  await expect(log).toContainText('CONFLICT (content): Merge conflict in settings.txt');
  await expect(page.getByText('Conflict', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel('Contents of settings.txt')).toHaveValue(/<<<<<<< HEAD/);
  await page.getByLabel('Contents of settings.txt').fill('color = green');
  await page.getByRole('button', { name: 'Save file' }).click();
  await type(page, 'git add settings.txt');
  await type(page, 'git commit -m "Merge feature"');
  await expect(page.getByText('Solved! Nice work.')).toBeVisible();

  // Free play starts empty; history recall with the up arrow.
  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Free play' }).click();
  await expect(page.getByText('Not a repository yet. Run git init to start.')).toBeVisible();
  await type(page, 'git init');
  const input = page.getByRole('textbox', { name: 'Command', exact: true });
  await input.press('ArrowUp');
  await expect(input).toHaveValue('git init');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Git Playground has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/git-playground');
  await type(page, 'git init');
  await type(page, 'git add .');
  await type(page, 'git commit -m "First"');
  await expect(page.getByText('Solved! Nice work.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
