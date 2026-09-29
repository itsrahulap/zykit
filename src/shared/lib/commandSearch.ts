// Pure ranking for the site-wide command palette: tools (registry), blog posts and actions.
// Learn results come from searchLearn (src/learn/features/search.ts). No DOM, unit-tested.

import type { IconName } from '../ui/ui';
import { filterTools, queryTerms, scoreTool } from '../utils/toolSearch';

export type PaletteGroup = 'Recent' | 'Tools' | 'Learn' | 'Blog' | 'Actions';
/** Display order of the groups: tools first. */
export const GROUP_ORDER: PaletteGroup[] = ['Recent', 'Tools', 'Learn', 'Blog', 'Actions'];

export interface PaletteItem {
  key: string;
  group: PaletteGroup;
  title: string;
  /** Small label above the title, e.g. "Topic · JavaScript". */
  label: string;
  description: string;
  icon: IconName;
  /** Where Enter goes; items without one run `action`. */
  to?: string;
  action?: 'toggle-theme';
}

export interface PaletteTool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  icon: IconName;
  status: string;
}
export interface PalettePost {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
}

export const TOOL_LIMIT = 8;
export const BLOG_LIMIT = 5;

export const toolItem = (t: PaletteTool, group: PaletteGroup = 'Tools'): PaletteItem => ({
  key: `tool:${t.id}`,
  group,
  title: t.name,
  label: `Tool · ${t.category}`,
  description: t.tagline,
  icon: t.icon,
  to: `/tools/${t.id}`,
});

/** Tools matching every query word, best first; empty query gives nothing. */
export function searchToolItems(tools: readonly PaletteTool[], query: string, limit = TOOL_LIMIT): PaletteItem[] {
  if (!queryTerms(query).length) return [];
  return filterTools(
    tools.filter((t) => t.status !== 'coming-soon'),
    { query },
  )
    .slice(0, limit)
    .map((t) => toolItem(t));
}

export function searchPostItems(posts: readonly PalettePost[], query: string, limit = BLOG_LIMIT): PaletteItem[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  return posts
    .map((p, i) => ({ p, i, score: scoreTool({ id: p.slug, name: p.title, tagline: p.summary, description: '', category: 'blog', tags: p.tags }, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map(({ p }) => ({ key: `post:${p.slug}`, group: 'Blog', title: p.title, label: 'Blog post', description: p.summary, icon: 'file', to: `/blog/${p.slug}` }));
}

export interface PaletteAction {
  item: PaletteItem;
  keywords: string[];
}

export function paletteActions(theme: 'light' | 'dark'): PaletteAction[] {
  const next = theme === 'dark' ? 'light' : 'dark';
  const go = (key: string, title: string, to: string, icon: IconName, keywords: string[]): PaletteAction => ({
    item: { key: `action:${key}`, group: 'Actions', title, label: 'Go to', description: '', icon, to },
    keywords,
  });
  return [
    {
      item: { key: 'action:theme', group: 'Actions', title: `Switch to ${next} mode`, label: 'Action', description: '', icon: next === 'dark' ? 'moon' : 'sun', action: 'toggle-theme' },
      keywords: ['theme', 'dark', 'light', 'mode', 'toggle', 'appearance'],
    },
    go('home', 'All tools', '/', 'grid', ['home', 'tools', 'directory', 'all']),
    go('learn', 'Learn', '/learn', 'book', ['learn', 'lessons', 'courses', 'topics']),
    go('blog', 'Blog', '/blog', 'file', ['blog', 'posts', 'articles']),
  ];
}

/** Actions whose title or keywords contain every query word (all of them for an empty query). */
export function searchActionItems(actions: readonly PaletteAction[], query: string): PaletteItem[] {
  const terms = queryTerms(query);
  return actions
    .filter(({ item, keywords }) => {
      const hay = `${item.title} ${keywords.join(' ')}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    })
    .map((a) => a.item);
}

/** Flattens items into display order (grouped, tools first), keeping order within a group. */
export function orderItems(items: readonly PaletteItem[]): PaletteItem[] {
  return GROUP_ORDER.flatMap((g) => items.filter((i) => i.group === g));
}
