// Static HTML for blog pages, written at build time by scripts/seo-plugin.ts so crawlers and link previews
// get the full post text. Every piece of text is escaped; React replaces #root when it mounts.

import { escapeHtml as esc, richTextToHtml } from '../learn/features/richTextHtml';
import { BLOG_PATH, POSTS, formatDate, getPost, getSeries, postPath, postsByDate, seriesPosts } from './registry';
import type { BlogPost, PostBlock } from './types';

const main = (inner: string) => `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">${inner}</main>`;
const postLink = (p: BlogPost) => `<a href="${esc(postPath(p))}">${esc(p.title)}</a>`;
const inline = (text: string) => richTextToHtml(text).replace(/^<p>|<\/p>$/g, '');

function blockHtml(b: PostBlock): string {
  switch (b.type) {
    case 'text':
      return richTextToHtml(b.text);
    case 'code':
      return `<figure>${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}<pre><code>${esc(b.code)}</code></pre></figure>`;
    case 'commands':
      return `<pre><code>${esc(b.chat.join('\n'))}</code></pre><pre><code>${esc(b.shell.join('\n'))}</code></pre>`;
    case 'prompts':
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
    case 'callout':
      return `<aside>${b.title ? `<strong>${esc(b.title)}</strong> ` : ''}${inline(b.text)}</aside>`;
    case 'cards':
      return `<ul>${b.items.map((i) => `<li><strong>${esc(i.title)}</strong>: ${inline(i.text)}</li>`).join('')}</ul>`;
    case 'steps':
      return `<ol>${b.items.map((i) => `<li><strong>${esc(i.title)}</strong>: ${inline(i.text)}</li>`).join('')}</ol>`;
    case 'posts':
      return `<ul>${b.slugs.map(getPost).filter((p) => p !== undefined).map((p) => `<li>${postLink(p)}</li>`).join('')}</ul>`;
  }
}

export function blogHomeHtml(title: string, description: string): string {
  const list = postsByDate().map((p) => `<li>${postLink(p)} (${esc(formatDate(p.date))}): ${esc(p.summary)}</li>`);
  return main(`<h1>${esc(title)}</h1><p>${esc(description)}</p><ul>${list.join('')}</ul>`);
}

export function postHtml(p: BlogPost): string {
  const series = getSeries(p.series);
  const seriesNav = series ? `<nav aria-label="Series"><p>${esc(series.title)}</p><ol>${seriesPosts(series.id).map((s) => `<li>${postLink(s)}</li>`).join('')}</ol></nav>` : '';
  const sections = p.sections.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.blocks.map(blockHtml).join('')}</section>`).join('');
  return main(
    `<nav aria-label="Breadcrumb"><a href="${BLOG_PATH}">Blog</a></nav><article><h1>${esc(p.title)}</h1>` +
      `<p><time datetime="${esc(p.date)}">${esc(formatDate(p.date))}</time></p>${richTextToHtml(p.intro)}${sections}</article>${seriesNav}`,
  );
}

/** Every blog page for the build step: output file, URL path, meta source and body. */
export const blogPages = () => [
  { file: 'blog.html', path: BLOG_PATH, post: undefined },
  ...POSTS.map((p) => ({ file: `${postPath(p).slice(1)}.html`, path: postPath(p), post: p })),
];
