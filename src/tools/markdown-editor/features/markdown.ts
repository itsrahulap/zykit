// Markdown → HTML with GitHub-flavoured extensions (tables, task lists, strikethrough, autolinks) and
// heading anchors. The HTML is NOT safe until it has been through sanitize.ts.

import type { Marked as MarkedClass, Tokens } from 'marked';

/** Anchors get this prefix so a heading can't take over an id the page itself uses (DOM clobbering). */
export const ANCHOR_PREFIX = 'md-';

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

export function slugify(html: string): string {
  const text = html.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s+/g, '-') || 'section'
  );
}

/**
 * Drops inline `style` attributes and `<style>` elements from raw HTML before DOMPurify parses it. DOMPurify
 * removes them anyway (and is the real safety net), but its parse happens in a document that inherits this
 * site's CSP, so they would otherwise log CSP violations.
 */
export function stripInlineStyles(html: string): string {
  return html.replace(/<style\b[\s\S]*?(?:<\/style\s*>|$)/gi, '').replace(/([\s/"'])style(\s*=)/gi, '$1data-style$2');
}

export type RenderMarkdown = (src: string) => string;

/** Builds a renderer from the `marked` module (passed in so the page can load it lazily). */
export function createMarkdownRenderer(marked: { Marked: typeof MarkedClass }): RenderMarkdown {
  const seen = new Map<string, number>();
  const md = new marked.Marked({ gfm: true, breaks: false, async: false });
  md.use({
    renderer: {
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return stripInlineStyles(text);
      },
      heading(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, { tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const base = slugify(inner);
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = ANCHOR_PREFIX + (n ? `${base}-${n}` : base);
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
    },
  });
  return (src: string) => {
    seen.clear();
    return md.parse(src) as string;
  };
}

/** Words (letters/digits, with inner apostrophes or hyphens) and characters (code points). */
export function countText(src: string): { words: number; chars: number } {
  const words = src.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  let chars = 0;
  for (const _ of src) chars++;
  return { words, chars };
}

/** First heading's text, for the exported file's <title>. */
export function documentTitle(src: string): string {
  const m = /^ {0,3}#{1,6}[ \t]+(.+?)[ \t#]*$/m.exec(src);
  return m ? m[1].replace(/[*_`[\]]/g, '').trim() : 'Document';
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const EXPORT_CSS = `body{margin:0;background:#fff;color:#1e293b;font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
article{max-width:46rem;margin:0 auto;padding:2rem 1rem}
h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.6em 0 .6em}h1{font-size:2em}h2{font-size:1.5em;border-bottom:1px solid #e2e8f0;padding-bottom:.3em}
a{color:#047857}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;background:#f1f5f9;padding:.1em .35em;border-radius:4px}
pre{background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto}pre code{background:none;padding:0}
blockquote{margin:1em 0;padding:0 1em;border-left:4px solid #cbd5e1;color:#475569}
table{border-collapse:collapse;display:block;overflow:auto}th,td{border:1px solid #cbd5e1;padding:.4em .75em}th{background:#f8fafc}
img{max-width:100%}hr{border:0;border-top:1px solid #e2e8f0}li>input[type=checkbox]{margin-right:.4em}
@media (prefers-color-scheme:dark){body{background:#0f172a;color:#e2e8f0}code,pre{background:#1e293b}th{background:#1e293b}a{color:#34d399}blockquote{color:#94a3b8}}`;

/** A standalone HTML document around already-sanitized HTML. */
export function standaloneHtml(title: string, sanitizedBody: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
<article>
${sanitizedBody}
</article>
</body>
</html>
`;
}
