// Accessibility audit (WCAG 2.1 AA). Documents rather than fails: every check writes its findings
// to A11Y_OUT (default /private/tmp/claude-501/a11y-raw) and the last worker merges them into
// a11y-results.json next to it. Set A11Y_STRICT=1 to make the axe scans fail on violations.
//
// Sections: axe scans (every route x light/dark x 1280/375, plus open overlays and an error state),
// keyboard walks, token contrast, reflow (320px / 640px) and text spacing, touch targets,
// and structural checks (titles, headings, landmarks, live regions, iframes, reduced motion).

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.A11Y_OUT ?? '/private/tmp/claude-501/a11y-raw';
const SUMMARY = process.env.A11Y_SUMMARY ?? '/private/tmp/claude-501/a11y-results.json';
const STRICT = process.env.A11Y_STRICT === '1';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Tool ids come from the registry's imports (folder name = tool id), without loading React code.
const registry = fs.readFileSync(path.join(process.cwd(), 'src/tools/registry.ts'), 'utf8');
const TOOL_IDS = [...registry.matchAll(/^import \w+ from '\.\/([\w-]+)';$/gm)].map((m) => m[1]);

const ROUTES: string[] = [
  '/',
  ...TOOL_IDS.map((id) => `/tools/${id}`),
  '/learn',
  '/learn/javascript',
  '/learn/javascript/what-is-javascript',
  '/learn/problems',
  '/learn/problems/arrays-hashing',
  '/learn/problems/arrays-hashing/contains-duplicate',
  '/learn/case-studies',
  '/learn/case-studies/url-shortener',
  '/learn/progress',
  '/learn/bookmarks',
  '/blog',
  '/blog/claude-code-plugins-explained',
  '/this-page-does-not-exist',
];

type Theme = 'light' | 'dark';
const THEMES: Theme[] = ['light', 'dark'];
const WIDTHS = [1280, 375];

