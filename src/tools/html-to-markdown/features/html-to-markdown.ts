// Pure HTML to Markdown over a minimal node interface (a DOMParser document satisfies it), so it runs in Node.

export interface HNode {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: ArrayLike<HNode>;
  getAttribute?(name: string): string | null;
}

export interface H2mOptions {
  heading: 'atx' | 'setext';
  bullet: '-' | '*' | '+';
  fence: '```' | '~~~' | 'indent';
}

export const DEFAULT_OPTIONS: H2mOptions = { heading: 'atx', bullet: '-', fence: '```' };

const BLOCK = new Set(
  'p div h1 h2 h3 h4 h5 h6 ul ol li blockquote pre table hr section article header footer nav main aside figure figcaption details summary dl dt dd form fieldset address body html'.split(' '),
);
const SKIP = new Set(['script', 'style', 'head', 'template', 'noscript', 'title', 'meta', 'link']);
const BR = '\uE000'; // private-use marker for <br> until the paragraph is tidied
const kids = (n: HNode) => Array.from(n.childNodes);
const tag = (n: HNode) => (n.nodeType === 1 ? n.nodeName.toLowerCase() : '');
const attr = (n: HNode, a: string) => n.getAttribute?.(a) ?? '';
const isList = (s: string) => /^\s*([-*+]|\d+\.) /.test(s);

function escapeText(s: string): string {
  return s.replace(/[ \t\r\n\f]+/g, ' ').replace(/([\\`*_[\]<>])/g, '\\$1');
}

function wrap(inner: string, mark: string): string {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)!;
  return m[2] ? m[1] + mark + m[2] + mark + m[3] : inner;
}

function codeSpan(text: string): string {
  const t = text.replace(/\n/g, ' ');
  const longest = Math.max(0, ...(t.match(/`+/g) ?? []).map((r) => r.length));
  const f = '`'.repeat(longest + 1);
  return f + (t.startsWith('`') || t.endsWith('`') ? ` ${t} ` : t) + f;
}

const safeUrl = (u: string) => (/^\s*(javascript|vbscript):/i.test(u) ? '' : u.trim().replace(/ /g, '%20').replace(/[()]/g, '\\$&'));

function inline(n: HNode): string {
  if (n.nodeType === 3) return escapeText(n.textContent ?? '');
  const t = tag(n);
  if (!t || SKIP.has(t)) return '';
  const inner = () => kids(n).map(inline).join('');
  switch (t) {
    case 'br':
      return BR;
    case 'em':
    case 'i':
      return wrap(inner(), '*');
    case 'strong':
    case 'b':
      return wrap(inner(), '**');
    case 'del':
    case 's':
    case 'strike':
      return wrap(inner(), '~~');
    case 'code':
    case 'kbd':
    case 'samp':
      return codeSpan(n.textContent ?? '');
    case 'a': {
      const href = safeUrl(attr(n, 'href'));
      const text = inner();
      if (!href) return text;
      const title = attr(n, 'title');
      return `[${text.trim() || href}](${href}${title ? ` "${title.replace(/"/g, '\\"')}"` : ''})`;
    }
    case 'img': {
      const src = safeUrl(attr(n, 'src'));
      return src ? `![${attr(n, 'alt').replace(/[[\]]/g, '\\$&')}](${src})` : '';
    }
    case 'input':
      return attr(n, 'type') === 'checkbox' ? (n.getAttribute?.('checked') !== null ? '[x] ' : '[ ] ') : '';
    default:
      return inner();
  }
}

