// Conservative CSS and HTML minifiers and beautifiers. No parser libraries: a small scanner
// that treats strings, comments, url(...) and raw-text elements as opaque so their content
// is never touched. Anything unsure is left alone (e.g. no unit, colour or selector rewriting).

const WS = /[ \t\r\n\f]/;

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

interface Literal {
  end: number;
  kind: 'string' | 'comment' | 'url';
}

/** Finds a string, comment or unquoted url(...) starting at `i`, or null. */
function cssLiteral(s: string, i: number): Literal | null {
  const c = s[i];
  if (c === '"' || c === "'") {
    let j = i + 1;
    while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1;
    return { end: Math.min(s.length, j + 1), kind: 'string' };
  }
  if (c === '/' && s[i + 1] === '*') {
    const e = s.indexOf('*/', i + 2);
    return { end: e === -1 ? s.length : e + 2, kind: 'comment' };
  }
  if ((c === 'u' || c === 'U') && s.slice(i, i + 4).toLowerCase() === 'url(' && (i === 0 || !/[\w-]/.test(s[i - 1]))) {
    let k = i + 4;
    while (k < s.length && WS.test(s[k])) k++;
    if (s[k] === '"' || s[k] === "'") return null; // quoted: the string is handled on its own
    let j = k;
    while (j < s.length && s[j] !== ')') j += s[j] === '\\' ? 2 : 1;
    return { end: Math.min(s.length, j + 1), kind: 'url' };
  }
  return null;
}

