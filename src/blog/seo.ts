// Titles, descriptions and JSON-LD for blog pages, shared by the pages (useDocumentMeta) and the build step
// that writes a static HTML file per page (scripts/seo-plugin.ts). Titles exclude the " · Zykit" suffix.

import { SITE } from '../config/site';
import { POSTS, SERIES, postPath } from './registry';
import type { BlogPost } from './types';

export const blogHomeMeta = () => ({
  title: 'Blog: guides for developers',
  description: `Practical guides for developers, starting with ${SERIES.map((s) => s.title).join(', ')}. ${POSTS.length} posts.`,
});

export const postMeta = (p: BlogPost) => ({ title: p.title, description: p.summary });

export function postStructuredData(p: BlogPost) {
  const url = `${SITE.url}${postPath(p)}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.summary,
    url,
    mainEntityOfPage: url,
    datePublished: p.date,
    dateModified: p.date,
    keywords: p.tags.join(', '),
    author: { '@type': 'Organization', name: SITE.name, url: `${SITE.url}/` },
    publisher: { '@type': 'Organization', name: SITE.name, url: `${SITE.url}/` },
  };
}

export function blogStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE.name} blog`,
    url: `${SITE.url}/blog`,
    blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE.url}${postPath(p)}`, datePublished: p.date })),
  };
}
