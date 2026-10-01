// Every tool ships user docs (src/tools/<id>/docs.ts, loaded via `docs` in its index.ts) and a
// developer README (src/tools/<id>/README.md). Adding a tool without them fails here.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TOOLS } from '../../src/tools/registry';

const README_SECTIONS = ['## Purpose', '## File Structure', '## Core Logic', '## Limits', '## Tests', '## Known Gaps'];
const toolDir = (id: string) => join(__dirname, '../../src/tools', id);
const filled = (s: unknown) => typeof s === 'string' && s.trim().length > 0;

describe.each(TOOLS.filter((t) => t.status !== 'coming-soon').map((t) => [t.id, t] as const))('%s', (_id, tool) => {
  it('has user docs with every required section', async () => {
    expect(tool.docs, `add "docs: () => import('./docs')" to src/tools/${tool.id}/index.ts`).toBeTypeOf('function');
    const docs = (await tool.docs!()).default;

    expect(docs.howToUse.length, 'howToUse needs 3–5 steps').toBeGreaterThanOrEqual(3);
    expect(docs.howToUse.length, 'howToUse needs 3–5 steps').toBeLessThanOrEqual(5);
    expect(docs.howToUse.every(filled)).toBe(true);
    expect(docs.howItWorks.trim().length, 'howItWorks should explain the mechanism').toBeGreaterThan(80);
    expect(docs.limits.length).toBeGreaterThan(0);
    expect(docs.limits.every(filled)).toBe(true);
    expect(filled(docs.privacy)).toBe(true);
    expect(JSON.stringify(docs), 'docs.ts still has TODO placeholders').not.toMatch(/\bTODO\b/);
  });

  it('has at least 3 well-formed, unique FAQs', async () => {
    const { faqs } = (await tool.docs!()).default;
    expect(faqs.length).toBeGreaterThanOrEqual(3);
    for (const f of faqs) {
      expect(filled(f.question) && f.question.trim().endsWith('?'), `"${f.question}" should be a question`).toBe(true);
      expect(filled(f.answer), `"${f.question}" needs an answer`).toBe(true);
    }
    expect(new Set(faqs.map((f) => f.question.trim().toLowerCase())).size, 'duplicate FAQ question').toBe(faqs.length);
  });

  it('has a developer README with the standard sections', () => {
    const path = join(toolDir(tool.id), 'README.md');
    expect(existsSync(path), `create src/tools/${tool.id}/README.md`).toBe(true);
    const readme = readFileSync(path, 'utf8');
    for (const section of README_SECTIONS) expect(readme, `README is missing "${section}"`).toContain(section);
    expect(readme, 'README still has TODO placeholders').not.toMatch(/\bTODO\b/);
  });
});