function save(kind: string, name: string, data: unknown) {
  const dir = path.join(OUT, kind);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name.replace(/[^\w.-]+/g, '_').replace(/^_+/, '') || 'root'}.json`);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1));
  fs.renameSync(`${file}.tmp`, file);
}

async function open(browser: Browser, theme: Theme, width: number, extra: BrowserContextOptions = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 740 : 900 }, ...extra });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('zykit-theme', t);
    } catch {}
  }, theme);
  const page = await context.newPage();
  return { context, page };
}

async function ready(page: Page, url: string) {
  await page.goto(url);
  await page.locator('h1').first().waitFor({ timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(250);
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return {
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      tags: v.tags.filter((t) => /^wcag\d/.test(t)),
      nodes: v.nodes.map((n) => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 200),
        data: (n.any[0]?.data ?? n.all[0]?.data ?? null) as unknown,
        summary: n.failureSummary?.slice(0, 300),
      })),
    })),
    incomplete: r.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
  };
}

// ---------------------------------------------------------------------------------------------
// 1. axe scans
// ---------------------------------------------------------------------------------------------
test.describe('axe', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const route of ROUTES) {
    test(`axe ${route}`, async ({ browser }) => {
      const scans = [];
      for (const theme of THEMES) {
        for (const width of WIDTHS) {
          const { context, page } = await open(browser, theme, width);
          await ready(page, route);
          const title = await page.title();
          scans.push({ route, theme, width, title, ...(await axe(page)) });
          await context.close();
        }
      }
      save('axe', route, scans);
      if (STRICT) expect(scans.flatMap((s) => s.violations)).toEqual([]);
    });
  }

  const STATES: { name: string; url: string; width?: number; act: (p: Page) => Promise<void> }[] = [
    {
      name: 'command-palette',
      url: '/',
      act: async (p) => {
        await p.keyboard.press('Control+k');
        await p.getByRole('dialog', { name: 'Search Zykit' }).waitFor();
        await p.getByRole('dialog', { name: 'Search Zykit' }).getByRole('combobox').fill('json');
        await p.waitForTimeout(300);
      },
    },
    {
      name: 'select-open',
      url: '/tools/json-formatter',
      act: async (p) => {
        await p.locator('main button[role="combobox"]').first().click();
        await p.getByRole('listbox').first().waitFor();
      },
    },
    {
      name: 'learn-drawer',
      url: '/learn',
      width: 375,
      act: async (p) => {
        await p.getByRole('button', { name: 'Browse' }).click();
        await p.getByRole('dialog', { name: 'Browse Learn' }).waitFor();
      },
    },
    {
      name: 'json-formatter-error',
      url: '/tools/json-formatter',
      act: async (p) => {
        await p.getByLabel('Input JSON').fill('{\n  "a": 1,\n}');
        await p.waitForTimeout(500);
      },
    },
    {
      name: 'topic-playground',
      url: '/learn/javascript/what-is-javascript',
      act: async (p) => {
        const block = p.locator('#main div.min-w-0.space-y-3').filter({ has: p.getByRole('heading', { level: 3, name: 'Reacting to a click' }) });
        await block.getByRole('button', { name: 'Run', exact: true }).click();
        await block.locator('iframe').waitFor({ timeout: 15_000 }).catch(() => {});
        await p.waitForTimeout(1000);
      },
    },
    {
      name: 'shortcuts-help',
      url: '/tools/json-formatter',
      act: async (p) => {
        await p.locator('body').click({ position: { x: 5, y: 5 } });
        await p.keyboard.press('?');
        await p.getByRole('dialog').first().waitFor({ timeout: 5000 });
      },
    },
    {
      name: 'regex-tester-error',
      url: '/tools/regex-tester',
      act: async (p) => {
        const field = p.getByRole('textbox').first();
        await field.fill('([a-z');
        await p.waitForTimeout(400);
      },
    },
  ];
  for (const s of STATES) {
    test(`axe state ${s.name}`, async ({ browser }) => {
      const scans = [];
      for (const theme of THEMES) {
        for (const width of s.width ? [s.width] : WIDTHS) {
          const { context, page } = await open(browser, theme, width);
          await ready(page, s.url);
          let actError: string | null = null;
          await s.act(page).catch((e: Error) => (actError = e.message.slice(0, 200)));
          scans.push({ route: `${s.url} [${s.name}]`, theme, width, actError, ...(await axe(page)) });
          await context.close();
        }
      }
      save('axe', `state-${s.name}`, scans);
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 2. Keyboard
// ---------------------------------------------------------------------------------------------
const KEYBOARD_PAGES = [
  '/',
  '/tools/json-formatter',
  '/tools/regex-tester',
  '/tools/image-compressor',
  '/tools/cron-builder',
  '/tools/csv-viewer',
  '/learn/javascript/what-is-javascript',
];

/** Tags every tabbable element with its unfocused look so the walk can tell whether focus changes it. */
async function tagTabbables(page: Page) {
  await page.evaluate(() => {
    const sel = 'a[href], button, input, select, textarea, summary, iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
      const cs = getComputedStyle(el);
      el.dataset.a11yIdx = String(i);
      el.dataset.a11yLook = JSON.stringify([cs.outlineStyle === 'none' ? 'none' : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.textDecorationLine, cs.color]);
    });
  });
}

async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const look = [cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0 ? 'none' : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.textDecorationLine, cs.color];
    const before = el.dataset.a11yLook ? (JSON.parse(el.dataset.a11yLook) as string[]) : null;
    const changed = before ? look.map((v, i) => (v !== before[i] ? ['outline', 'boxShadow', 'border', 'bg', 'underline', 'color'][i] : null)).filter(Boolean) : ['untagged'];
    const name = (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby')!.split(' ')[0])?.textContent) || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || (el as HTMLInputElement).value || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    const region = el.closest('dialog,[role=dialog]') ? 'dialog' : el.closest('header') && !el.closest('main') ? 'header' : el.closest('main') ? 'main' : el.closest('footer') ? 'footer' : 'other';
    return {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      role: el.getAttribute('role'),
      name,
      region,
      outline: look[0],
      boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 80),
      indicatorChanges: changed,
      focusVisible: el.matches(':focus-visible'),
      rect: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      hidden: r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || Number(cs.opacity) === 0,
    };
  });
}

async function tabWalk(page: Page, max = 150) {
  const stops: NonNullable<Awaited<ReturnType<typeof focused>>>[] = [];
  let stuck = 0;
  let wrapped = false;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    if (!f) {
      wrapped = true;
      break;
    }
    const prev = stops[stops.length - 1];
    if (prev && prev.tag === f.tag && prev.name === f.name && prev.rect.y === f.rect.y && prev.rect.x === f.rect.x) {
      if (++stuck >= 3) break;
    } else stuck = 0;
    stops.push(f);
  }
  return { stops, wrapped, stuck: stuck >= 3 };
}

test.describe('keyboard', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const url of KEYBOARD_PAGES) {
    test(`keyboard ${url}`, async ({ browser }) => {
      const result: Record<string, unknown> = { url };
      for (const theme of THEMES) {
        const { context, page } = await open(browser, theme, 1280);
        await ready(page, url);
        await tagTabbables(page);
        // Skip link: first Tab stop, visible, and Enter moves focus to main.
        await page.keyboard.press('Tab');
        const skip = await focused(page);
        const skipLook = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const cs = getComputedStyle(el);
          return { color: cs.color, bg: cs.backgroundColor, clip: cs.clip, pos: cs.position };
        });
        await page.keyboard.press('Enter');
        await page.keyboard.press('Tab');
        const afterSkip = await focused(page);
        result[`skip_${theme}`] = { skip, skipLook, afterSkip };
        if (theme === 'light') {
          await ready(page, url);
          await tagTabbables(page);
          const walk = await tabWalk(page);
          const noIndicator = walk.stops.filter((s) => s.indicatorChanges.length === 0 && s.outline === 'none');
          const hidden = walk.stops.filter((s) => s.hidden);
          // Large upward jumps within the same region hint at an illogical order.
          const jumps = walk.stops
            .map((s, i) => ({ s, prev: walk.stops[i - 1] }))
            .filter(({ s, prev }) => prev && prev.region === s.region && s.rect.y < prev.rect.y - 150)
            .map(({ s, prev }) => ({ from: `${prev!.tag}:${prev!.name}@${prev!.rect.y}`, to: `${s.tag}:${s.name}@${s.rect.y}` }));
          result.walk = { count: walk.stops.length, wrapped: walk.wrapped, stuck: walk.stuck, stops: walk.stops.map((s) => `${s.region}|${s.tag}${s.role ? `[${s.role}]` : ''}|${s.name}|${s.indicatorChanges.join('+') || s.outline}`), noIndicator, hidden, jumps };
          // Shift+Tab walks backwards too (no one-way traps).
          await page.keyboard.press('Shift+Tab');
          result.shiftTabWorks = (await focused(page)) !== null;
        } else {
          await ready(page, url);
          await tagTabbables(page);
          const walk = await tabWalk(page, 40);
          result.darkIndicator = walk.stops.slice(0, 40).map((s) => `${s.tag}|${s.name}|${s.outline}|${s.indicatorChanges.join('+')}`);
        }
        await context.close();
      }
      save('keyboard', url, result);
    });
  }

  test('keyboard widgets', async ({ browser }) => {
    const out: Record<string, unknown> = {};
    const { context, page } = await open(browser, 'light', 1280);

    // Command palette: open, arrows, Enter, Escape, focus restore.
    await ready(page, '/tools/json-formatter');
    const search = page.getByRole('button', { name: /search/i }).first();
    await search.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Search Zykit' });
    const pal: Record<string, unknown> = { opensWithEnter: await dialog.isVisible().catch(() => false) };
    if (!pal.opensWithEnter) {
      await page.keyboard.press('Control+k');
    }
    await dialog.waitFor();
    const input = dialog.getByRole('combobox');
    pal.inputFocused = await input.evaluate((el) => el === document.activeElement);
    pal.inputAttrs = await input.evaluate((el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value])));
    await input.fill('base');
    await page.waitForTimeout(200);
    const ad1 = await input.getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    const ad2 = await input.getAttribute('aria-activedescendant');
    pal.arrowMovesActive = ad1 !== ad2 && !!ad2;
    pal.dialogAttrs = await dialog.evaluate((el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value])));
    pal.backgroundInert = await page.evaluate(() => {
      const main = document.getElementById('main');
      return { mainInert: main?.closest('[inert]') !== null, mainAriaHidden: main?.closest('[aria-hidden="true"]') !== null };
    });
    // Tab stays within the dialog.
    const inside: boolean[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      inside.push(await dialog.evaluate((d) => d.contains(document.activeElement)));
    }
    pal.tabTrappedInDialog = inside.every(Boolean);
    await input.focus();
    await page.keyboard.press('Escape');
    pal.escapeCloses = !(await dialog.isVisible());
    pal.focusRestored = await search.evaluate((el) => el === document.activeElement);
    pal.statusAnnounce = await page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map((e) => `${e.tagName.toLowerCase()}[${e.getAttribute('role') ?? ''}|${e.getAttribute('aria-live') ?? ''}]`).slice(0, 10));
    out.palette = pal;

    // Select (select-only combobox) on JSON Formatter.
    await ready(page, '/tools/json-formatter');
    const combo = page.locator('main button[role="combobox"]').first();
    const sel: Record<string, unknown> = { attrs: await combo.evaluate((el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))) };
    await combo.focus();
    const before = await combo.innerText();
    await page.keyboard.press('ArrowDown');
    sel.arrowOpens = await page.getByRole('listbox').first().isVisible().catch(() => false);
    await page.keyboard.press('ArrowDown');
    sel.activeDesc = await combo.getAttribute('aria-activedescendant');
    await page.keyboard.press('Enter');
    sel.enterSelects = (await combo.innerText()) !== before;
    sel.closedAfterEnter = !(await page.getByRole('listbox').first().isVisible().catch(() => false));
    await page.keyboard.press('Space');
    sel.spaceOpens = await page.getByRole('listbox').first().isVisible().catch(() => false);
    await page.keyboard.press('Escape');
    sel.escapeCloses = !(await page.getByRole('listbox').first().isVisible().catch(() => false));
    sel.focusStays = await combo.evaluate((el) => el === document.activeElement);
    out.select = sel;

    // Segmented control (role=group of aria-pressed buttons): Space/Enter toggle.
    const seg = page.locator('main [role="group"] button[aria-pressed]').first();
    if (await seg.count()) {
      const group = seg.locator('xpath=..');
      const buttons = group.locator('button[aria-pressed]');
      const n = await buttons.count();
      await buttons.nth(n - 1).focus();
      await page.keyboard.press('Space');
      const pressed = await buttons.nth(n - 1).getAttribute('aria-pressed');
      await page.keyboard.press('ArrowLeft');
      const afterArrow = await page.evaluate(() => (document.activeElement as HTMLElement)?.innerText);
      out.segmented = { label: await group.getAttribute('aria-label'), count: n, spaceToggles: pressed === 'true', focusAfterArrowLeft: afterArrow };
    }

    // Tabs on a tool that has them.
    for (const url of ['/tools/csv-viewer', '/tools/image-compressor', '/tools/clean-image', '/tools/cron-builder', '/tools/markdown-editor']) {
      await ready(page, url);
      const tab = page.getByRole('tab').first();
      if (!(await tab.count())) continue;
      await tab.focus();
      await page.keyboard.press('ArrowRight');
      const now = await page.evaluate(() => ({ role: document.activeElement?.getAttribute('role'), selected: document.activeElement?.getAttribute('aria-selected') }));
      await page.keyboard.press('Home');
      const home = await page.evaluate(() => document.activeElement?.getAttribute('aria-selected'));
      out[`tabs ${url}`] = { arrowRight: now, homeKey: home, panelsExist: await page.locator('[role=tabpanel]').count() };
      break;
    }

    // Learn drawer (375px).
    await page.setViewportSize({ width: 375, height: 740 });
    await ready(page, '/learn');
    const browse = page.getByRole('button', { name: 'Browse' });
    await browse.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Browse Learn' });
    const dr: Record<string, unknown> = { opens: await drawer.isVisible().catch(() => false) };
    dr.attrs = await drawer.evaluate((el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))).catch(() => null);
    await page.keyboard.press('Escape');
    dr.escapeCloses = !(await drawer.isVisible().catch(() => false));
    dr.focusRestored = await browse.evaluate((el) => el === document.activeElement);
    out.drawer = dr;

    // Shortcuts dialog (?): Escape + restore.
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page, '/tools/json-formatter');
    const footerBtn = page.getByRole('button', { name: 'Keyboard shortcuts' });
    await footerBtn.focus();
    await page.keyboard.press('Enter');
    const help = page.getByRole('dialog').first();
    const sh: Record<string, unknown> = { opens: await help.isVisible().catch(() => false) };
    sh.name = await help.getAttribute('aria-label').catch(() => null);
    sh.tag = await help.evaluate((e) => e.tagName.toLowerCase()).catch(() => null);
    sh.focusInside = await help.evaluate((d) => d.contains(document.activeElement)).catch(() => null);
    await page.keyboard.press('Escape');
    sh.escapeCloses = !(await help.isVisible().catch(() => false));
    sh.focusRestored = await footerBtn.evaluate((el) => el === document.activeElement);
    out.shortcuts = sh;

    // Code editors: does Tab get trapped in the JSON input / lesson editor?
    await ready(page, '/tools/json-formatter');
    const jsonInput = page.getByLabel('Input JSON');
    await jsonInput.focus();
    await page.keyboard.press('Tab');
    out.jsonInputTab = { leavesField: !(await jsonInput.evaluate((el) => el === document.activeElement)) };
    await ready(page, '/learn/javascript/data-types');
    const editor = page.locator('#main textarea').first();
    if (await editor.count()) {
      await editor.focus();
      await page.keyboard.press('Tab');
      const stay = await editor.evaluate((el) => el === document.activeElement);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Tab');
      const leaves = !(await editor.evaluate((el) => el === document.activeElement));
      const hint = await editor.evaluate((el) => [el.getAttribute('aria-describedby') && document.getElementById(el.getAttribute('aria-describedby')!)?.textContent, el.getAttribute('aria-label')]);
      out.lessonEditorTab = { tabIndents: stay, escapeThenTabLeaves: leaves, hint };
    }

    // Enter/Space on a <details> summary (Learn interview questions).
    await ready(page, '/learn/javascript/what-is-javascript');
    const summary = page.locator('details summary').first();
    await summary.focus();
    await page.keyboard.press('Enter');
    const openEnter = await page.locator('details').first().getAttribute('open');
    await page.keyboard.press('Space');
    const openSpace = await page.locator('details').first().getAttribute('open');
    out.details = { enterOpens: openEnter !== null, spaceToggles: openSpace === null };

    await context.close();
    save('keyboard', 'widgets', out);
  });
});

// ---------------------------------------------------------------------------------------------
// 3. Token contrast (resolved in the browser so oklch/Tailwind defaults are exact)
// ---------------------------------------------------------------------------------------------
test('contrast tokens', async ({ browser }) => {
  const { context, page } = await open(browser, 'light', 1280);
  await ready(page, '/');
  const pairs: [string, string, string, number][] = [
    // label, fg, bg, required
    ['Body text (light)', 'slate-900', 'slate-50', 4.5],
    ['Body text on card (light)', 'slate-900', 'white', 4.5],
    ['Secondary text slate-600 on white', 'slate-600', 'white', 4.5],
    ['Secondary text slate-600 on slate-50', 'slate-600', 'slate-50', 4.5],
    ['Muted text slate-500 on white', 'slate-500', 'white', 4.5],
    ['Muted text slate-500 on slate-50', 'slate-500', 'slate-50', 4.5],
    ['Muted text slate-500 on slate-100', 'slate-500', 'slate-100', 4.5],
    ['slate-400 text on white (light, e.g. icons/hints)', 'slate-400', 'white', 4.5],
    ['Eyebrow nav slate-500 on slate-50 (11.5px bold caps)', 'slate-500', 'slate-50', 4.5],
    ['Primary button ink on primary', 'primary-ink', 'primary', 4.5],
    ['Primary button edge vs page (1.4.11)', 'primary-edge', 'slate-50', 3],
    ['Primary fill vs white card (1.4.11)', 'primary', 'white', 3],
    ['Link emerald-700 on white', 'emerald-700', 'white', 4.5],
    ['Link emerald-600 on white', 'emerald-600', 'white', 4.5],
    ['Accent emerald-500 text on white', 'emerald-500', 'white', 4.5],
    ['Focus ring #4a8062 vs slate-50 (1.4.11)', 'emerald-500', 'slate-50', 3],
    ['Focus ring #4a8062 vs white', 'emerald-500', 'white', 3],
    ['Input border slate-300 vs white (1.4.11)', 'slate-300', 'white', 3],
    ['Input border slate-200 vs white (1.4.11)', 'slate-200', 'white', 3],
    ['Secondary button ring slate-300 vs white', 'slate-300', 'white', 3],
    ['Placeholder slate-400 on white', 'slate-400', 'white', 4.5],
    ['Badge neutral slate-700 on slate-100', 'slate-700', 'slate-100', 4.5],
    ['Badge green emerald-800 on emerald-50', 'emerald-800', 'emerald-50', 4.5],
    ['Badge amber amber-800 on amber-50', 'amber-800', 'amber-50', 4.5],
    ['Badge red red-800 on red-50', 'red-800', 'red-50', 4.5],
    ['Badge blue sky-800 on sky-50', 'sky-800', 'sky-50', 4.5],
    ['Badge violet violet-800 on violet-50', 'violet-800', 'violet-50', 4.5],
    ['Error text red-700 on white', 'red-700', 'white', 4.5],
    ['Alert red-900 on red-50', 'red-900', 'red-50', 4.5],
    ['Warning amber-900 on amber-50', 'amber-900', 'amber-50', 4.5],
    ['Disabled button slate-500 on slate-200 (exempt)', 'slate-500', 'slate-200', 0],
    ['Tab underline slate-900 vs white', 'slate-900', 'white', 3],
    ['Checkbox/toggle off border slate-300 vs white', 'slate-300', 'white', 3],
    // dark
    ['DARK body slate-100 on slate-950', 'slate-100', 'slate-950', 4.5],
    ['DARK secondary slate-400 on slate-900', 'slate-400', 'slate-900', 4.5],
    ['DARK secondary slate-400 on slate-950', 'slate-400', 'slate-950', 4.5],
    ['DARK secondary slate-400 on slate-800', 'slate-400', 'slate-800', 4.5],
    ['DARK muted slate-500 on slate-900', 'slate-500', 'slate-900', 4.5],
    ['DARK muted slate-500 on slate-950', 'slate-500', 'slate-950', 4.5],
    ['DARK slate-300 on slate-900', 'slate-300', 'slate-900', 4.5],
    ['DARK link emerald-400 on slate-900', 'emerald-400', 'slate-900', 4.5],
    ['DARK link emerald-400 on slate-950', 'emerald-400', 'slate-950', 4.5],
    ['DARK primary ink on primary', 'primary-ink', 'primary', 4.5],
    ['DARK primary fill vs slate-900 (1.4.11)', 'primary', 'slate-900', 3],
    ['DARK focus ring #4a8062 vs slate-950 (1.4.11)', 'emerald-500', 'slate-950', 3],
    ['DARK focus ring #4a8062 vs slate-900', 'emerald-500', 'slate-900', 3],
    ['DARK input border slate-700 vs slate-900 (1.4.11)', 'slate-700', 'slate-900', 3],
    ['DARK input border slate-700 vs slate-950', 'slate-700', 'slate-950', 3],
    ['DARK input border slate-600 vs slate-900', 'slate-600', 'slate-900', 3],
    ['DARK placeholder slate-500 on slate-900', 'slate-500', 'slate-900', 4.5],
    ['DARK placeholder slate-600 on slate-950', 'slate-600', 'slate-950', 4.5],
    ['DARK badge neutral slate-300 on slate-800', 'slate-300', 'slate-800', 4.5],
    ['DARK badge green emerald-300 on emerald-950', 'emerald-300', 'emerald-950', 4.5],
    ['DARK badge amber amber-300 on amber-950', 'amber-300', 'amber-950', 4.5],
    ['DARK badge red red-300 on red-950', 'red-300', 'red-950', 4.5],
    ['DARK badge blue sky-300 on sky-950', 'sky-300', 'sky-950', 4.5],
    ['DARK badge violet violet-300 on violet-950', 'violet-300', 'violet-950', 4.5],
    ['DARK error red-400 on slate-900', 'red-400', 'slate-900', 4.5],
    ['DARK disabled slate-400 on slate-700 (exempt)', 'slate-400', 'slate-700', 0],
    ['DARK skip link slate-100 on white (focus:bg-white)', 'slate-100', 'white', 4.5],
  ];
  const results = await page.evaluate((pairs) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const probe = document.createElement('span');
    document.body.append(probe);
    const resolve = (token: string) => {
      const css = token === 'white' ? '#ffffff' : `var(--color-${token})`;
      probe.style.color = '';
      probe.style.color = css;
      const c = getComputedStyle(probe).color;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const defined = token === 'white' || getComputedStyle(document.documentElement).getPropertyValue(`--color-${token}`).trim() !== '';
      return { hex: `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`, rgb: [r, g, b], defined };
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    return pairs.map(([label, fg, bg, req]) => {
      const a = resolve(fg);
      const b = resolve(bg);
      const L1 = lum(a.rgb);
      const L2 = lum(b.rgb);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      return { label, fg, fgHex: a.hex, fgDefined: a.defined, bg, bgHex: b.hex, bgDefined: b.defined, ratio: Math.round(ratio * 100) / 100, required: req, pass: req === 0 ? 'exempt' : ratio >= req };
    });
  }, pairs);
  save('contrast', 'tokens', results);
  await context.close();
});

// ---------------------------------------------------------------------------------------------
// 4. Reflow (320 px = 400% of 1280; 640 px = 200%) and text spacing
// ---------------------------------------------------------------------------------------------
async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const pageScroll = document.documentElement.scrollWidth - w;
    const offenders: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= w + 1) continue;
      let scrolls = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) {
          scrolls = true;
          break;
        }
      }
      if (scrolls) continue;
      // Only report the outermost offender.
      if (el.parentElement && el.parentElement.getBoundingClientRect().right > w + 1) continue;
      offenders.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${[...el.classList].slice(0, 4).join('.')} right=${Math.round(r.right)} "${(el.innerText || '').trim().slice(0, 30)}"`);
    }
    return { pageScroll, offenders: offenders.slice(0, 8) };
  });
}

