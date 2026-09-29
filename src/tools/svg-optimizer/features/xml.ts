// A small, strict-enough XML parser and serializer for SVG files. Keeps attribute values and text
// raw (still entity-escaped) so the output round-trips byte-for-byte where nothing was changed.

import { textError, type TextError } from '../../../shared/lib/textpos';

export interface XmlAttr {
  name: string;
  /** Raw value as written, entities still escaped. */
  value: string;
}

export interface XmlElement {
  type: 'element';
  name: string;
  attrs: XmlAttr[];
  children: XmlNode[];
}

export type XmlNode =
  | XmlElement
  | { type: 'text'; value: string }
  | { type: 'comment'; value: string }
  | { type: 'cdata'; value: string }
  | { type: 'pi'; value: string }
  | { type: 'doctype'; value: string };

export interface XmlDocument {
  children: XmlNode[];
}

export class XmlError extends Error {
  readonly detail: TextError;
  constructor(detail: TextError) {
    super(detail.message);
    this.name = 'XmlError';
    this.detail = detail;
  }
}

const NAME = /[A-Za-z_:][\w.:-]*/y;
const MAX_ENTITY_EXPANSION = 1_000_000;

/** Decode the predefined and numeric entities (for inspecting values, e.g. `&#106;avascript:`). */
export function decodeEntities(raw: string): string {
  return raw.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi, (m, e: string) => {
    const k = e.toLowerCase();
    if (k === 'lt') return '<';
    if (k === 'gt') return '>';
    if (k === 'amp') return '&';
    if (k === 'quot') return '"';
    if (k === 'apos') return "'";
    const code = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

export function parseXml(src: string): XmlDocument {
  const doc: XmlDocument = { children: [] };
  const stack: XmlElement[] = [];
  const at = () => (stack.length ? stack[stack.length - 1].children : doc.children);
  const fail = (offset: number, message: string): never => {
    throw new XmlError(textError(src, offset, message));
  };
  const entities = new Map<string, string>();
  let i = src.charCodeAt(0) === 0xfeff ? 1 : 0;

  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt !== i) {
      const end = lt === -1 ? src.length : lt;
      at().push({ type: 'text', value: src.slice(i, end) });
      i = end;
      continue;
    }
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end === -1) fail(i, 'This comment is never closed (missing -->).');
      at().push({ type: 'comment', value: src.slice(i + 4, end) });
      i = end + 3;
    } else if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i + 9);
      if (end === -1) fail(i, 'This CDATA section is never closed (missing ]]>).');
      at().push({ type: 'cdata', value: src.slice(i + 9, end) });
      i = end + 3;
    } else if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i + 2);
      if (end === -1) fail(i, 'This processing instruction is never closed (missing ?>).');
      at().push({ type: 'pi', value: src.slice(i + 2, end) });
      i = end + 2;
    } else if (/^<!DOCTYPE/i.test(src.slice(i, i + 9))) {
      // Skip to the closing '>', stepping over quoted strings and the [internal subset].
      let j = i + 9;
      let depth = 0;
      let quote = '';
      for (; j < src.length; j++) {
        const c = src[j];
        if (quote) {
          if (c === quote) quote = '';
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '[') depth++;
        else if (c === ']') depth--;
        else if (c === '>' && depth <= 0) break;
      }
      if (j >= src.length) fail(i, 'The DOCTYPE is never closed.');
      const value = src.slice(i + 9, j).trim();
      for (const m of value.matchAll(/<!ENTITY\s+([\w.:-]+)\s+(["'])([\s\S]*?)\2\s*>/g)) entities.set(m[1], m[3]);
      at().push({ type: 'doctype', value });
      i = j + 1;
    } else if (src.startsWith('</', i)) {
      NAME.lastIndex = i + 2;
      const m = NAME.exec(src);
      if (!m) fail(i, 'Expected an element name after </.');
      const close = src.indexOf('>', i);
      if (close === -1 || src.slice(i + 2 + m![0].length, close).trim()) fail(i, `Expected > to close </${m![0]}.`);
      const open = stack.pop();
      if (!open) fail(i, `Found </${m![0]}> without a matching opening tag.`);
      if (open!.name !== m![0]) fail(i, `Expected </${open!.name}> but found </${m![0]}>.`);
      i = close + 1;
    } else {
      NAME.lastIndex = i + 1;
      const m = NAME.exec(src);
      if (!m) fail(i, 'Expected an element name after <. Use &lt; for a literal less-than sign.');
      const el: XmlElement = { type: 'element', name: m![0], attrs: [], children: [] };
      let j = i + 1 + m![0].length;
      let selfClosing = false;
      for (;;) {
        const ws = /\s*/y;
        ws.lastIndex = j;
        ws.exec(src);
        const hadSpace = ws.lastIndex > j;
        j = ws.lastIndex;
        if (j >= src.length) fail(i, `The <${el.name}> tag is never closed.`);
        if (src.startsWith('/>', j)) {
          selfClosing = true;
          j += 2;
          break;
        }
        if (src[j] === '>') {
          j++;
          break;
        }
        if (!hadSpace) fail(j, `Expected a space between attributes in <${el.name}>.`);
        const an = /[^\s=/>]+/y;
        an.lastIndex = j;
        const nameMatch = an.exec(src);
        if (!nameMatch) fail(j, `Unexpected character in <${el.name}>.`);
        const name = nameMatch![0];
        j = an.lastIndex;
        const eq = /\s*=\s*/y;
        eq.lastIndex = j;
        if (!eq.exec(src)) fail(j, `The attribute ${name} needs a value, like ${name}="…".`);
        j = eq.lastIndex;
        const q = src[j];
        if (q !== '"' && q !== "'") fail(j, `The value of ${name} must be in quotes.`);
        const end = src.indexOf(q, j + 1);
        if (end === -1) fail(j, `The value of ${name} is never closed.`);
        if (el.attrs.some((a) => a.name === name)) fail(j, `Duplicate attribute ${name} on <${el.name}>.`);
        el.attrs.push({ name, value: src.slice(j + 1, end) });
        j = end + 1;
      }
      at().push(el);
      if (!selfClosing) stack.push(el);
      i = j;
    }
  }
  if (stack.length) fail(src.length, `The <${stack[stack.length - 1].name}> element is never closed.`);
  if (entities.size) expandEntities(doc, entities);
  return doc;
}

/** Expand custom DOCTYPE entities (Illustrator writes xmlns="&ns_svg;"). One level only, bounded. */
function expandEntities(doc: XmlDocument, entities: Map<string, string>) {
  let budget = MAX_ENTITY_EXPANSION;
  const expand = (s: string) =>
    s.replace(/&([\w.:-]+);/g, (m, name: string) => {
      const v = entities.get(name);
      if (v === undefined || /[<&]/.test(v) || (budget -= v.length) < 0) return m;
      return v.replace(/"/g, '&quot;');
    });
  const walk = (nodes: XmlNode[]) => {
    for (const n of nodes) {
      if (n.type === 'text') n.value = expand(n.value);
      else if (n.type === 'element') {
        for (const a of n.attrs) a.value = expand(a.value);
        walk(n.children);
      }
    }
  };
  walk(doc.children);
}

/** Elements whose text content is meaningful and must not be re-indented. */
const TEXT_ELEMENTS = new Set(['text', 'tspan', 'textPath', 'title', 'desc', 'style', 'script', 'a']);

export function serializeXml(doc: XmlDocument, pretty = false): string {
  const out: string[] = [];
  const attr = (a: XmlAttr) => ` ${a.name}="${a.value.includes('"') ? a.value.replace(/"/g, '&quot;') : a.value}"`;
  const node = (n: XmlNode, depth: number, inline: boolean) => {
    const pad = pretty && !inline ? '\n' + '  '.repeat(depth) : '';
    switch (n.type) {
      case 'text':
        out.push(n.value);
        return;
      case 'comment':
        out.push(`${pad}<!--${n.value}-->`);
        return;
      case 'cdata':
        out.push(`<![CDATA[${n.value}]]>`);
        return;
      case 'pi':
        out.push(`${pad}<?${n.value}?>`);
        return;
      case 'doctype':
        out.push(`${pad}<!DOCTYPE ${n.value}>`);
        return;
      case 'element': {
        out.push(`${pad}<${n.name}${n.attrs.map(attr).join('')}`);
        if (!n.children.length) {
          out.push('/>');
          return;
        }
        out.push('>');
        const childInline = inline || TEXT_ELEMENTS.has(n.name) || n.children.some((c) => c.type === 'text' && c.value.trim());
        for (const c of n.children) node(c, depth + 1, childInline);
        out.push(`${pretty && !childInline ? '\n' + '  '.repeat(depth) : ''}</${n.name}>`);
      }
    }
  };
  for (const n of doc.children) node(n, 0, false);
  return out.join('').replace(/^\n/, '');
}
