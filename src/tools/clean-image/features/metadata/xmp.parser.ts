// Small tolerant XMP (RDF/XML) reader. DOMParser isn't available in Web Workers,
// so this tokenizes the packet and extracts simple properties, attribute
// shorthand properties, and rdf:Alt/Seq/Bag lists.

export interface XmpField {
  key: string;
  value: string;
}

const MAX_XMP_CHARS = 8 * 1024 * 1024;
const MAX_FIELDS = 2000;

const TOKEN_RE =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<!DOCTYPE[^>]*>|<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[^\s=>/]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)|</g;
const ATTR_RE = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const IGNORED_PREFIXES = new Set(['rdf', 'x', 'xml', 'xmlns']);

function isProperty(name: string): boolean {
  const i = name.indexOf(':');
  if (i <= 0) return false;
  if (name === 'x:xmptk') return true;
  return !IGNORED_PREFIXES.has(name.slice(0, i));
}

export function decodeXmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e: string) => {
    const lower = e.toLowerCase();
    if (lower === 'amp') return '&';
    if (lower === 'lt') return '<';
    if (lower === 'gt') return '>';
    if (lower === 'quot') return '"';
    if (lower === 'apos') return "'";
    const code = lower.startsWith('#x') ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

interface Frame {
  name: string;
  text: string;
  items: string[];
}

export function parseXmp(xml: string): XmpField[] {
  const out: XmpField[] = [];
  const seen = new Set<string>();
  const add = (key: string, raw: string) => {
    if (out.length >= MAX_FIELDS) return;
    const value = decodeXmlEntities(raw).trim();
    if (!value) return;
    const id = `${key}\u0000${value}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ key, value });
  };

  const stack: Frame[] = [];
  const source = xml.length > MAX_XMP_CHARS ? xml.slice(0, MAX_XMP_CHARS) : xml;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(source))) {
    const [, cdata, closing, name, attrs, selfClosing, text] = m;
    if (cdata !== undefined) {
      if (stack.length) stack[stack.length - 1].text += cdata;
      continue;
    }
    if (text !== undefined) {
      if (stack.length && text.trim()) stack[stack.length - 1].text += text;
      continue;
    }
    if (!name) continue;

    if (!closing) {
      if (attrs) {
        ATTR_RE.lastIndex = 0;
        let a: RegExpExecArray | null;
        while ((a = ATTR_RE.exec(attrs))) {
          if (isProperty(a[1])) add(a[1], a[2] ?? a[3] ?? '');
        }
      }
      if (!selfClosing) stack.push({ name, text: '', items: [] });
      continue;
    }

    // Closing tag: pop to the matching frame (tolerates malformed nesting).
    let idx = stack.length - 1;
    while (idx >= 0 && stack[idx].name !== name) idx--;
    if (idx < 0) continue;
    const frame = stack[idx];
    stack.length = idx;
    const value = frame.items.length ? frame.items.join('; ') : frame.text.trim();

    if (name === 'rdf:li') {
      if (!value) continue;
      for (let j = stack.length - 1; j >= 0; j--) {
        if (isProperty(stack[j].name)) {
          stack[j].items.push(decodeXmlEntities(value));
          break;
        }
      }
    } else if (isProperty(name) && value) {
      add(name, value);
    }
  }
  return out;
}
