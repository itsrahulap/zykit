// Every blog post and series. To add a post, create it under posts/ and add it to POSTS.
// Routes, the blog home, series navigation, the sitemap and static SEO pages all derive from this list.

import { claudeCodePosts, claudeCodeSeries } from './posts/claude-code-plugins';
import type { BlogPost, BlogSeries, PostBlock } from './types';

export const BLOG_PATH = '/blog';

export const SERIES: BlogSeries[] = [claudeCodeSeries];

/** In publishing order; within a series this is also reading order. */
export const POSTS: BlogPost[] = [...claudeCodePosts];

export const postPath = (p: Pick<BlogPost, 'slug'>) => `${BLOG_PATH}/${p.slug}`;
export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
export const getSeries = (id: string | undefined) => SERIES.find((s) => s.id === id);
export const seriesPosts = (id: string) => POSTS.filter((p) => p.series === id);

/** Newest first; posts published the same day keep registry order. */
export const postsByDate = () => [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

const blockText = (b: PostBlock): string => {
  switch (b.type) {
    case 'text':
    case 'callout':
      return b.text;
    case 'code':
      return b.code;
    case 'commands':
      return b.chat.join(' ');
    case 'prompts':
      return b.items.join(' ');
    case 'cards':
    case 'steps':
      return b.items.map((i) => `${i.title} ${i.text}`).join(' ');
    case 'posts':
      return '';
  }
};

/** Estimated reading time at 220 words a minute, at least 1. */
export function readingMinutes(p: BlogPost): number {
  const text = [p.intro, ...p.sections.flatMap((s) => [s.heading, ...s.blocks.map(blockText)])].join(' ');
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
