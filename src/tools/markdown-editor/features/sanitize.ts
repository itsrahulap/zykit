// DOMPurify wrapper for the preview. Every render goes through this before it touches the DOM.
// Browser-only (DOMPurify needs a DOM); the XSS checks run in the e2e spec.

import type { Config, DOMPurify } from 'dompurify';
import { ANCHOR_PREFIX, createMarkdownRenderer } from './markdown';

export const PURIFY_CONFIG: Config = {
  // HTML only: no SVG or MathML, which is where most mutation-XSS tricks live.
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'button', 'select', 'textarea', 'link', 'meta', 'base', 'template', 'noscript', 'svg', 'math'],
  // `style` would be blocked by the CSP anyway (and log errors); the rest can submit or restyle things.
  FORBID_ATTR: ['style', 'srcset', 'action', 'formaction', 'background', 'ping'],
  ALLOW_DATA_ATTR: false,
};

const SAFE_IMAGE = /^(?:data:image\/[a-z0-9.+-]+[;,]|blob:)/i;
const BAD_URL = /^\s*(?:javascript|vbscript|data|file):/i;

export interface Sanitized {
  html: string;
  /** Images removed because their source isn't a data: or blob: URL (the CSP would block them). */
  blockedImages: number;
}

export type Sanitize = (html: string) => Sanitized;

/** `purify` is a DOMPurify instance of its own (hooks are per instance). */
export function createSanitizer(purify: DOMPurify): Sanitize {
  let blocked = 0;
  purify.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element;
    const tag = el.tagName;
    if (tag === 'A') {
      const href = el.getAttribute('href');
      if (href === null) return;
      if (BAD_URL.test(href)) el.removeAttribute('href');
      else if (href.startsWith('#')) {
        if (!href.startsWith(`#${ANCHOR_PREFIX}`) && href.length > 1) el.setAttribute('href', `#${ANCHOR_PREFIX}${href.slice(1)}`);
        el.removeAttribute('target');
      } else {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    } else if (tag === 'IMG') {
      const src = el.getAttribute('src') ?? '';
      if (!SAFE_IMAGE.test(src)) {
        if (src) blocked++;
        el.removeAttribute('src');
        el.setAttribute('class', 'md-blocked-image');
        el.setAttribute('title', src ? `Remote image not loaded: ${src}` : 'Image');
      }
    } else if (tag === 'INPUT') {
      // Only GFM task-list checkboxes, and read-only.
      el.setAttribute('type', 'checkbox');
      el.setAttribute('disabled', '');
    }
    if (el.hasAttribute('id') && !el.getAttribute('id')!.startsWith(ANCHOR_PREFIX)) el.setAttribute('id', ANCHOR_PREFIX + el.getAttribute('id'));
  });
  return (html: string) => {
    blocked = 0;
    const out = purify.sanitize(html, { ...PURIFY_CONFIG, RETURN_TRUSTED_TYPE: false }) as string;
    return { html: out, blockedImages: blocked };
  };
}

export interface Renderer {
  render: (markdown: string) => Sanitized;
}

/** Loads marked and DOMPurify on demand (each is its own chunk) and returns a sanitizing renderer. */
export async function loadRenderer(): Promise<Renderer> {
  const [marked, purifyModule] = await Promise.all([import('marked'), import('dompurify')]);
  const toHtml = createMarkdownRenderer(marked);
  const sanitize = createSanitizer(purifyModule.default(window));
  return { render: (md) => sanitize(toHtml(md)) };
}
