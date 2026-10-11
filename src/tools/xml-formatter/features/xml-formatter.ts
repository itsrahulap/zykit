// Format / minify XML from xml-json's strict parser (no DOCTYPE or entity expansion), plus an
// XPath tester that runs on the browser's own DOMParser and document.evaluate.

import { parseXml, escapeAttr, escapeText, type XmlDocument, type XmlNode } from '../../xml-json/features/xml';
import type { TextError } from '../../../shared/lib/textpos';

type El = Extract<XmlNode, { type: 'element' }>;

export type XmlIndent = 2 | 4 | 'tab';

export interface XmlFormatOptions {
  /** `minify` drops whitespace between elements (and comments when `comments` is false). */
  mode: 'format' | 'minify';
  indent?: XmlIndent;
  comments?: boolean;
}

const isBlank = (n: XmlNode) => n.type === 'text' && !n.cdata && n.value.trim() === '';

/** Elements with real text (or xml:space="preserve") keep every character; others ignore blank text between children. */
const isMixed = (el: El) => el.attrs.some(([k, v]) => k === 'xml:space' && v === 'preserve') || el.children.some((c) => c.type === 'text' && !isBlank(c));

function inline(n: XmlNode, comments: boolean): string {
  switch (n.type) {
    case 'text':
      return n.cdata ? `<![CDATA[${n.value}]]>` : escapeText(n.value);
    case 'comment':
      return comments ? `<!--${n.value}-->` : '';
    case 'pi':
      return `<?${n.target}${n.data ? ' ' + n.data : ''}?>`;
    case 'element': {
      const open = `<${n.name}${n.attrs.map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join('')}`;
      const kids = isMixed(n) ? n.children : n.children.filter((c) => !isBlank(c));
      return kids.length ? `${open}>${kids.map((c) => inline(c, comments)).join('')}</${n.name}>` : `${open}/>`;
    }
  }
}

function pretty(el: El, depth: number, unit: string, comments: boolean, out: string[]) {
  const pad = unit.repeat(depth);
  const kids = el.children.filter((c) => !isBlank(c) && (comments || c.type !== 'comment'));
  if (!kids.length || isMixed(el)) {
    out.push(pad + inline(el, comments));
    return;
  }
  out.push(pad + inline({ ...el, children: [] }, comments).replace(/\/>$/, '>'));
  for (const c of kids) {
    if (c.type === 'element') pretty(c, depth + 1, unit, comments, out);
    else out.push(unit.repeat(depth + 1) + inline(c, comments));
  }
  out.push(`${pad}</${el.name}>`);
}

/** Serialises a parsed document. Text and CDATA are kept exactly; only whitespace between elements changes. */
export function serializeXml(doc: XmlDocument, o: XmlFormatOptions): string {
  const comments = o.comments ?? true;
  if (o.mode === 'minify') return doc.nodes.map((n) => inline(n, comments)).join('');
  const unit = o.indent === 'tab' ? '\t' : ' '.repeat(o.indent ?? 2);
  const out: string[] = [];
  for (const n of doc.nodes) {
    if (n.type === 'element') pretty(n, 0, unit, comments, out);
    else if (n.type !== 'comment' || comments) out.push(inline(n, comments));
  }
  return out.join('\n');
}

export type XmlFormatResult = { ok: true; output: string; notices: string[]; elements: number } | { ok: false; error: TextError };

function countElements(root: El): number {
  let n = 0;
  const stack: El[] = [root];
  while (stack.length) {
    const e = stack.pop()!;
    n++;
    for (const c of e.children) if (c.type === 'element') stack.push(c);
  }
  return n;
}

export function formatXml(text: string, o: XmlFormatOptions): XmlFormatResult {
  const parsed = parseXml(text);
  if (!parsed.ok) return parsed;
  const { doc } = parsed;
  return { ok: true, output: serializeXml(doc, o), notices: doc.notices, elements: countElements(doc.root) };
}

// ---------------------------------------------------------------------------
// XPath
// ---------------------------------------------------------------------------

export interface XPathItem {
  /** Where the node sits, e.g. `/catalog/book[2]/@id`. */
  path: string;
  kind: string;
  text: string;
}