const CSS_SPECIAL = /[\s"'()/{};,>~:!]/;

/**
 * Strips comments (except bang comments that start with slash-star-bang) and every whitespace that can't change meaning. Spaces inside
 * parentheses (calc(), media features) are only collapsed, never removed around operators.
 */
export function minifyCss(css: string, keepAllComments = false): string {
  let out = '';
  let space = false;
  let paren = 0;
  const n = css.length;
  const put = (tok: string) => {
    if (space && out) {
      const prev = out[out.length - 1];
      const dropAfter = paren > 0 ? '(,:' : '{};,>~:(';
      const dropBefore = paren > 0 ? '),' : '{};,>~)!';
      if (!dropAfter.includes(prev) && !dropBefore.includes(tok[0])) out += ' ';
    }
    space = false;
    out += tok;
  };
  for (let i = 0; i < n; ) {
    const c = css[i];
    if (WS.test(c)) {
      space = true;
      i++;
      continue;
    }
    const lit = cssLiteral(css, i);
    if (lit) {
      const body = css.slice(i, lit.end);
      if (lit.kind === 'comment') {
        if (keepAllComments || body.startsWith('/*!')) put(body);
        else space = true; // a comment still separates tokens
      } else if (lit.kind === 'url') put(body.replace(/^(url\()\s*([\s\S]*?)\s*\)$/i, '$1$2)'));
      else put(body);
      i = lit.end;
      continue;
    }
    if (c === '(') paren++;
    if (c === '}' && out.endsWith(';') && !out.endsWith('\\;') && !out.endsWith(':;')) out = out.slice(0, -1);
    if (c === ')') {
      put(c);
      if (paren > 0) paren--;
      i++;
      continue;
    }
    let j = i + 1;
    if (!CSS_SPECIAL.test(c)) while (j < n && !CSS_SPECIAL.test(css[j])) j++;
    put(css.slice(i, j));
    i = j;
  }
  return out;
}

/** Re-indents CSS: one declaration per line, selectors split at commas. Comments are kept. */
export function beautifyCss(css: string, unit = '  '): string {
  const src = minifyCss(css, true);
  const lines: string[] = [];
  let level = 0;
  let cur = '';
  let paren = 0;
  const pad = () => unit.repeat(level);
  const spaceCommas = (v: string) => {
    let o = '';
    for (let i = 0; i < v.length; ) {
      const lit = cssLiteral(v, i);
      if (lit) {
        o += v.slice(i, lit.end);
        i = lit.end;
      } else {
        o += v[i] === ',' && v[i + 1] !== undefined && !WS.test(v[i + 1]) ? ', ' : v[i];
        i++;
      }
    }
    return o;
  };
  const header = (h: string) => {
    if (h.startsWith('@')) return h.replace(/:(?=\S)/g, ': ').replace(/\s+/g, ' ');
    let o = '';
    let depth = 0;
    for (let i = 0; i < h.length; ) {
      const lit = cssLiteral(h, i);
      if (lit) {
        o += h.slice(i, lit.end);
        i = lit.end;
        continue;
      }
      const c = h[i++];
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      if (depth === 0 && c === ',') o += `,\n${pad()}`;
      else if (depth === 0 && (c === '>' || (c === '~' && h[i] !== '='))) o += ` ${c} `;
      else o += c;
    }
    return o.replace(/ {2,}/g, ' ');
  };
  const decl = (d: string) => {
    if (d.startsWith('@')) return spaceCommas(d);
    const colon = d.indexOf(':');
    if (colon < 1) return d;
    const value = spaceCommas(d.slice(colon + 1).trim()).replace(/\s*!\s*important$/i, ' !important');
    return `${d.slice(0, colon).trim()}: ${value}`;
  };
  const flushDecl = () => {
    const t = cur.trim();
    if (t) lines.push(`${pad()}${decl(t)};`);
    cur = '';
  };
  for (let i = 0; i < src.length; ) {
    const lit = cssLiteral(src, i);
    if (lit) {
      const body = src.slice(i, lit.end);
      if (lit.kind === 'comment' && !cur.trim()) lines.push(pad() + body);
      else cur += body;
      i = lit.end;
      continue;
    }
    const c = src[i++];
    if (c === '(') paren++;
    else if (c === ')') paren = Math.max(0, paren - 1);
    if (paren > 0 || !'{};'.includes(c)) cur += c;
    else if (c === '{') {
      lines.push(`${pad()}${header(cur.trim())} {`);
      level++;
      cur = '';
    } else if (c === ';') flushDecl();
    else {
      flushDecl();
      level = Math.max(0, level - 1);
      lines.push(`${pad()}}`);
      if (level === 0) lines.push('');
    }
  }
  flushDecl();
  return lines.join('\n').trim();
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

type Tok =
  | { t: 'text'; v: string }
  | { t: 'comment'; v: string; keep: boolean }
  | { t: 'decl'; v: string }
  | { t: 'tag'; name: string; kind: 'open' | 'close' | 'self'; v: string }
  | { t: 'raw'; v: string };

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'pre']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const BLOCK = new Set(
  ('html head body title meta link base script style noscript template div p section article aside nav header footer main h1 h2 h3 h4 h5 h6 ul ol li dl dt dd ' +
    'table thead tbody tfoot tr td th caption colgroup col form fieldset legend figure figcaption blockquote pre hr br address details summary menu dialog').split(' '),
);
// Elements whose end tag may be omitted: a new one closes the previous one.
const IMPLIED_END = new Set(['li', 'dt', 'dd', 'tr', 'td', 'th', 'p', 'option']);

export interface HtmlOptions {
  /** Drop quotes from attribute values that don't need them. Off by default. */
  unquote?: boolean;
  /** Keep every comment (beautify). Minify always drops all but conditional comments. */
  keepComments?: boolean;
}

/** Conditional comments (`<!--[if IE]>…<![endif]-->`, `<!--<![endif]-->`) are real instructions to old browsers. */
const isConditional = (inner: string) => /^\s*\[if\b/i.test(inner) || /<!\s*\[endif\]/i.test(inner);

function tokenizeHtml(html: string, o: HtmlOptions): Tok[] {
  const toks: Tok[] = [];
  const n = html.length;
  let i = 0;
  let textStart = 0;
  const flushText = (end: number) => {
    if (end > textStart) toks.push({ t: 'text', v: html.slice(textStart, end) });
  };
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;
    const next = html[lt + 1];
    if (html.startsWith('<!--', lt)) {
      flushText(lt);
      const e = html.indexOf('-->', lt + 4);
      const end = e === -1 ? n : e + 3;
      const inner = html.slice(lt + 4, e === -1 ? n : e);
      toks.push({ t: 'comment', v: html.slice(lt, end), keep: isConditional(inner) });
      i = textStart = end;
    } else if (next === '!' || next === '?') {
      flushText(lt);
      const e = html.indexOf('>', lt);
      const end = e === -1 ? n : e + 1;
      toks.push({ t: 'decl', v: html.slice(lt, end) });
      i = textStart = end;
    } else if (next !== undefined && (/[A-Za-z]/.test(next) || (next === '/' && /[A-Za-z]/.test(html[lt + 2] ?? '')))) {
      const closing = next === '/';
      let j = lt + (closing ? 2 : 1);
      const nameStart = j;
      while (j < n && !WS.test(html[j]) && html[j] !== '/' && html[j] !== '>') j++;
      const name = html.slice(nameStart, j);
      const attrs: string[] = [];
      let self = false;
      let closed = false;
      while (j < n) {
        while (j < n && WS.test(html[j])) j++;
        if (html[j] === '>') {
          j++;
          closed = true;
          break;
        }
        if (html[j] === '/') {
          if (html[j + 1] === '>') {
            self = true;
            closed = true;
            j += 2;
            break;
          }
          j++;
          continue;
        }
        const aStart = j;
        while (j < n && !WS.test(html[j]) && html[j] !== '=' && html[j] !== '>' && !(html[j] === '/' && html[j + 1] === '>')) j++;
        const aName = html.slice(aStart, j);
        let k = j;
        while (k < n && WS.test(html[k])) k++;
        if (html[k] !== '=') {
          attrs.push(aName);
          continue;
        }
        k++;
        while (k < n && WS.test(html[k])) k++;
        const q = html[k];
        let value: string;
        if (q === '"' || q === "'") {
          const e = html.indexOf(q, k + 1);
          const end = e === -1 ? n : e;
          value = html.slice(k + 1, end);
          j = Math.min(n, end + 1);
          const plain = o.unquote && /^[^\s"'`=<>]+$/.test(value) && !value.endsWith('/');
          attrs.push(plain ? `${aName}=${value}` : `${aName}=${q}${value}${q}`);
        } else {
          let e = k;
          while (e < n && !WS.test(html[e]) && html[e] !== '>') e++;
          value = html.slice(k, e);
          j = e;
          attrs.push(`${aName}=${value}`);
        }
      }
      if (!closed) break; // unterminated tag: leave the rest as text
      flushText(lt);
      const lower = name.toLowerCase();
      const kind = closing ? 'close' : self ? 'self' : 'open';
      const tail = kind === 'self' ? '/>' : '>';
      toks.push({ t: 'tag', name: lower, kind, v: closing ? `</${name}>` : `<${name}${attrs.map((a) => ' ' + a).join('')}${tail}` });
      i = textStart = j;
      if (kind === 'open' && RAW_TEXT.has(lower)) {
        const re = new RegExp(`</${lower}(?=[\\s/>])`, 'i');
        const m = re.exec(html.slice(j));
        const end = m ? j + m.index : n;
        if (end > j) toks.push({ t: 'raw', v: html.slice(j, end) });
        i = textStart = end;
      }
    } else i = lt + 1;
  }
  flushText(n);
  return toks;
}

/** Drops/keeps comments, merges text, and collapses whitespace according to the surrounding tags. */
function prepare(html: string, o: HtmlOptions): Tok[] {
  const toks = tokenizeHtml(html, o).filter((t) => t.t !== 'comment' || t.keep || o.keepComments);
  const merged: Tok[] = [];
  for (const t of toks) {
    const last = merged[merged.length - 1];
    if (t.t === 'text' && last?.t === 'text') last.v += t.v;
    else merged.push(t.t === 'text' ? { ...t } : t);
  }
  const edge = (t: Tok | undefined) => !t || t.t === 'decl' || t.t === 'comment' || (t.t === 'tag' && BLOCK.has(t.name));
  const out: Tok[] = [];
  merged.forEach((t, k) => {
    if (t.t !== 'text') return void out.push(t);
    let v = t.v.replace(/[ \t\r\n\f]+/g, ' ');
    if (edge(merged[k - 1])) v = v.replace(/^ /, '');
    if (edge(merged[k + 1])) v = v.replace(/ $/, '');
    if (v) out.push({ t: 'text', v });
  });
  return out;
}

const tokText = (t: Tok) => t.v;

export function minifyHtml(html: string, o: HtmlOptions = {}): string {
  return prepare(html, { unquote: o.unquote }).map(tokText).join('');
}

/** Indents block-level elements; inline content stays on its line. `<pre>`, `<textarea>` and `<script>` content is kept as written. */
export function beautifyHtml(html: string, unit = '  ', o: HtmlOptions = {}): string {
  const toks = prepare(html, { ...o, keepComments: true });
  const lines: string[] = [];
  const stack: string[] = [];
  let cur = '';
  let hold: string | null = null; // indent of a line that is still collecting inline content
  const pad = () => unit.repeat(stack.length);
  const flush = () => {
    if (cur.trim()) lines.push((hold ?? pad()) + cur.trim());
    cur = '';
    hold = null;
  };
  const isBlockTag = (t: Tok) => t.t === 'tag' && BLOCK.has(t.name);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.t === 'text' || t.t === 'raw') cur += t.v;
    else if (t.t === 'decl' || t.t === 'comment') {
      flush();
      cur = t.v;
      flush();
    } else if (t.t !== 'tag' || !BLOCK.has(t.name)) cur += t.v;
    else if (t.kind === 'close') {
      flush();
      const at = stack.lastIndexOf(t.name);
      if (at >= 0) stack.length = at;
      cur = t.v;
      flush();
    } else if (t.kind === 'self' || VOID.has(t.name)) {
      flush();
      cur = t.v;
      flush();
    } else {
      flush();
      if (IMPLIED_END.has(t.name) && stack[stack.length - 1] === t.name) stack.pop();
      const body = toks[k + 1];
      if ((t.name === 'script' || t.name === 'style') && body?.t === 'raw' && body.v.trim()) {
        lines.push(pad() + t.v);
        stack.push(t.name);
        const content = t.name === 'style' ? beautifyCss(body.v, unit) : body.v.trim();
        for (const l of content.split('\n')) lines.push(t.name === 'style' ? pad() + l : l);
        stack.pop();
        const close = toks[k + 2];
        lines.push(pad() + (close?.t === 'tag' && close.kind === 'close' ? close.v : `</${t.name}>`));
        k += close?.t === 'tag' && close.kind === 'close' ? 2 : 1;
        continue;
      }
      // A block holding only text and inline tags stays on one line.
      let j = k + 1;
      let inner = '';
      for (; j < toks.length; j++) {
        const x = toks[j];
        if (x.t === 'text' || x.t === 'raw' || (x.t === 'tag' && !isBlockTag(x))) inner += tokText(x);
        else break;
      }
      const end = toks[j];
      if (end?.t === 'tag' && end.kind === 'close' && end.name === t.name) {
        cur = t.v + inner + end.v;
        flush();
        k = j;
      } else {
        hold = pad();
        cur = t.v;
        stack.push(t.name);
        const nx = toks[k + 1];
        if (!nx || !(nx.t === 'text' || (nx.t === 'tag' && !isBlockTag(nx)))) flush();
      }
    }
  }
  flush();
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Gzip size via the browser's CompressionStream, or null where it isn't available. */
export async function gzipSize(text: string): Promise<number | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return (await new Response(stream).arrayBuffer()).byteLength;
  } catch {
    return null;
  }
}