function tidy(run: string): string {
  const t = run
    .replace(/ *\uE000 */g, '  \n')
    .replace(/ +\n/g, (m) => (m.length >= 3 ? '  \n' : '\n'))
    .trim();
  // Keep text that merely looks like block syntax from becoming it.
  return t.replace(/^( *)(#{1,6} |[-+] |\d+[.)] )/gm, (_, sp: string, m: string) => sp + (/^\d/.test(m) ? m.replace(/[.)]/, '\\$&') : '\\' + m));
}

function blocks(nodes: HNode[], o: H2mOptions): string[] {
  const out: string[] = [];
  let run = '';
  const flush = () => {
    const t = tidy(run);
    if (t) out.push(t);
    run = '';
  };
  for (const n of nodes) {
    if (BLOCK.has(tag(n))) {
      flush();
      out.push(...block(n, o));
    } else run += inline(n);
  }
  flush();
  return out;
}

function inlineLine(n: HNode): string {
  return kids(n).map(inline).join('').replace(new RegExp(BR, 'g'), ' ').replace(/\s+/g, ' ').trim();
}

function list(n: HNode, o: H2mOptions): string {
  const ordered = tag(n) === 'ol';
  let num = ordered ? parseInt(attr(n, 'start'), 10) || 1 : 0;
  return kids(n)
    .filter((c) => tag(c) === 'li')
    .map((li) => {
      const marker = ordered ? `${num++}. ` : `${o.bullet} `;
      const parts = blocks(kids(li), o);
      const body = parts.reduce((acc, p, i) => (i ? acc + (isList(p) ? '\n' : '\n\n') + p : p), '');
      return marker + body.replace(/\n(?=.)/g, '\n' + ' '.repeat(marker.length));
    })
    .join('\n');
}

function table(n: HNode, o: H2mOptions): string {
  const rows: { cells: HNode[] }[] = [];
  const walk = (p: HNode) =>
    kids(p).forEach((c) => {
      if (tag(c) === 'tr') rows.push({ cells: kids(c).filter((x) => tag(x) === 'td' || tag(x) === 'th') });
      else if (tag(c) && !SKIP.has(tag(c))) walk(c);
    });
  walk(n);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.cells.reduce((a, c) => a + (parseInt(attr(c, 'colspan'), 10) || 1), 0)));
  const align: string[] = [];
  const text = rows.map((r) => {
    const line: string[] = [];
    for (const c of r.cells) {
      const a = (attr(c, 'align') || /text-align:\s*(\w+)/.exec(attr(c, 'style'))?.[1] || '').toLowerCase();
      if (!align[line.length] && (a === 'left' || a === 'right' || a === 'center')) align[line.length] = a;
      const cell = blocks(kids(c), o).join(' ').replace(/\n/g, '<br>').replace(/ {2}<br>/g, '<br>').replace(/\|/g, '\\|');
      line.push(cell);
      for (let i = (parseInt(attr(c, 'colspan'), 10) || 1) - 1; i > 0; i--) line.push('');
    }
    while (line.length < width) line.push('');
    return `| ${line.join(' | ')} |`;
  });
  const sep = Array.from({ length: width }, (_, i) => ({ left: ':---', right: '---:', center: ':---:' })[align[i] as 'left'] ?? '---');
  return [text[0], `| ${sep.join(' | ')} |`, ...text.slice(1)].join('\n');
}

function pre(n: HNode, o: H2mOptions): string {
  const code = kids(n).find((c) => tag(c) === 'code');
  const cls = `${attr(code ?? n, 'class')} ${attr(n, 'class')}`;
  const lang = /(?:language|lang)-([\w+#.-]+)/.exec(cls)?.[1] ?? '';
  const text = (n.textContent ?? '').replace(/\r\n?/g, '\n').replace(/\n$/, '');
  if (o.fence === 'indent') return text.replace(/^/gm, '    ');
  const ch = o.fence[0];
  const longest = Math.max(0, ...(text.match(new RegExp(`${ch === '`' ? '`' : '~'}{3,}`, 'g')) ?? []).map((r) => r.length));
  const f = ch.repeat(Math.max(3, longest + 1));
  return `${f}${lang}\n${text}\n${f}`;
}

function block(n: HNode, o: H2mOptions): string[] {
  const t = tag(n);
  if (SKIP.has(t)) return [];
  if (/^h[1-6]$/.test(t)) {
    const level = +t[1];
    const text = inlineLine(n);
    if (!text) return [];
    return [o.heading === 'setext' && level < 3 ? `${text}\n${(level === 1 ? '=' : '-').repeat(Math.max(3, text.length))}` : `${'#'.repeat(level)} ${text}`];
  }
  switch (t) {
    case 'hr':
      return ['---'];
    case 'pre':
      return [pre(n, o)];
    case 'ul':
    case 'ol':
      return [list(n, o)].filter(Boolean);
    case 'table':
      return [table(n, o)].filter(Boolean);
    case 'blockquote': {
      const body = blocks(kids(n), o).join('\n\n');
      return body ? [body.replace(/^/gm, '> ').replace(/^> $/gm, '>')] : [];
    }
    default:
      return blocks(kids(n), o);
  }
}

/** Convert a DOM document, element or fragment to Markdown. */
export function htmlToMarkdown(root: HNode, options: Partial<H2mOptions> = {}): string {
  const o = { ...DEFAULT_OPTIONS, ...options };
  let start = root;
  const find = (n: HNode): HNode | null => (tag(n) === 'body' ? n : kids(n).reduce<HNode | null>((a, c) => a ?? find(c), null));
  if (root.nodeType === 9) start = find(root) ?? root;
  const out = blocks(tag(start) === 'body' || root.nodeType !== 1 || !BLOCK.has(tag(start)) ? kids(start) : [start], o).join('\n\n');
  return out ? out + '\n' : '';
}
