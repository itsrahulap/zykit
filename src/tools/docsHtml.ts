// A tool's docs as static HTML for its build-time SEO page (scripts/seo-plugin.ts), matching what
// ToolDocsSection renders. Every piece of text is escaped by the Learn rich-text renderer.

import { escapeHtml as esc, richTextToHtml } from '../learn/features/richTextHtml';
import type { ToolDocs } from './types';

const inline = (text: string) => richTextToHtml(text).replace(/^<p>|<\/p>$/g, '');

export function toolDocsHtml(name: string, docs: ToolDocs): string {
  return (
    `<section><h2>How to use ${esc(name)}</h2><ol>${docs.howToUse.map((s) => `<li>${inline(s)}</li>`).join('')}</ol></section>` +
    `<section><h2>How it works</h2>${richTextToHtml(docs.howItWorks)}</section>` +
    `<section><h2>Limits</h2><ul>${docs.limits.map((l) => `<li>${inline(l)}</li>`).join('')}</ul></section>` +
    `<section><h2>Privacy</h2><p>${inline(docs.privacy)}</p></section>` +
    `<section><h2>Frequently asked questions</h2>${docs.faqs.map((f) => `<h3>${inline(f.question)}</h3><p>${inline(f.answer)}</p>`).join('')}</section>`
  );
}

/** Text with the light markup removed, for JSON-LD. */
export const plain = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\*([^*\s][^*]*)\*/g, '$1');