export type XPathOutcome =
  | { ok: true; kind: 'nodes'; items: XPathItem[]; total: number }
  | { ok: true; kind: 'value'; type: 'number' | 'string' | 'boolean'; value: string }
  | { ok: false; message: string };

export const MAX_XPATH_ITEMS = 1000;

/** Parses `prefix=uri` lines. */
export function parseNamespaces(text: string): { map: Map<string, string>; error?: string } {
  const map = new Map<string, string>();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const eq = line.indexOf('=');
    const prefix = line.slice(0, eq).trim();
    const uri = line.slice(eq + 1).trim();
    if (eq < 1 || !/^[A-Za-z_][\w.-]*$/.test(prefix) || !uri) return { map, error: `Namespace line ${i + 1}: write it as prefix=uri.` };
    map.set(prefix, uri);
  }
  return { map };
}

function nameIndex(node: Node, same: (n: Node) => boolean): string {
  let pos = 1;
  let count = 0;
  for (let s = node.parentNode?.firstChild ?? null; s; s = s.nextSibling) {
    if (!same(s)) continue;
    count++;
    if (s === node) pos = count;
  }
  return count > 1 ? `[${pos}]` : '';
}

export function nodePath(node: Node): string {
  if (node.nodeType === 9) return '/';
  const parts: string[] = [];
  for (let n: Node | null = node; n && n.nodeType !== 9; n = n.nodeType === 2 ? (n as Attr).ownerElement : n.parentNode) {
    if (n.nodeType === 2) parts.push(`@${n.nodeName}`);
    else if (n.nodeType === 1) parts.push(n.nodeName + nameIndex(n, (s) => s.nodeType === 1 && s.nodeName === n!.nodeName));
    else if (n.nodeType === 3 || n.nodeType === 4) parts.push('text()' + nameIndex(n, (s) => s.nodeType === 3 || s.nodeType === 4));
    else if (n.nodeType === 8) parts.push('comment()' + nameIndex(n, (s) => s.nodeType === 8));
    else if (n.nodeType === 7) parts.push(`processing-instruction('${n.nodeName}')`);
  }
  return '/' + parts.reverse().join('/');
}

const KINDS: Record<number, string> = { 1: 'element', 2: 'attribute', 3: 'text', 4: 'cdata', 7: 'processing instruction', 8: 'comment' };

/**
 * Runs `expr` against `xml`. The XML is re-serialised from the strict parser first, so the
 * browser never sees a DOCTYPE or entity declaration.
 */
export function runXPath(xml: string, expr: string, ns: ReadonlyMap<string, string>): XPathOutcome {
  const parsed = parseXml(xml);
  if (!parsed.ok) return { ok: false, message: `The XML is not valid: ${parsed.error.message}` };
  const doc = new DOMParser().parseFromString(serializeXml(parsed.doc, { mode: 'minify' }), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) return { ok: false, message: 'The browser could not parse this XML.' };
  const resolver = (prefix: string | null) => (prefix ? (ns.get(prefix) ?? doc.documentElement.lookupNamespaceURI(prefix)) : null);
  try {
    const probe = doc.evaluate(expr, doc, resolver, XPathResult.ANY_TYPE, null);
    if (probe.resultType === XPathResult.NUMBER_TYPE) return { ok: true, kind: 'value', type: 'number', value: String(probe.numberValue) };
    if (probe.resultType === XPathResult.STRING_TYPE) return { ok: true, kind: 'value', type: 'string', value: probe.stringValue };
    if (probe.resultType === XPathResult.BOOLEAN_TYPE) return { ok: true, kind: 'value', type: 'boolean', value: String(probe.booleanValue) };
    const snap = doc.evaluate(expr, doc, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const items: XPathItem[] = [];
    for (let i = 0; i < Math.min(snap.snapshotLength, MAX_XPATH_ITEMS); i++) {
      const n = snap.snapshotItem(i)!;
      const text = (n.nodeType === 8 ? n.nodeValue : n.textContent) ?? '';
      items.push({ path: nodePath(n), kind: KINDS[n.nodeType] ?? 'node', text: text.length > 300 ? text.slice(0, 300) + '…' : text });
    }
    return { ok: true, kind: 'nodes', items, total: snap.snapshotLength };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message.replace(/^Failed to execute 'evaluate' on 'Document': /, '') : 'Invalid XPath expression.' };
  }
}
