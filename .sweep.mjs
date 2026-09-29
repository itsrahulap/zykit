import { chromium } from '@playwright/test';
import { catalog } from './src/learn/data/catalog.generated.ts';
const b = await chromium.launch();
const ctx = await b.newContext();
const paths = [
  ...catalog.subjects.flatMap((s) => s.topics.map((t) => `/learn/${s.id}/${t.id}`)),
  ...catalog.problems.map((p) => `/learn/problems/${p.category}/${p.id}`),
];
let total = 0; const stuck = [], errored = [], pageErrors = [];
const conc = 6;
async function check(path) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => pageErrors.push(path + ': ' + String(e).slice(0, 120)));
  try {
    await p.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' });
    const runs = p.getByRole('button', { name: 'Run', exact: true });
    const n = await runs.count();
    for (let i = 0; i < n; i++) await runs.nth(i).click();
    total += n;
    if (n) await p.waitForTimeout(6500);
    const blocks = await p.locator('text=/^(Running…|Finished.*|Could not run.*|Stopped.*|Waiting.*)$/').allInnerTexts();
    blocks.forEach((s, i) => { if (s.startsWith('Running') || s.startsWith('Stopped after')) stuck.push(`${path} #${i + 1}: ${s}`); if (s.startsWith('Could not') || s.includes('with an error')) errored.push(`${path} #${i + 1}: ${s}`); });
  } catch (e) { pageErrors.push(path + ': ' + String(e).slice(0, 100)); }
  await p.close();
}
for (let i = 0; i < paths.length; i += conc) await Promise.all(paths.slice(i, i + conc).map(check));
console.log('pages', paths.length, 'examples run', total);
console.log('stuck/timeouts', stuck.length, '\n' + stuck.slice(0, 20).join('\n'));
console.log('errored', errored.length, '\n' + errored.slice(0, 40).join('\n'));
console.log('page errors', pageErrors.length, '\n' + pageErrors.slice(0, 10).join('\n'));
await b.close();
