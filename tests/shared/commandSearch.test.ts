import { describe, expect, it } from 'vitest';
import {
  orderItems,
  paletteActions,
  searchActionItems,
  searchPostItems,
  searchToolItems,
  toolItem,
  type PaletteItem,
  type PaletteTool,
} from '../../src/shared/lib/commandSearch';

const tool = (id: string, name: string, extra: Partial<PaletteTool> = {}): PaletteTool => ({
  id,
  name,
  tagline: `${name} tagline`,
  description: '',
  category: 'Developer',
  tags: [],
  icon: 'code',
  status: 'available',
  ...extra,
});

describe('command palette search', () => {
  const tools = [tool('json-formatter', 'JSON Formatter'), tool('jwt-decoder', 'JWT Decoder', { tags: ['json', 'token'] }), tool('soon', 'JSON Soon', { status: 'coming-soon' })];

  it('ranks tools by name first, skips coming-soon ones and returns nothing for an empty query', () => {
    const hits = searchToolItems(tools, 'json');
    expect(hits.map((h) => h.key)).toEqual(['tool:json-formatter', 'tool:jwt-decoder']);
    expect(hits[0]).toMatchObject({ group: 'Tools', to: '/tools/json-formatter', label: 'Tool · Developer' });
    expect(searchToolItems(tools, '   ')).toEqual([]);
    expect(searchToolItems(tools, 'json', 1)).toHaveLength(1);
  });

  it('searches blog posts by title, summary and tags', () => {
    const posts = [
      { slug: 'a', title: 'Claude Code plugins', summary: 'Extend your agent', tags: ['ai'] },
      { slug: 'b', title: 'Other', summary: 'Mentions plugins in passing', tags: [] },
    ];
    expect(searchPostItems(posts, 'plugins').map((p) => p.to)).toEqual(['/blog/a', '/blog/b']);
    expect(searchPostItems(posts, 'ai')[0].key).toBe('post:a');
    expect(searchPostItems(posts, 'nothing-here')).toEqual([]);
  });

  it('matches actions by keyword and offers the opposite theme', () => {
    const actions = paletteActions('light');
    expect(searchActionItems(actions, 'dark')[0]).toMatchObject({ title: 'Switch to dark mode', action: 'toggle-theme' });
    expect(searchActionItems(paletteActions('dark'), 'theme')[0].title).toBe('Switch to light mode');
    expect(searchActionItems(actions, 'learn').map((a) => a.to)).toEqual(['/learn']);
    expect(searchActionItems(actions, '')).toHaveLength(actions.length);
  });

  it('orders groups with tools first', () => {
    const item = (group: PaletteItem['group'], key: string): PaletteItem => ({ key, group, title: key, label: '', description: '', icon: 'code' });
    const ordered = orderItems([item('Actions', 'x'), item('Blog', 'b'), item('Learn', 'l1'), item('Tools', 't'), item('Learn', 'l2'), item('Recent', 'r')]);
    expect(ordered.map((i) => i.key)).toEqual(['r', 't', 'l1', 'l2', 'b', 'x']);
    expect(toolItem(tools[0], 'Recent').group).toBe('Recent');
  });
});
