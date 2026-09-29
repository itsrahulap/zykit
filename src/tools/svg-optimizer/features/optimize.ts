// SVG optimizer and sanitizer. No SVGO: a handful of conservative passes over our own XML tree.

import { decodeEntities, parseXml, serializeXml, XmlError, type XmlDocument, type XmlElement, type XmlNode } from './xml';
import { formatNumber, isIdentityTransform, roundList, roundPath, roundTransform } from './numbers';

export const MAX_SVG_BYTES = 10 * 1024 * 1024;

export interface SvgOptions {
  /** Remove scripts, event handlers, javascript: links, foreignObject and external references. */
  sanitize: boolean;
  removeComments: boolean;
  /** <metadata>, DOCTYPE, XML declaration. */
  removeMetadata: boolean;
  /** Inkscape, Sodipodi, Sketch, Illustrator and Serif data, data-name, unused namespaces. */
  removeEditorData: boolean;
  /** Empty groups and defs; unwrap groups without attributes. */
  removeEmpty: boolean;
  /** Default attribute values, identity transforms; shorter colours. */
  removeDefaults: boolean;
  removeUnusedIds: boolean;
  roundNumbers: boolean;
  precision: number;
  pretty: boolean;
}

export const DEFAULT_OPTIONS: SvgOptions = {
  sanitize: true,
  removeComments: true,
  removeMetadata: true,
  removeEditorData: true,
  removeEmpty: true,
  removeDefaults: true,
  removeUnusedIds: true,
  roundNumbers: true,
  precision: 3,
  pretty: false,
};

export interface OptimizeResult {
  output: string;
  /** What was removed or changed, e.g. { comments: 3 }. */
  changes: Record<string, number>;
  /** Security-relevant removals (scripts, handlers…). */
  security: string[];
}

/** Editor prefixes removed even when their namespace isn't declared. */
const EDITOR_PREFIXES = ['inkscape', 'sodipodi', 'sketch', 'serif'];
const EDITOR_NS = [
  'inkscape.org/namespaces',
  'sodipodi.sourceforge.net',
  'bohemiancoding.com/sketch',
  'serif.com',
  'ns.adobe.com/AdobeIllustrator',
  'ns.adobe.com/Extensibility',
  'ns.adobe.com/Graphs',
  'ns.adobe.com/AdobeSVGViewerExtensions',
  'ns.adobe.com/SaveForWeb',
  'ns.adobe.com/Variables',
  'ns.adobe.com/ImageReplacement',
  'ns.adobe.com/Flows',
  'ns.adobe.com/GenericCustomNamespace',
  'ns.adobe.com/XPath',
  'boxy-svg.com',
  'krita.org',
  'vectornator.io',
];

const DANGEROUS_ELEMENTS = new Set(['script', 'foreignObject', 'iframe', 'embed', 'object', 'applet', 'meta', 'link', 'base', 'handler', 'listener', 'frame', 'frameset']);
const ANIMATION = new Set(['set', 'animate', 'animateTransform', 'animateMotion', 'animateColor']);
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp|avif|bmp);/;
const REF_ATTRS = new Set(['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-flowto', 'aria-details', 'aria-errormessage', 'for']);
const TEXT_CONTENT = new Set(['text', 'tspan', 'textPath', 'title', 'desc', 'style', 'script']);
/** Containers whose children may be styled by whatever references them (<use>), so inherited defaults can't be dropped. */
const REFERENCED = new Set(['defs', 'symbol', 'clipPath', 'mask', 'pattern', 'marker']);

const NUMERIC_ATTRS = new Set([
  'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'fx', 'fy', 'fr', 'dx', 'dy',
  'stroke-width', 'stroke-dashoffset', 'stroke-miterlimit', 'opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'flood-opacity',
  'offset', 'font-size', 'letter-spacing', 'word-spacing', 'refX', 'refY', 'markerWidth', 'markerHeight', 'stdDeviation', 'rotate', 'pathLength',
  'k1', 'k2', 'k3', 'k4', 'scale', 'radius', 'startOffset', 'textLength', 'surfaceScale', 'specularConstant', 'specularExponent', 'diffuseConstant',
]);
const LIST_ATTRS = new Set(['viewBox', 'points', 'stroke-dasharray']);
const COLOR_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color']);