async function clippedText(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('main *, header *')) {
      const cs = getComputedStyle(el);
      if (!/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
      if (!el.innerText?.trim() || el.matches('textarea,input,pre,code,.sr-only')) continue;
      if (cs.textOverflow === 'ellipsis') continue;
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
        out.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 5).join('.')} "${el.innerText.trim().slice(0, 30)}" (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`);
      }
    }
    return out.slice(0, 8);
  });
}

test.describe('reflow', () => {
  test.describe.configure({ mode: 'parallel' });
  const chunks = 6;
  for (let c = 0; c < chunks; c++) {
    test(`reflow chunk ${c}`, async ({ browser }) => {
      const routes = ROUTES.filter((_, i) => i % chunks === c);
      const out = [];
      for (const width of [320, 640]) {
        const { context, page } = await open(browser, 'light', width, { viewport: { width, height: width === 320 ? 256 : 512 } });
        for (const route of routes) {
          await ready(page, route);
          out.push({ route, width, ...(await overflowReport(page)) });
        }
        await context.close();
      }
      save('reflow', `chunk-${c}`, out);
    });
  }

  test('text spacing', async ({ browser }) => {
    const out = [];
    for (const route of ['/', '/tools/json-formatter', '/tools/cron-builder', '/tools/image-compressor', '/learn/javascript/what-is-javascript', '/learn/problems/arrays-hashing/contains-duplicate', '/blog/claude-code-plugins-explained']) {
      for (const width of [1280, 375]) {
        const { context, page } = await open(browser, 'light', width);
        await ready(page, route);
        await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' });
        await page.waitForTimeout(200);
        out.push({ route, width, ...(await overflowReport(page)), clipped: await clippedText(page) });
        await context.close();
      }
    }
    save('reflow', 'text-spacing', out);
  });
});

// ---------------------------------------------------------------------------------------------
// 5. Touch targets on a coarse pointer
// ---------------------------------------------------------------------------------------------
test.describe('touch', () => {
  test.describe.configure({ mode: 'parallel' });
  const PAGES = ['/', '/tools/json-formatter', '/tools/regex-tester', '/tools/image-compressor', '/tools/cron-builder', '/tools/csv-viewer', '/tools/jwt-decoder', '/tools/uuid-generator', '/tools/diff-checker', '/tools/markdown-editor', '/learn/javascript/what-is-javascript', '/learn/problems/arrays-hashing/contains-duplicate', '/blog'];
  for (const url of PAGES) {
    test(`touch ${url}`, async ({ browser }) => {
      const { context, page } = await open(browser, 'light', 375, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      await ready(page, url);
      const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
      const targets = await page.evaluate(() => {
        const sel = 'button, a[href], input:not([type=hidden]), select, summary, [role=button], [role=tab], [role=switch], [role=checkbox], label:has(input[type=checkbox]), label:has(input[type=radio])';
        const out: { el: string; w: number; h: number; inline: boolean; region: string }[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(sel)) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('.sr-only')) continue;
          if (el.matches('input[type=checkbox],input[type=radio]') && el.closest('label')) continue; // the label is the target
          const inline = el.tagName === 'A' && cs.display === 'inline' && !!el.closest('p,li');
          const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 30);
          const region = el.closest('footer') ? 'footer' : el.closest('main') ? 'main' : 'header';
          out.push({ el: `${el.tagName.toLowerCase()}${el.getAttribute('type') ? `[${el.getAttribute('type')}]` : ''} "${name}"`, w: Math.round(r.width), h: Math.round(r.height), inline, region });
        }
        return out;
      });
      const under44 = targets.filter((t) => !t.inline && (t.w < 44 || t.h < 44));
      const under24 = targets.filter((t) => !t.inline && (t.w < 24 || t.h < 24));
      save('touch', url, { url, coarse, total: targets.length, under44Count: under44.length, under24Count: under24.length, under44: under44.slice(0, 40), under24 });
      await context.close();
    });
  }
});

// ---------------------------------------------------------------------------------------------
// 6. Structure: titles, headings, landmarks, lang, live regions, images, iframes, motion, forms
// ---------------------------------------------------------------------------------------------
test.describe('structure', () => {
  test.describe.configure({ mode: 'parallel' });
  const chunks = 4;
  for (let c = 0; c < chunks; c++) {
    test(`structure chunk ${c}`, async ({ browser }) => {
      const routes = ROUTES.filter((_, i) => i % chunks === c);
      const { context, page } = await open(browser, 'light', 1280);
      const out = [];
      for (const route of routes) {
        await ready(page, route);
        const info = await page.evaluate(() => {
          const hs = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')].filter((h) => h.getClientRects().length > 0);
          const levels = hs.map((h) => Number(h.tagName[1]));
          const skips: string[] = [];
          levels.forEach((l, i) => {
            if (i > 0 && l > levels[i - 1] + 1) skips.push(`h${levels[i - 1]}→h${l} "${hs[i].innerText.trim().slice(0, 40)}"`);
          });
          const count = (s: string) => document.querySelectorAll(s).length;
          return {
            title: document.title,
            lang: document.documentElement.lang,
            h1: hs.filter((h) => h.tagName === 'H1').map((h) => h.innerText.trim().slice(0, 60)),
            firstHeading: levels[0],
            skips,
            landmarks: { header: count('body header:not(main header):not(section header):not(article header)'), nav: [...document.querySelectorAll('nav')].map((n) => n.getAttribute('aria-label') ?? '(unnamed)'), main: count('main'), footer: count('footer') },
            live: [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log]')].map((e) => `${e.tagName.toLowerCase()}[${e.getAttribute('role') ?? ''}/${e.getAttribute('aria-live') ?? ''}] "${(e as HTMLElement).innerText.trim().slice(0, 25)}"`),
            imgs: [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src')?.slice(0, 40), alt: i.getAttribute('alt') })).filter((i) => i.alt === null || i.alt === ''),
            svgsUnlabelled: [...document.querySelectorAll('svg')].filter((s) => s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('aria-label') && !s.querySelector('title') && s.getAttribute('role') !== 'img').length,
            iframes: [...document.querySelectorAll('iframe')].map((f) => f.getAttribute('title')),
            invalidFields: [...document.querySelectorAll('[aria-invalid="true"]')].map((f) => ({ id: f.id, describedby: f.getAttribute('aria-describedby'), errormessage: f.getAttribute('aria-errormessage') })),
            targetBlankNoWarn: [...document.querySelectorAll('a[target=_blank]')].filter((a) => !/new tab|opens|↗/i.test((a.getAttribute('aria-label') ?? '') + (a as HTMLElement).innerText + (a.querySelector('.sr-only')?.textContent ?? ''))).length,
            autoplayMedia: count('video[autoplay],audio[autoplay]'),
            animations: document.getAnimations().length,
          };
        });
        out.push({ route, ...info });
      }
      await context.close();

      // Reduced motion: which animations/transitions still run when the OS asks for less motion.
      const rm = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
      const p2 = await rm.newPage();
      const motion = [];
      for (const route of routes.slice(0, 6)) {
        await ready(p2, route);
        motion.push({
          route,
          ...(await p2.evaluate(() => {
            const els = [...document.querySelectorAll<HTMLElement>('*')];
            const anim = els.filter((e) => {
              const cs = getComputedStyle(e);
              return cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0.01;
            });
            const trans = els.filter((e) => {
              const cs = getComputedStyle(e);
              return parseFloat(cs.transitionDuration) > 0.01 && cs.transitionProperty !== 'none' && !/\b(color|background-color|border-color|outline-color|text-decoration-color|fill|stroke|opacity)\b/.test(cs.transitionProperty.replace(/,.*/, ''));
            });
            const smooth = getComputedStyle(document.documentElement).scrollBehavior;
            return {
              animations: anim.map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join('.')} ${getComputedStyle(e).animationName}`).slice(0, 5),
              transformTransitions: trans.map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 3).join('.')} ${getComputedStyle(e).transitionProperty.slice(0, 40)}`).slice(0, 5),
              transformTransitionCount: trans.length,
              scrollBehavior: smooth,
            };
          })),
        });
      }
      await rm.close();
      save('structure', `chunk-${c}`, { pages: out, motion });
    });
  }

  test('forms, errors, live regions, colour scheme', async ({ browser }) => {
    const out: Record<string, unknown> = {};
    const { context, page } = await open(browser, 'light', 1280);

    // JSON Formatter error state.
    await ready(page, '/tools/json-formatter');
    await page.getByLabel('Input JSON').fill('{\n  "a": 1,\n}');
    await page.waitForTimeout(500);
    out.jsonError = await page.getByLabel('Input JSON').evaluate((el) => ({
      invalid: el.getAttribute('aria-invalid'),
      describedby: el.getAttribute('aria-describedby'),
      describedText: (el.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim().slice(0, 80)),
      errorInLiveRegion: [...document.querySelectorAll('[role=alert],[aria-live],[role=status]')].map((e) => `${e.getAttribute('role') ?? e.getAttribute('aria-live')}: ${(e as HTMLElement).innerText.trim().slice(0, 60)}`),
    }));

    // Regex Tester invalid pattern.
    await ready(page, '/tools/regex-tester');
    const fields = await page.evaluate(() => [...document.querySelectorAll('main input, main textarea')].map((f) => ({ tag: f.tagName, id: f.id, label: (f as HTMLInputElement).labels?.[0]?.innerText ?? f.getAttribute('aria-label') ?? f.getAttribute('aria-labelledby'), placeholder: f.getAttribute('placeholder') })));
    const pattern = page.locator('main input[type=text], main input:not([type])').first();
    await pattern.fill('([a-z');
    await page.waitForTimeout(400);
    out.regexError = {
      fields,
      pattern: await pattern.evaluate((el) => ({ invalid: el.getAttribute('aria-invalid'), describedby: el.getAttribute('aria-describedby'), describedText: (el.getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent?.trim().slice(0, 80)) })),
      alerts: await page.evaluate(() => [...document.querySelectorAll('[role=alert],[aria-live],[role=status]')].map((e) => `${e.getAttribute('role') ?? e.getAttribute('aria-live')}: ${(e as HTMLElement).innerText.trim().slice(0, 60)}`)),
    };

    // Cron Builder invalid expression.
    await ready(page, '/tools/cron-builder');
    const cron = page.getByRole('textbox').first();
    await cron.fill('99 * * *');
    await page.waitForTimeout(400);
    out.cronError = {
      field: await cron.evaluate((el) => ({ label: (el as HTMLInputElement).labels?.[0]?.innerText ?? el.getAttribute('aria-label'), invalid: el.getAttribute('aria-invalid'), describedby: el.getAttribute('aria-describedby') })),
      alerts: await page.evaluate(() => [...document.querySelectorAll('[role=alert],[aria-live],[role=status]')].map((e) => `${e.getAttribute('role') ?? e.getAttribute('aria-live')}: ${(e as HTMLElement).innerText.trim().slice(0, 60)}`)),
    };

    // Accessible names/roles (what a screen reader gets) for key widgets.
    const snaps: Record<string, string> = {};
    await ready(page, '/');
    snaps.header = await page.locator('header').first().ariaSnapshot();
    snaps.homeMainTop = (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 30).join('\n');
    await ready(page, '/tools/json-formatter');
    snaps.jsonFormatterMain = (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 60).join('\n');
    await page.keyboard.press('Control+k');
    await page.getByRole('dialog', { name: 'Search Zykit' }).waitFor();
    await page.getByRole('dialog', { name: 'Search Zykit' }).getByRole('combobox').fill('json');
    await page.waitForTimeout(200);
    snaps.palette = (await page.getByRole('dialog', { name: 'Search Zykit' }).ariaSnapshot()).split('\n').slice(0, 25).join('\n');
    await page.keyboard.press('Escape');
    await ready(page, '/tools/image-compressor');
    snaps.imageCompressor = (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 40).join('\n');
    await ready(page, '/tools/cron-builder');
    snaps.cronBuilder = (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 50).join('\n');
    await ready(page, '/tools/csv-viewer');
    snaps.csvViewer = (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 40).join('\n');
    await ready(page, '/learn/javascript/what-is-javascript');
    snaps.topic = (await page.locator('main').ariaSnapshot()).split('\n').slice(0, 60).join('\n');
    out.snapshots = snaps;

    // Copy feedback announced?
    await ready(page, '/tools/uuid-generator');
    const copyBtn = page.getByRole('button', { name: /copy/i }).first();
    out.copyButton = (await copyBtn.count()) ? await copyBtn.evaluate((el) => ({ html: el.outerHTML.slice(0, 300) })) : null;

    await context.close();

    // prefers-color-scheme: dark with nothing stored.
    const osDark = await browser.newContext({ colorScheme: 'dark' });
    const p3 = await osDark.newPage();
    await ready(p3, '/');
    out.osDarkHonoured = await p3.evaluate(() => document.documentElement.classList.contains('dark'));
    await osDark.close();

    // Image tool previews: load an image and check alt text.
    const { context: c2, page: p4 } = await open(browser, 'light', 1280);
    await ready(p4, '/tools/image-compressor');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHUlEQVR4nGP8z8DAQApgIkn1qIZRDaMahpMGAHpEAR9ceQ9lAAAAAElFTkSuQmCC', 'base64');
    const inputFile = p4.locator('input[type=file]').first();
    if (await inputFile.count()) {
      await inputFile.setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
      await p4.waitForTimeout(2500);
      out.imagePreview = await p4.evaluate(() => ({
        imgs: [...document.querySelectorAll('main img')].map((i) => ({ alt: i.getAttribute('alt'), src: i.getAttribute('src')?.slice(0, 20) })),
        live: [...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map((e) => `${e.getAttribute('role') ?? e.getAttribute('aria-live')}: ${(e as HTMLElement).innerText.trim().slice(0, 60)}`),
        fileInput: (() => {
          const f = document.querySelector('input[type=file]') as HTMLInputElement;
          return { label: f.labels?.[0]?.innerText?.slice(0, 50) ?? f.getAttribute('aria-label'), hidden: getComputedStyle(f).display === 'none' || f.classList.contains('sr-only') || f.classList.contains('hidden') };
        })(),
      }));
      const a = await axe(p4);
      out.imagePreviewAxe = a.violations.map((v) => `${v.id} x${v.nodes.length}: ${v.nodes[0]?.target}`);
    }
    await c2.close();
    save('structure', 'forms', out);
  });
});

// ---------------------------------------------------------------------------------------------
// Merge every fragment into one JSON summary (the last worker to finish wins with the full set).
// ---------------------------------------------------------------------------------------------
test.afterAll(() => {
  if (!fs.existsSync(OUT)) return;
  const read = (kind: string) => {
    const dir = path.join(OUT, kind);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) : [];
  };
  type Scan = { route: string; theme: string; width: number; violations: { id: string; impact: string; help: string; tags: string[]; nodes: { target: string; data: unknown }[] }[] };
  const scans = read('axe').flat() as Scan[];
  const byRule: Record<string, { impact: string; help: string; tags: string[]; nodes: number; routes: Set<string>; combos: Set<string>; samples: Set<string>; data: unknown[] }> = {};
  for (const s of scans) {
    for (const v of s.violations) {
      const r = (byRule[v.id] ??= { impact: v.impact, help: v.help, tags: v.tags, nodes: 0, routes: new Set(), combos: new Set(), samples: new Set(), data: [] });
      r.nodes += v.nodes.length;
      r.routes.add(s.route);
      r.combos.add(`${s.theme}@${s.width}`);
      for (const n of v.nodes) {
        if (r.samples.size < 12) r.samples.add(n.target);
        if (r.data.length < 12 && n.data) r.data.push({ route: s.route, theme: s.theme, target: n.target, data: n.data });
      }
    }
  }
  const summary = {
    generated: new Date().toISOString(),
    scans: scans.length,
    routesScanned: [...new Set(scans.map((s) => s.route))].length,
    axeByRule: Object.fromEntries(
      Object.entries(byRule)
        .sort((a, b) => b[1].nodes - a[1].nodes)
        .map(([id, r]) => [id, { ...r, routes: [...r.routes], combos: [...r.combos], samples: [...r.samples] }]),
    ),
    keyboard: read('keyboard'),
    contrast: read('contrast').flat(),
    reflow: read('reflow').flat(),
    touch: read('touch'),
    structure: read('structure'),
  };
  fs.writeFileSync(`${SUMMARY}.tmp`, JSON.stringify(summary, null, 1));
  fs.renameSync(`${SUMMARY}.tmp`, SUMMARY);
});
