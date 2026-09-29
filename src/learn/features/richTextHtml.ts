// Renders lesson markup to static HTML for the build-time SEO pages (scripts/seo-plugin.ts).
// Every piece of text is escaped; the only tags produced are p, ul, li, strong, em and code.

import { parseBlocks, type Inline } from './richText';

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inline = (parts: Inline[]) =>
  parts
    .map((p) => {
      const t = escapeHtml(p.text);
      return p.kind === 'bold' ? `<strong>${t}</strong>` : p.kind === 'italic' ? `<em>${t}</em>` : p.kind === 'code' ? `<code>${t}</code>` : t;
    })
    .join('');

export function richTextToHtml(text: string): string {
  return parseBlocks(text)
    .map((b) => (b.kind === 'list' ? `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>` : `<p>${inline(b.inlines)}</p>`))
    .join('');
}

/** Plain text with markup removed, for meta descriptions. */
export function plainText(text: string, max = 160): string {
  const words = (parts: Inline[]) => parts.map((p) => p.text).join('');
  const flat = parseBlocks(text)
    .flatMap((b) => (b.kind === 'list' ? b.items.map(words) : [words(b.inlines)]))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