/** Inherited presentation attributes and their initial values. */
const INHERITED_DEFAULTS: Record<string, string[]> = {
  'fill-opacity': ['1'],
  'stroke-opacity': ['1'],
  'stroke-width': ['1', '1px'],
  'stroke-miterlimit': ['4'],
  'stroke-dasharray': ['none'],
  'stroke-dashoffset': ['0'],
  'stroke-linecap': ['butt'],
  'stroke-linejoin': ['miter'],
  'fill-rule': ['nonzero'],
  'clip-rule': ['nonzero'],
  visibility: ['visible'],
  stroke: ['none'],
};
/** Non-inherited attributes whose value is the default on these elements. */
const ELEMENT_DEFAULTS: Record<string, Record<string, string[]>> = {
  svg: { x: ['0', '0px'], y: ['0', '0px'], version: ['1.1', '1.0'], baseProfile: ['full', 'tiny', 'basic'], preserveAspectRatio: ['xMidYMid meet'] },
  rect: { x: ['0'], y: ['0'] },
  image: { x: ['0'], y: ['0'] },
  use: { x: ['0'], y: ['0'] },
  circle: { cx: ['0'], cy: ['0'] },
  ellipse: { cx: ['0'], cy: ['0'] },
  line: { x1: ['0'], y1: ['0'], x2: ['0'], y2: ['0'] },
  linearGradient: { x1: ['0', '0%'], y1: ['0', '0%'], x2: ['100%'], y2: ['0', '0%'] },
  radialGradient: { cx: ['50%'], cy: ['50%'], r: ['50%'] },
  stop: { 'stop-opacity': ['1'], 'stop-color': ['#000', 'black'] },
};

const localName = (n: string) => n.slice(n.indexOf(':') + 1);
const prefixOf = (n: string) => (n.includes(':') ? n.slice(0, n.indexOf(':')) : '');
const getAttr = (el: XmlElement, name: string) => el.attrs.find((a) => a.name === name)?.value;
const elements = (nodes: XmlNode[]) => nodes.filter((n): n is XmlElement => n.type === 'element');

function walk(nodes: XmlNode[], fn: (el: XmlElement, parents: XmlElement[]) => void, parents: XmlElement[] = []) {
  for (const n of nodes) {
    if (n.type !== 'element') continue;
    fn(n, parents);
    walk(n.children, fn, [...parents, n]);
  }
}

/** Remove child nodes matching `pred` everywhere; returns how many were removed. */
function prune(nodes: XmlNode[], pred: (n: XmlNode, parent: XmlElement | null) => boolean, parent: XmlElement | null = null): number {
  let count = 0;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (pred(n, parent)) {
      nodes.splice(i, 1);
      count++;
    } else if (n.type === 'element') count += prune(n.children, pred, n);
  }
  return count;
}

/** Canonical form for checking a URL scheme: entities decoded, control characters and whitespace removed. */
function schemeOf(raw: string): string {
  // oxlint-disable-next-line no-control-regex
  return decodeEntities(raw).replace(/[\u0000- \u007f-\u009f]+/g, '').toLowerCase();
}

