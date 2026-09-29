// A small, strict XML parser (no DOMParser) and a JSON ↔ XML mapping.
//
// Safety: DOCTYPE declarations are skipped and never interpreted, so entity declarations
// (external entities / "billion laughs") can't be expanded. Only the five predefined
// entities and numeric character references are decoded; anything else is an error.

import { textError, type TextError } from '../../../shared/lib/textpos';

export type XmlNode =
  | { type: 'element'; name: string; attrs: [string, string][]; children: XmlNode[] }
  | { type: 'text'; value: string; cdata: boolean }
  | { type: 'comment'; value: string }
  | { type: 'pi'; target: string; data: string };

export interface XmlDocument {
  /** Top-level nodes: the root element plus any comments / processing instructions around it. */
  nodes: XmlNode[];
  root: Extract<XmlNode, { type: 'element' }>;
  /** Notices about things that were skipped (e.g. a DOCTYPE). */
  notices: string[];
}

export type XmlParseResult = { ok: true; doc: XmlDocument } | { ok: false; error: TextError };

export const MAX_DEPTH = 1000;

class XmlError extends Error {
  offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

const NAME = /[A-Za-z_:À-￿][-A-Za-z0-9_:.·À-￿]*/y;
const WS = /[ \t\r\n]*/y;
const PREDEFINED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function isXmlName(name: string): boolean {
  NAME.lastIndex = 0;
  return NAME.test(name) && NAME.lastIndex === name.length;
}

function decodeEntities(raw: string, base: number): string {
  if (!raw.includes('&')) return raw;
  let out = '';
  let last = 0;
  for (let i = raw.indexOf('&'); i !== -1; i = raw.indexOf('&', last)) {
    out += raw.slice(last, i);
    const end = raw.indexOf(';', i);
    if (end === -1 || end - i > 12) throw new XmlError('An "&" must start an entity like &amp; (write "&amp;" for a literal ampersand).', base + i);
    const name = raw.slice(i + 1, end);
    if (name[0] === '#') {
      const hex = name[1] === 'x';
      const digits = name.slice(hex ? 2 : 1);
      const code = digits && (hex ? /^[0-9a-fA-F]+$/ : /^\d+$/).test(digits) ? parseInt(digits, hex ? 16 : 10) : NaN;
      const valid =
        code === 0x9 || code === 0xa || code === 0xd || (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) || (code >= 0x10000 && code <= 0x10ffff);
      if (!valid) throw new XmlError(`&${name}; is not a valid character reference.`, base + i);
      out += String.fromCodePoint(code);
    } else if (name in PREDEFINED) out += PREDEFINED[name];
    else throw new XmlError(`Unknown entity &${name};. Only &amp; &lt; &gt; &quot; &apos; and numeric references are supported.`, base + i);
    last = end + 1;
  }
  return out + raw.slice(last);
}

export function parseXml(text: string): XmlParseResult {
  try {
    return { ok: true, doc: parse(text) };
  } catch (err) {
    if (err instanceof XmlError) return { ok: false, error: textError(text, err.offset, err.message) };
    throw err;
  }
}

function parse(input: string): XmlDocument {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const n = text.length;
  const notices: string[] = [];
  const top: XmlNode[] = [];
  type El = Extract<XmlNode, { type: 'element' }>;
  const stack: { el: El; start: number }[] = [];
  let root: El | null = null;
  let i = 0;

  const add = (node: XmlNode) => (stack.length ? stack[stack.length - 1].el.children : top).push(node);
  const skipWs = () => {
    WS.lastIndex = i;
    WS.test(text);
    i = WS.lastIndex;
  };
  const readName = (what: string) => {
    NAME.lastIndex = i;
    const m = NAME.exec(text);
    if (!m) throw new XmlError(`Expected ${what} name.`, i);
    i = NAME.lastIndex;
    return m[0];
  };
  const expectEnd = (marker: string, from: number, what: string) => {
    const end = text.indexOf(marker, from);
    if (end === -1) throw new XmlError(`${what} is never closed (missing "${marker}").`, from);
    return end;
  };

  while (i < n) {
    const lt = text.indexOf('<', i);
    const textEnd = lt === -1 ? n : lt;
    if (textEnd > i) {
      const raw = text.slice(i, textEnd);
      if (!stack.length) {
        const bad = raw.search(/[^ \t\r\n]/);
        if (bad !== -1) throw new XmlError(root ? 'Text after the root element.' : 'Text before the root element.', i + bad);
      } else {
        const gt = raw.indexOf(']]>');
        if (gt !== -1) throw new XmlError('"]]>" is not allowed in text.', i + gt);
        add({ type: 'text', value: decodeEntities(raw, i), cdata: false });
      }
    }
    if (lt === -1) break;
    i = lt;

    if (text.startsWith('<!--', i)) {
      const end = expectEnd('-->', i + 4, 'A comment');
      const value = text.slice(i + 4, end);
      if (value.includes('--')) throw new XmlError('"--" is not allowed inside a comment.', i + 4 + value.indexOf('--'));
      add({ type: 'comment', value });
      i = end + 3;
    } else if (text.startsWith('<![CDATA[', i)) {
      if (!stack.length) throw new XmlError('CDATA is only allowed inside an element.', i);
      const end = expectEnd(']]>', i + 9, 'A CDATA section');
      add({ type: 'text', value: text.slice(i + 9, end), cdata: true });
      i = end + 3;
    } else if (text.startsWith('<!DOCTYPE', i)) {
      if (root || stack.length) throw new XmlError('A DOCTYPE must come before the root element.', i);
      // Skip to the matching ">", stepping over quoted strings and an internal subset.
      let j = i + 9;
      let depth = 0;
      let subset = false;
      for (; j < n; j++) {
        const c = text[j];
        if (c === '"' || c === "'") {
          const q = text.indexOf(c, j + 1);
          if (q === -1) break;
          j = q;
        } else if (c === '[') {
          depth++;
          subset = true;
        } else if (c === ']') depth--;
        else if (c === '>' && depth <= 0) break;
      }
      if (j >= n) throw new XmlError('The DOCTYPE is never closed.', i);
      notices.push(
        subset
          ? 'The DOCTYPE and its internal declarations were ignored. Entities it declares are never expanded, which protects against XXE and "billion laughs" attacks.'
          : 'The DOCTYPE was ignored; external DTDs are never loaded.',
      );
      i = j + 1;
    } else if (text.startsWith('<?', i)) {
      const start = i;
      i += 2;
      const target = readName('a processing instruction');
      const end = expectEnd('?>', i, 'A processing instruction');
      const data = text.slice(i, end).trim();
      if (target.toLowerCase() === 'xml' && (start !== 0 || target !== 'xml'))
        throw new XmlError('The XML declaration must be the very first thing in the document.', start);
      add({ type: 'pi', target, data });
      i = end + 2;
    } else if (text.startsWith('</', i)) {
      const start = i;
      i += 2;
      const name = readName('a closing tag');
      skipWs();
      if (text[i] !== '>') throw new XmlError(`Expected ">" to end </${name}.`, i);
      const open = stack.pop();
      if (!open) throw new XmlError(`Closing tag </${name}> has no matching opening tag.`, start);
      if (open.el.name !== name) throw new XmlError(`Expected </${open.el.name}> but found </${name}>.`, start);
      i++;
    } else if (text[i + 1] === '!') {
      throw new XmlError('Unsupported markup declaration.', i);
    } else {
      const start = i;
      i++;
      const name = readName('an element');
      if (!stack.length && root) throw new XmlError('Only one root element is allowed.', start);
      const attrs: [string, string][] = [];
      const seen = new Set<string>();
      let selfClosing = false;
      for (;;) {
        const before = i;
        skipWs();
        if (i >= n) throw new XmlError(`The tag <${name}> is never closed.`, start);
        if (text[i] === '>') {
          i++;
          break;
        }
        if (text.startsWith('/>', i)) {
          i += 2;
          selfClosing = true;
          break;
        }
        if (i === before) throw new XmlError('Expected whitespace between attributes.', i);
        const attrStart = i;
        const an = readName('an attribute');
        skipWs();
        if (text[i] !== '=') throw new XmlError(`Attribute "${an}" needs a value (${an}="…").`, i);
        i++;
        skipWs();
        const q = text[i];
        if (q !== '"' && q !== "'") throw new XmlError(`The value of "${an}" must be in quotes.`, i);
        const end = text.indexOf(q, i + 1);
        if (end === -1) throw new XmlError(`The value of "${an}" is never closed.`, i);
        const raw = text.slice(i + 1, end);
        const ltIn = raw.indexOf('<');
        if (ltIn !== -1) throw new XmlError('"<" is not allowed in an attribute value.', i + 1 + ltIn);
        if (seen.has(an)) throw new XmlError(`Duplicate attribute "${an}".`, attrStart);
        seen.add(an);
        attrs.push([an, decodeEntities(raw.replace(/[\t\n\r]/g, ' '), i + 1)]);
        i = end + 1;
      }
      const el: El = { type: 'element', name, attrs, children: [] };
      add(el);
      if (!stack.length) root = el;
      if (!selfClosing) {
        if (stack.length >= MAX_DEPTH) throw new XmlError(`Elements are nested more than ${MAX_DEPTH} levels deep.`, start);
        stack.push({ el, start });
      }
    }
  }
  if (stack.length) {
    const open = stack[stack.length - 1];
    throw new XmlError(`<${open.el.name}> is never closed.`, open.start);
  }
  if (!root) throw new XmlError('No root element found.', n);
  return { nodes: top, root, notices };
}

// ---------------------------------------------------------------------------
// XML → JSON
// ---------------------------------------------------------------------------

export interface XmlToJsonOptions {
  /** Every child element becomes an array, even when it appears once. */
  alwaysArrays: boolean;
  /** Trim text and drop whitespace-only text between elements. */
  trim: boolean;
  /** Turn "42" / "true" / "false" in text and attributes into numbers and booleans. */
  coerce: boolean;
  /** Keep comments as "#comment". */
  comments: boolean;
}

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const NUM = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

function scalar(s: string, coerce: boolean): Json {
  if (!coerce) return s;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (NUM.test(s)) {
    const v = Number(s);
    if (Number.isFinite(v) && (!/^-?\d+$/.test(s) || Number.isSafeInteger(v))) return v;
  }
  return s;
}

function pushKey(obj: Record<string, Json>, key: string, value: Json) {
  const cur = obj[key];
  if (cur === undefined) obj[key] = value;
  else if (Array.isArray(cur)) cur.push(value);
  else obj[key] = [cur, value];
}

function elementToJson(el: Extract<XmlNode, { type: 'element' }>, o: XmlToJsonOptions): Json {
  const obj: Record<string, Json> = {};
  for (const [k, v] of el.attrs) obj[`@${k}`] = scalar(v, o.coerce);
  let text = '';
  let hasText = false;
  const grouped = new Map<string, Json[]>();
  const comments: string[] = [];
  for (const c of el.children) {
    if (c.type === 'text') {
      text += c.value;
      hasText = true;
    } else if (c.type === 'comment') comments.push(c.value);
    else if (c.type === 'element') {
      const list = grouped.get(c.name) ?? [];
      list.push(elementToJson(c, o));
      grouped.set(c.name, list);
    }
  }
  if (o.trim) text = text.trim();
  const hasChildren = grouped.size > 0;
  if (!el.attrs.length && !hasChildren && !(o.comments && comments.length)) {
    return hasText && text !== '' ? scalar(text, o.coerce) : '';
  }
  // Whitespace-only text next to child elements is just indentation.
  if (text !== '' && !(hasChildren && text.trim() === '')) obj['#text'] = scalar(text, o.coerce);
  if (o.comments && comments.length) obj['#comment'] = comments.length === 1 ? comments[0] : comments;
  for (const [name, values] of grouped) {
    obj[name] = values.length === 1 && !o.alwaysArrays ? values[0] : values;
  }
  return obj;
}

export function xmlToJson(doc: XmlDocument, o: XmlToJsonOptions): Json {
  const out: Record<string, Json> = {};
  for (const node of doc.nodes) {
    if (node.type === 'pi') {
      if (node.target === 'xml') {
        const decl: Record<string, Json> = {};
        for (const m of node.data.matchAll(/([A-Za-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) decl[`@${m[1]}`] = m[2] ?? m[3];
        out['?xml'] = decl;
      } else pushKey(out, `?${node.target}`, node.data);
    } else if (node.type === 'comment' && o.comments) pushKey(out, '#comment', node.value);
    else if (node.type === 'element') {
      const v = elementToJson(node, o);
      out[node.name] = o.alwaysArrays ? [v] : v;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// JSON → XML
// ---------------------------------------------------------------------------

export interface JsonToXmlOptions {
  indent: 2 | 4 | 'tab' | 'none';
  /** Add <?xml version="1.0" encoding="UTF-8"?> when the JSON doesn't have a "?xml" key. */
  declaration: boolean;
}

export class JsonToXmlError extends Error {}

// Characters XML 1.0 can't contain at all, even escaped.
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export function escapeText(s: string): string {
  return s.replace(INVALID_CHARS, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, '&quot;').replace(/\t/g, '&#9;').replace(/\n/g, '&#10;').replace(/\r/g, '&#13;');
}

function scalarText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function jsonToXml(value: unknown, o: JsonToXmlOptions): { xml: string; notices: string[] } {
  const unit = o.indent === 'none' ? '' : o.indent === 'tab' ? '\t' : ' '.repeat(o.indent);
  const nl = o.indent === 'none' ? '' : '\n';
  const notices: string[] = [];
  const lines: string[] = [];
  const pad = (d: number) => unit.repeat(d);

  const checkName = (name: string, path: string) => {
    if (!isXmlName(name)) throw new JsonToXmlError(`"${name}" at ${path} is not a valid XML element or attribute name.`);
  };

  const emit = (name: string, v: unknown, depth: number, path: string) => {
    if (depth > MAX_DEPTH) throw new JsonToXmlError(`The JSON is nested more than ${MAX_DEPTH} levels deep.`);
    if (Array.isArray(v)) {
      for (let k = 0; k < v.length; k++) emit(name, v[k], depth, `${path}[${k}]`);
      return;
    }
    checkName(name, path);
    if (!isObject(v)) {
      const t = scalarText(v);
      lines.push(v === null || t === '' ? `${pad(depth)}<${name}/>` : `${pad(depth)}<${name}>${escapeText(t)}</${name}>`);
      return;
    }
    let attrs = '';
    let text: string | null = null;
    let cdata: string | null = null;
    const children: [string, unknown][] = [];
    for (const [k, child] of Object.entries(v)) {
      if (k.startsWith('@')) {
        checkName(k.slice(1), `${path}.${k}`);
        attrs += ` ${k.slice(1)}="${escapeAttr(scalarText(child))}"`;
      } else if (k === '#text') text = scalarText(child);
      else if (k === '#cdata') cdata = scalarText(child);
      else children.push([k, child]);
    }
    const open = `${pad(depth)}<${name}${attrs}`;
    if (!children.length) {
      if (cdata !== null) lines.push(`${open}>${text !== null ? escapeText(text) : ''}<![CDATA[${cdata.replace(/]]>/g, ']]]]><![CDATA[>')}]]></${name}>`);
      else if (text !== null && text !== '') lines.push(`${open}>${escapeText(text)}</${name}>`);
      else lines.push(`${open}/>`);
      return;
    }
    lines.push(`${open}>`);
    if (text !== null && text !== '') lines.push(`${pad(depth + 1)}${escapeText(text)}`);
    if (cdata !== null) lines.push(`${pad(depth + 1)}<![CDATA[${cdata.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`);
    for (const [k, child] of children) {
      if (k === '#comment') emitComments(child, depth + 1);
      else emit(k, child, depth + 1, `${path}.${k}`);
    }
    lines.push(`${pad(depth)}</${name}>`);
  };

  const emitComments = (c: unknown, depth: number) => {
    for (const item of Array.isArray(c) ? c : [c]) lines.push(`${pad(depth)}<!--${scalarText(item).replace(/--/g, '- -').replace(/-$/, '- ')}-->`);
  };

  let top: Record<string, unknown>;
  if (isObject(value)) top = value;
  else if (Array.isArray(value)) {
    top = { root: { item: value } };
    notices.push('The top-level array was wrapped in <root> with one <item> per entry.');
  } else {
    top = { root: value };
    notices.push('The value was wrapped in a <root> element.');
  }

  let decl: string | null = o.declaration ? '<?xml version="1.0" encoding="UTF-8"?>' : null;
  const rootKeys: string[] = [];
  const pis: string[] = [];
  for (const [k, v] of Object.entries(top)) {
    if (k === '?xml') {
      if (isObject(v)) {
        const parts = Object.entries(v).map(([a, val]) => `${a.replace(/^@/, '')}="${escapeAttr(scalarText(val))}"`);
        decl = `<?xml ${parts.join(' ')}?>`;
      }
    } else if (k.startsWith('?')) {
      for (const d of Array.isArray(v) ? v : [v]) pis.push(`<?${k.slice(1)} ${scalarText(d).replace(/\?>/g, '? >')}?>`);
    } else if (k !== '#comment') rootKeys.push(k);
  }
  const single = rootKeys.length === 1 && !Array.isArray(top[rootKeys[0]]);
  if (decl) lines.push(decl);
  lines.push(...pis);
  if ('#comment' in top) emitComments(top['#comment'], 0);
  if (single) emit(rootKeys[0], top[rootKeys[0]], 0, rootKeys[0]);
  else {
    if (rootKeys.length) notices.push('XML needs exactly one root element, so the top-level keys were wrapped in <root>.');
    const rest: Record<string, unknown> = {};
    for (const k of rootKeys) rest[k] = top[k];
    emit('root', rest, 0, 'root');
  }
  return { xml: lines.join(nl) + nl, notices };
}
