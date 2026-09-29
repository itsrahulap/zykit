import { describe, expect, it } from 'vitest';
import { TOOLS } from '../../../src/tools/registry';
import { RELATED_TOOLS, relatedTools } from '../../../src/tools/related';
import type { ToolDefinition } from '../../../src/tools/types';

const ids = new Set(TOOLS.map((t) => t.id));

describe('related tools', () => {
  it('only points at tools in the registry, never at themselves', () => {
    for (const [id, related] of Object.entries(RELATED_TOOLS)) {
      expect(ids.has(id), `${id} is not a registered tool`).toBe(true);
      for (const r of related) expect(ids.has(r), `${id} → ${r} is not a registered tool`).toBe(true);
      expect(related).not.toContain(id);
      expect(new Set(related).size).toBe(related.length);
      expect(related.length).toBeGreaterThanOrEqual(3);
      expect(related.length).toBeLessThanOrEqual(5);
    }
  });

  it('gives every registered tool suggestions (3–5 for curated ones)', () => {
    for (const t of TOOLS.filter((t) => t.status !== 'coming-soon')) {
      const related = relatedTools(t.id);
      const peers = TOOLS.some((o) => o.id !== t.id && o.category === t.category);
      expect(related.length, t.id).toBeGreaterThanOrEqual(t.id in RELATED_TOOLS ? 3 : peers ? 1 : 0);
      expect(related.length, t.id).toBeLessThanOrEqual(5);
      expect(related.map((r) => r.id)).not.toContain(t.id);
    }
  });

  it('falls back to same-category tools for ids missing from the map', () => {
    const make = (id: string, category: string): ToolDefinition => ({
      id,
      name: id,
      tagline: '',
      description: '',
      category,
      icon: 'code',
      tags: [],
      status: 'available',
      load: async () => ({ default: () => null }),
    });
    const tools = [make('new', 'Images'), make('a', 'Images'), make('b', 'Text'), make('c', 'Images')];
    expect(relatedTools('new', tools, {}).map((t) => t.id)).toEqual(['a', 'c']);
    expect(relatedTools('new', tools, { new: ['b'] }).map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });
});