const UNSAFE_CSS = /@import|javascript:|vbscript:|expression\s*\(|-moz-binding|behavior\s*:|url\s*\(\s*["']?\s*(?!#|data:image\/(png|jpe?g|gif|webp))[^)]/i;

function sanitize(doc: XmlDocument, security: string[]) {
  const counts = new Map<string, number>();
  const note = (what: string) => counts.set(what, (counts.get(what) ?? 0) + 1);

  prune(doc.children, (n) => {
    if (n.type !== 'element') return false;
    const local = localName(n.name);
    if (DANGEROUS_ELEMENTS.has(local) || prefixOf(n.name) === 'html' || prefixOf(n.name) === 'xhtml') {
      note(`<${local}> element`);
      return true;
    }
    if (ANIMATION.has(local)) {
      const target = decodeEntities(getAttr(n, 'attributeName') ?? '').trim().toLowerCase();
      const values = ['to', 'from', 'values', 'by'].map((k) => schemeOf(getAttr(n, k) ?? '')).join(' ');
      if (target.endsWith('href') || target.startsWith('on') || /javascript:|vbscript:|data:/.test(values)) {
        note(`<${local}> that changes ${target || 'a link'}`);
        return true;
      }
    }
    if (local === 'style') {
      const css = n.children.map((c) => (c.type === 'text' || c.type === 'cdata' ? c.value : '')).join('');
      if (UNSAFE_CSS.test(decodeEntities(css))) {
        note('<style> with imports, external URLs or script');
        return true;
      }
    }
    return false;
  });

  walk(doc.children, (el) => {
    const local = localName(el.name);
    el.attrs = el.attrs.filter((a) => {
      const name = localName(a.name).toLowerCase();
      if (name.startsWith('on')) {
        note(`${localName(a.name)} event handler`);
        return false;
      }
      if (name === 'href' || a.name === 'xml:base') {
        const v = schemeOf(a.value);
        if (/^(javascript|vbscript|livescript|mocha):/.test(v) || (v.startsWith('data:') && !SAFE_DATA_IMAGE.test(v))) {
          note(`${v.slice(0, v.indexOf(':') + 1)} link`);
          return false;
        }
        // Remote references from <use>, <image>, filters… would load (or track) over the network.
        if (local !== 'a' && /^([a-z][a-z0-9+.-]*:|\/\/)/.test(v) && !v.startsWith('data:')) {
          note('external resource reference');
          return false;
        }
      }
      if (name === 'style' && UNSAFE_CSS.test(decodeEntities(a.value))) {
        note('style attribute with a URL or script');
        return false;
      }
      return true;
    });
  });
  for (const [what, n] of counts) security.push(`Removed ${what}${n > 1 ? ` (×${n})` : ''}`);
}

function isEditorName(name: string, editorPrefixes: Set<string>) {
  const p = prefixOf(name);
  return p !== '' && p !== 'xmlns' && editorPrefixes.has(p);
}

function removeEditorData(doc: XmlDocument, bump: (k: string, n?: number) => void) {
  // Prefixes bound to editor namespaces (by URI), plus well-known editor prefix names.
  const editor = new Set<string>();
  walk(doc.children, (el) => {
    for (const a of el.attrs) {
      if (!a.name.startsWith('xmlns:')) continue;
      const prefix = a.name.slice(6);
      const uri = decodeEntities(a.value);
      if (EDITOR_NS.some((ns) => uri.includes(ns))) editor.add(prefix);
    }
  });
  for (const p of EDITOR_PREFIXES) editor.add(p);

  bump('editor elements', prune(doc.children, (n) => n.type === 'element' && isEditorName(n.name, editor)));
  walk(doc.children, (el) => {
    const before = el.attrs.length;
    el.attrs = el.attrs.filter(
      (a) =>
        !isEditorName(a.name, editor) &&
        !(a.name.startsWith('xmlns:') && editor.has(a.name.slice(6))) &&
        a.name !== 'data-name' &&
        a.name !== 'enable-background' &&
        !(a.name === 'style' && /^\s*enable-background:[^;]*;?\s*$/.test(a.value)),
    );
    bump('editor attributes', before - el.attrs.length);
  });
}

/** Drop xmlns:foo declarations whose prefix isn't used by any element or attribute. */
function removeUnusedNamespaces(doc: XmlDocument, bump: (k: string, n?: number) => void) {
  const used = new Set<string>();
  walk(doc.children, (el) => {
    used.add(prefixOf(el.name));
    for (const a of el.attrs) if (!a.name.startsWith('xmlns')) used.add(prefixOf(a.name));
  });
  walk(doc.children, (el) => {
    const before = el.attrs.length;
    el.attrs = el.attrs.filter((a) => !a.name.startsWith('xmlns:') || used.has(a.name.slice(6)));
    bump('unused namespaces', before - el.attrs.length);
  });
}

function removeEmpty(doc: XmlDocument, bump: (k: string, n?: number) => void) {
  const containerEmpty = (n: XmlNode) =>
    n.type === 'element' &&
    (n.name === 'g' || n.name === 'defs') &&
    n.children.every((c) => c.type === 'text' && !c.value.trim());
  for (let pass = 0; pass < 20; pass++) {
    const removed = prune(doc.children, containerEmpty);
    // Unwrap <g> with no attributes: its children render the same without it.
    let unwrapped = 0;
    const unwrap = (nodes: XmlNode[], parent: XmlElement | null) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.type !== 'element') continue;
        unwrap(n.children, n);
        if (n.name === 'g' && !n.attrs.length && parent && parent.name !== 'switch') {
          nodes.splice(i, 1, ...n.children);
          i += n.children.length - 1;
          unwrapped++;
        }
      }
    };
    unwrap(doc.children, null);
    bump('empty groups', removed);
    bump('groups unwrapped', unwrapped);
    if (!removed && !unwrapped) break;
  }
}

