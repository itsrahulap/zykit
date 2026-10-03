// A small, safe XML reader for Office metadata parts. It never expands entities defined in a DTD
// (a DOCTYPE is skipped, not interpreted), never fetches anything, and caps depth and size.
// Only the five predefined entities and numeric character references are decoded.

export interface XNode {
  /** Qualified name as written, e.g. `dc:creator`. */
  name: string;
  /** Name without its prefix, e.g. `creator`. */
  local: string;
  attrs: Record<string, string>;
  children: XNode[];
  /** Text directly inside this element. */
  text: string;
}

export class XmlError extends Error {}

const MAX_DEPTH = 128;
const MAX_NODES = 200_000;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeEntities(s: string): string {
  if (!s.includes('&')) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (m, e: string) => {
    if (e[0] !== '#') return ENTITIES[e];
    const code = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

export const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const localName = (n: string) => n.slice(n.indexOf(':') + 1);

function parseTag(body: string): { name: string; attrs: Record<string, string>; selfClosing: boolean } {
  const selfClosing = body.endsWith('/');
  const inner = selfClosing ? body.slice(0, -1) : body;
  const m = /^([^\s/>]+)/.exec(inner);
  if (!m) throw new XmlError('Malformed tag.');
  const attrs: Record<string, string> = {};
  for (const a of inner.slice(m[0].length).matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? '');
  return { name: m[1], attrs, selfClosing };
}

export function parseXml(src: string): XNode {
  const s = src.charCodeAt(0) === 0xfeff ? src.slice(1) : src;
  const root: XNode = { name: '#root', local: '#root', attrs: {}, children: [], text: '' };
  const stack: XNode[] = [root];
  let nodes = 0;
  let i = 0;
  const n = s.length;
  while (i < n) {
    const lt = s.indexOf('<', i);
    const cur = stack[stack.length - 1];
    if (lt < 0) {
      cur.text += decodeEntities(s.slice(i));
      break;
    }
    if (lt > i) cur.text += decodeEntities(s.slice(i, lt));
    if (s.startsWith('<!--', lt)) {
      const end = s.indexOf('-->', lt + 4);
      if (end < 0) throw new XmlError('Unterminated comment.');
      i = end + 3;
    } else if (s.startsWith('<![CDATA[', lt)) {
      const end = s.indexOf(']]>', lt + 9);
      if (end < 0) throw new XmlError('Unterminated CDATA.');
      cur.text += s.slice(lt + 9, end);
      i = end + 3;
    } else if (s.startsWith('<?', lt)) {
      const end = s.indexOf('?>', lt + 2);
      if (end < 0) throw new XmlError('Unterminated declaration.');
      i = end + 2;
    } else if (s.startsWith('<!', lt)) {
      // DOCTYPE: skipped whole, including any [internal subset]. Never interpreted.
      let depth = 0;
      let j = lt + 2;
      for (; j < n; j++) {
        const c = s[j];
        if (c === '[') depth++;
        else if (c === ']') depth--;
        else if (c === '>' && depth <= 0) break;
      }
      if (j >= n) throw new XmlError('Unterminated declaration.');
      i = j + 1;
    } else if (s.startsWith('</', lt)) {
      const end = s.indexOf('>', lt + 2);
      if (end < 0) throw new XmlError('Unterminated tag.');
      const name = s.slice(lt + 2, end).trim();
      if (stack.length < 2 || stack[stack.length - 1].name !== name) throw new XmlError(`Unexpected closing tag </${name}>.`);
      stack.pop();
      i = end + 1;
    } else {
      let j = lt + 1;
      let quote = '';
      for (; j < n; j++) {
        const c = s[j];
        if (quote) {
          if (c === quote) quote = '';
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '>') break;
      }
      if (j >= n) throw new XmlError('Unterminated tag.');
      const { name, attrs, selfClosing } = parseTag(s.slice(lt + 1, j));
      if (++nodes > MAX_NODES) throw new XmlError('This XML part is too large to read.');
      const node: XNode = { name, local: localName(name), attrs, children: [], text: '' };
      cur.children.push(node);
      if (!selfClosing) {
        if (stack.length > MAX_DEPTH) throw new XmlError('This XML part is nested too deeply.');
        stack.push(node);
      }
      i = j + 1;
    }
  }
  if (stack.length !== 1) throw new XmlError('The XML is not closed.');
  const top = root.children[0];
  if (!top) throw new XmlError('The XML part is empty.');
  return top;
}

/** All descendants (depth-first) with this local name. */
export function findAll(node: XNode, local: string, out: XNode[] = []): XNode[] {
  for (const c of node.children) {
    if (c.local === local) out.push(c);
    findAll(c, local, out);
  }
  return out;
}

/** Concatenated text of an element and its descendants, trimmed. */
export function textOf(node: XNode): string {
  return (node.text + node.children.map(textOf).join('')).trim();
}
