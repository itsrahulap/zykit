import { expect, test, type Page } from '@playwright/test';

const chooseOption = async (page: Page, label: string, option: string) => {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
};

test('Architecture Diagram Builder works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    // blob: is the in-page SVG handed to <img> for the PNG export; it never leaves the browser.
    const local = r.url().startsWith(origin) || r.url().startsWith('blob:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/architecture-diagram-builder');
  await expect(page).toHaveTitle(/Architecture Diagram Builder/);
  const mermaid = page.locator('pre').filter({ hasText: 'flowchart LR' });

  // Load a sample.
  await chooseOption(page, 'Samples', 'Frontend / API / database');
  await expect(page.getByRole('button', { name: 'Service: REST API' })).toBeVisible();
  await expect(mermaid).toContainText('n2("REST API")');

  // Add a node; it becomes selected and editable.
  await chooseOption(page, 'Add node', 'Queue');
  const label = page.getByLabel('Node label');
  await expect(label).toHaveValue('New queue');
  await label.fill('Jobs "fast" [q]');
  await expect(page.getByRole('button', { name: 'Queue: Jobs "fast" [q]' })).toBeVisible();
  await expect(mermaid).toContainText('n4[["Jobs #34;fast#34; #91;q#93;"]]');

  // Connect from the properties panel, then label the edge.
  await chooseOption(page, 'Add an edge to', 'Database');
  await page.getByLabel('Edge label').fill('persist');
  await expect(mermaid).toContainText('n4 -->|"persist"| n3');

  // Undo removes the label edit (one step for the whole typing), then the edge.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(mermaid).toContainText('n4 --> n3');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(mermaid).not.toContainText('n4 --> n3');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(mermaid).toContainText('n4 --> n3');

  // Connect mode with the pointer.
  await page.getByRole('button', { name: 'Connect' }).click();
  await page.getByRole('button', { name: 'Frontend: Web frontend' }).click();
  await page.getByRole('button', { name: 'Database: Database' }).click();
  await expect(mermaid).toContainText('n1 --> n3');

  // Keyboard: focus a node, move it with arrows, delete it.
  const api = page.getByRole('button', { name: 'Service: REST API' });
  await api.focus();
  const before = await api.getAttribute('transform');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(api).not.toHaveAttribute('transform', before!);
  await page.keyboard.press('Delete');
  await expect(api).toHaveCount(0);
  await expect(mermaid).not.toContainText('REST API');

  // Image exports are generated locally (PNG goes through a blob: URL and a canvas, allowed by the CSP).
  for (const [button, file] of [['SVG', 'architecture-diagram.svg'], ['PNG', 'architecture-diagram.png']]) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: button, exact: true }).click();
    expect((await download).suggestedFilename()).toBe(file);
  }

  // The diagram survives a reload (localStorage).
  await page.reload();
  await expect(page.getByRole('button', { name: 'Queue: Jobs "fast" [q]' })).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Architecture Diagram Builder rejects a hostile import and keeps labels as text', async ({ page }) => {
  await page.goto('/tools/architecture-diagram-builder');
  const hostile = {
    format: 'zykit-architecture-diagram',
    version: 1,
    nodes: [{ id: 'a', kind: 'generic', label: '<img src=x onerror="window.pwned=1">', x: 0, y: 0 }],
    edges: [],
    groups: [],
  };
  await page.getByTestId('file-input').setInputFiles({ name: 'd.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(hostile)) });
  await expect(page.getByRole('button', { name: /^Generic: <img/ })).toBeVisible();
  expect(await page.locator('main img').count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)).toBeUndefined();

  await page.getByTestId('file-input').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"nope"}') });
  await expect(page.getByRole('alert')).toContainText('Couldn’t import');
});

test('Architecture Diagram Builder has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/architecture-diagram-builder');
  await expect(page.getByRole('region', { name: /Diagram canvas/ })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