function removeUnusedIds(doc: XmlDocument, bump: (k: string, n?: number) => void) {
  const refs = new Set<string>();
  let scriptText = '';
  walk(doc.children, (el) => {
    if (el.name === 'style' || el.name === 'script') scriptText += el.children.map((c) => ('value' in c ? c.value : '')).join('');
    for (const a of el.attrs) {
      const v = decodeEntities(a.value);
      for (const m of v.matchAll(/url\(\s*["']?#([^"')\s]+)/g)) refs.add(m[1]);
      if (localName(a.name) === 'href' && v.startsWith('#')) refs.add(v.slice(1));
      if (REF_ATTRS.has(a.name)) v.split(/\s+/).forEach((id) => refs.add(id));
      if (a.name === 'begin' || a.name === 'end') for (const m of v.matchAll(/([\w:-]+)\.(begin|end|click|repeat)/g)) refs.add(m[1]);
    }
  });
  walk(doc.children, (el, parents) => {
    const id = getAttr(el, 'id');
    if (id === undefined) return;
    const decoded = decodeEntities(id);
    // Keep ids that are referenced, used by CSS/JS, or that other files may point at (sprites, views).
    if (refs.has(decoded) || (scriptText && scriptText.includes(decoded)) || el.name === 'symbol' || el.name === 'view' || (parents.length === 0 && el.name === 'svg')) return;
    el.attrs = el.attrs.filter((a) => a.name !== 'id');
    bump('unused ids');
  });
}

function shortColor(v: string): string {
  const m = /^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i.exec(v);
  return (m ? `#${m[1]}${m[2]}${m[3]}` : v).toLowerCase();
}

function cleanAttributes(doc: XmlDocument, o: SvgOptions, bump: (k: string, n?: number) => void) {
  const hasStylesheet = (() => {
    let found = false;
    walk(doc.children, (el) => (found ||= el.name === 'style'));
    return found;
  })();
  const hasText = (() => {
    let found = false;
    walk(doc.children, (el) => (found ||= el.name === 'text' || el.name === 'tspan' || el.name === 'textPath'));
    return found;
  })();

  walk(doc.children, (el, parents) => {
    const inReferenced = parents.some((p) => REFERENCED.has(p.name));
    const next: typeof el.attrs = [];
    for (const a of el.attrs) {
      let v = a.value;
      const trimmed = v.trim();
      if (o.removeDefaults) {
        if (a.name === 'style') {
          const canDropInherited = !hasStylesheet && !inReferenced && el.name !== 'use';
          v = cleanStyle(trimmed, o, (prop) => canDropInherited && !parents.some((p) => getAttr(p, prop) !== undefined || (getAttr(p, 'style') ?? '').includes(prop)));
          if (v !== trimmed) bump('style declarations');
          if (!v) {
            bump('default values');
            continue;
          }
        }
        if (a.name === 'transform' && isIdentityTransform(trimmed)) {
          bump('identity transforms');
          continue;
        }
        if (a.name === 'xml:space' && !hasText) {
          bump('default values');
          continue;
        }
        const own = ELEMENT_DEFAULTS[el.name]?.[a.name];
        if (own?.includes(trimmed)) {
          bump('default values');
          continue;
        }
        if (a.name === 'opacity' && trimmed === '1') {
          bump('default values');
          continue;
        }
        const inherited = INHERITED_DEFAULTS[a.name];
        if (
          inherited?.includes(trimmed) &&
          !hasStylesheet &&
          !inReferenced &&
          el.name !== 'use' &&
          !parents.some((p) => getAttr(p, a.name) !== undefined || (getAttr(p, 'style') ?? '').includes(a.name))
        ) {
          bump('default values');
          continue;
        }
        if (COLOR_ATTRS.has(a.name) && /^#[0-9a-f]{3,8}$/i.test(trimmed)) v = shortColor(trimmed);
      }
      if (o.roundNumbers) {
        const p = o.precision;
        if (a.name === 'd') v = roundPath(v, p) ?? v;
        else if (LIST_ATTRS.has(a.name)) v = roundList(v, p) ?? v;
        else if (a.name === 'transform' || a.name === 'gradientTransform' || a.name === 'patternTransform') v = roundTransform(v, Math.min(8, p + 2));
        else if (NUMERIC_ATTRS.has(a.name)) {
          const m = /^\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(px|%|em|ex|pt|pc|mm|cm|in)?\s*$/i.exec(v);
          if (m) v = formatNumber(Number(m[1]), p) + (m[2] && m[2].toLowerCase() !== 'px' ? m[2] : '');
        }
      }
      next.push(v === a.value ? a : { name: a.name, value: v });
    }
    el.attrs = next;
  });
}

/**
 * Clean a style attribute: drop default declarations (inherited ones only when `canDrop` allows),
 * shorten colours, round numbers. Leaves anything it doesn't understand (quotes, url(), !important) alone.
 */
function cleanStyle(style: string, o: SvgOptions, canDrop: (prop: string) => boolean): string {
  const compact = style.replace(/\s*;\s*/g, ';').replace(/\s*:\s*/g, ':').replace(/;+$/, '').replace(/^;+/, '');
  if (!o.removeDefaults || /["'\\]|url\((?!#[\w.:-]+\))|!important|\/\*/i.test(compact)) return compact;
  const out: string[] = [];
  for (const decl of compact.split(';')) {
    const c = decl.indexOf(':');
    if (c <= 0) return compact;
    const prop = decl.slice(0, c).trim().toLowerCase();
    let value = decl.slice(c + 1).trim();
    if ((prop === 'opacity' || prop === 'stop-opacity') && value === '1') continue;
    if (INHERITED_DEFAULTS[prop]?.includes(value) && canDrop(prop)) continue;
    if (COLOR_ATTRS.has(prop) && /^#[0-9a-f]{3,8}$/i.test(value)) value = shortColor(value);
    if (o.roundNumbers && NUMERIC_ATTRS.has(prop)) {
      const m = /^([-+]?(?:\d+\.?\d*|\.\d+))(px)?$/i.exec(value);
      if (m) value = formatNumber(Number(m[1]), o.precision) + (m[2] ? 'px' : '');
    }
    out.push(`${prop}:${value}`);
  }
  return out.join(';');
}

/** Remove whitespace-only text between elements, except inside text content (where it can render). */
function collapseWhitespace(nodes: XmlNode[], keep: boolean) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.type === 'text' && !keep && !n.value.trim()) nodes.splice(i, 1);
    else if (n.type === 'element') collapseWhitespace(n.children, keep || TEXT_CONTENT.has(n.name));
  }
}

/** Parse, clean and serialize an SVG. Throws XmlError (with line/column) for malformed input. */
export function optimizeSvg(src: string, o: SvgOptions = DEFAULT_OPTIONS): OptimizeResult {
  if (src.length > MAX_SVG_BYTES) throw new XmlError({ message: 'SVGs up to 10 MB are supported.', line: 1, column: 1, offset: 0 });
  const doc = parseXml(src);
  const root = elements(doc.children);
  if (root.length !== 1 || localName(root[0].name) !== 'svg')
    throw new XmlError({ message: root.length > 1 ? 'An SVG must have a single root <svg> element.' : "This isn't an SVG: the root element must be <svg>.", line: 1, column: 1, offset: 0 });

  const changes: Record<string, number> = {};
  const bump = (k: string, n = 1) => n > 0 && (changes[k] = (changes[k] ?? 0) + n);
  const security: string[] = [];

  if (o.sanitize) sanitize(doc, security);
  if (o.removeComments) bump('comments', prune(doc.children, (n) => n.type === 'comment'));
  if (o.removeMetadata) {
    bump('metadata', prune(doc.children, (n) => (n.type === 'element' && localName(n.name) === 'metadata') || n.type === 'doctype' || (n.type === 'pi' && /^xml\s/i.test(n.value))));
    // Top-level text (whitespace, stray newlines) outside the root element.
    doc.children = doc.children.filter((n) => n.type !== 'text');
  }
  if (o.removeEditorData) {
    removeEditorData(doc, bump);
    removeUnusedNamespaces(doc, bump);
  }
  if (o.removeUnusedIds) removeUnusedIds(doc, bump);
  cleanAttributes(doc, o, bump);
  collapseWhitespace(doc.children, false);
  if (o.removeEmpty) removeEmpty(doc, bump);
  if (!o.pretty) doc.children = doc.children.filter((n) => n.type !== 'text');

  return { output: serializeXml(doc, o.pretty) + (o.pretty ? '\n' : ''), changes, security };
}

export { XmlError };
