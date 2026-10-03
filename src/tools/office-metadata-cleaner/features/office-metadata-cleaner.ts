// Pure logic for Office Metadata Cleaner: reads and blanks the metadata of OOXML (.docx, .xlsx,
// .pptx) and OpenDocument (.odt, .ods, .odp) files. No DOM, so it's unit-testable in Node.
// Untouched parts are copied byte for byte; changed parts are rewritten with their values removed.

import { decodeEntities, findAll, parseXml, textOf, XmlError, type XNode } from './xml';
import { openZip, rawData, readEntry, readText, textEntry, writeZip, ZIP_LIMITS, ZipError, type OutEntry, type ZipArchive } from './zip-archive';

export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
export const MAX_FILES = 50;
const MAX_SLIDES = 1000;

export type OfficeFormat = 'docx' | 'xlsx' | 'pptx' | 'odt' | 'ods' | 'odp';
export const ACCEPT = '.docx,.xlsx,.pptx,.odt,.ods,.odp,.docm,.xlsm,.pptm';

export class OfficeError extends Error {
  code: 'unsupported' | 'unreadable' | 'encrypted';
  constructor(code: OfficeError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export type Group = 'authors' | 'dates' | 'details' | 'company' | 'application';
export type FieldKind = 'person' | 'software' | 'date' | 'text';

export interface MetaField {
  /** Part the value came from: `core`, `app` or `meta`. */
  part: 'core' | 'app' | 'meta';
  key: string;
  label: string;
  value: string;
  kind: FieldKind;
  group: Group;
}

export interface OfficeReport {
  format: OfficeFormat;
  fields: MetaField[];
  custom: { name: string; value: string }[];
  comments: number;
  trackedChanges: number;
  /** People named on comments, tracked changes and reviewers lists. */
  reviewers: string[];
  hiddenItems: string[];
  thumbnail: { name: string; bytes: number } | null;
  hasMacros: boolean;
  externalLinks: number;
  printerSettings: boolean;
  parts: number;
}

export interface OfficeOptions {
  authors: boolean;
  dates: boolean;
  details: boolean;
  company: boolean;
  application: boolean;
  custom: boolean;
  thumbnail: boolean;
  reviewers: boolean;
}

export const DEFAULT_OPTIONS: OfficeOptions = { authors: true, dates: true, details: false, company: true, application: true, custom: true, thumbnail: true, reviewers: true };

/** Replacement for removed reviewer names. */
export const GENERIC_AUTHOR = 'Author';

/* ---------------------------------------------------------------- tables */

interface FieldDef {
  part: MetaField['part'];
  local: string;
  label: string;
  kind: FieldKind;
  group: Group;
}
const def = (part: FieldDef['part'], local: string, label: string, kind: FieldKind, group: Group): FieldDef => ({ part, local, label, kind, group });

const OOXML_FIELDS: FieldDef[] = [
  def('core', 'creator', 'Author', 'person', 'authors'),
  def('core', 'lastModifiedBy', 'Last modified by', 'person', 'authors'),
  def('core', 'created', 'Created', 'date', 'dates'),
  def('core', 'modified', 'Modified', 'date', 'dates'),
  def('core', 'lastPrinted', 'Last printed', 'date', 'dates'),
  def('core', 'revision', 'Revision', 'text', 'dates'),
  def('core', 'title', 'Title', 'text', 'details'),
  def('core', 'subject', 'Subject', 'text', 'details'),
  def('core', 'keywords', 'Keywords', 'text', 'details'),
  def('core', 'description', 'Comments', 'text', 'details'),
  def('core', 'category', 'Category', 'text', 'details'),
  def('core', 'contentStatus', 'Status', 'text', 'details'),
  def('app', 'Company', 'Company', 'person', 'company'),
  def('app', 'Manager', 'Manager', 'person', 'company'),
  def('app', 'HyperlinkBase', 'Hyperlink base', 'text', 'company'),
  def('app', 'Application', 'Application', 'software', 'application'),
  def('app', 'AppVersion', 'Application version', 'software', 'application'),
  def('app', 'Template', 'Template', 'software', 'application'),
  def('app', 'TotalTime', 'Total editing time (min)', 'date', 'dates'),
];

const ODF_FIELDS: FieldDef[] = [
  def('meta', 'initial-creator', 'Author', 'person', 'authors'),
  def('meta', 'creator', 'Last modified by', 'person', 'authors'),
  def('meta', 'printed-by', 'Printed by', 'person', 'authors'),
  def('meta', 'creation-date', 'Created', 'date', 'dates'),
  def('meta', 'date', 'Modified', 'date', 'dates'),
  def('meta', 'print-date', 'Last printed', 'date', 'dates'),
  def('meta', 'editing-cycles', 'Editing cycles', 'text', 'dates'),
  def('meta', 'editing-duration', 'Editing duration', 'date', 'dates'),
  def('meta', 'title', 'Title', 'text', 'details'),
  def('meta', 'subject', 'Subject', 'text', 'details'),
  def('meta', 'description', 'Comments', 'text', 'details'),
  def('meta', 'keyword', 'Keywords', 'text', 'details'),
  def('meta', 'generator', 'Application', 'software', 'application'),
];

const ODF_MIME: Record<string, OfficeFormat> = {
  'application/vnd.oasis.opendocument.text': 'odt',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/vnd.oasis.opendocument.presentation': 'odp',
};

const isOdf = (f: OfficeFormat) => f === 'odt' || f === 'ods' || f === 'odp';

export const FORMAT_LABEL: Record<OfficeFormat, string> = { docx: 'Word', xlsx: 'Excel', pptx: 'PowerPoint', odt: 'Writer', ods: 'Calc', odp: 'Impress' };

/* ---------------------------------------------------------------- helpers */

const names = (zip: ZipArchive) => zip.entries.map((e) => e.name);
const has = (zip: ZipArchive, name: string) => zip.entries.some((e) => e.name === name);
const entry = (zip: ZipArchive, name: string) => zip.entries.find((e) => e.name === name);

export async function detectFormat(zip: ZipArchive): Promise<OfficeFormat> {
  if (has(zip, 'mimetype')) {
    const mime = (await readText(zip, 'mimetype', 1024))?.trim() ?? '';
    const f = ODF_MIME[mime];
    if (f) return f;
  }
  if (has(zip, '[Content_Types].xml')) {
    if (has(zip, 'word/document.xml')) return 'docx';
    if (has(zip, 'xl/workbook.xml')) return 'xlsx';
    if (has(zip, 'ppt/presentation.xml')) return 'pptx';
  }
  throw new OfficeError('unsupported', "This file is a ZIP, but not a Word, Excel, PowerPoint or OpenDocument file.");
}

function safeParse(xml: string | null): XNode | null {
  if (!xml) return null;
  try {
    return parseXml(xml);
  } catch (err) {
    if (err instanceof XmlError) return null;
    throw err;
  }
}

const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];

/** Regex that matches an element (prefix optional) with its content, or a self-closing one. */
const elementRe = (local: string) => new RegExp(`<((?:[\\w.-]+:)?${local})\\b(?:[^>]*?/>|[^>]*>[\\s\\S]*?</\\1>)`, 'g');
const attrValues = (xml: string, attr: string) => [...xml.matchAll(new RegExp(`\\b${attr}="([^"]*)"`, 'g'))].map((m) => m[1]);
const count = (xml: string, re: RegExp) => (xml.match(re) ?? []).length;

const decode = decodeEntities;

async function readParts(zip: ZipArchive, match: (n: string) => boolean, cap = ZIP_LIMITS.maxPartBytes): Promise<{ name: string; text: string }[]> {
  const out: { name: string; text: string }[] = [];
  for (const e of zip.entries) if (match(e.name) && !e.name.endsWith('/')) out.push({ name: e.name, text: new TextDecoder().decode(await readEntry(zip, e, cap)) });
  return out;
}

/* ---------------------------------------------------------------- reading */

function collectFields(root: XNode | null, part: FieldDef['part'], defs: FieldDef[]): MetaField[] {
  if (!root) return [];
  const out: MetaField[] = [];
  for (const d of defs) {
    if (d.part !== part) continue;
    // Direct children only (ODF puts <office:meta> inside the root; OOXML core/app are flat).
    const holder = part === 'meta' ? root.children.find((c) => c.local === 'meta') ?? root : root;
    for (const c of holder.children) {
      if (c.local !== d.local) continue;
      const value = textOf(c);
      if (value) out.push({ part, key: d.local, label: d.label, value, kind: d.kind, group: d.group });
    }
  }
  return out;
}

export async function inspectZip(zip: ZipArchive): Promise<OfficeReport> {
  const format = await detectFormat(zip);
  const fields: MetaField[] = [];
  const custom: { name: string; value: string }[] = [];
  let comments = 0;
  let trackedChanges = 0;
  const reviewers: string[] = [];
  const hiddenItems: string[] = [];
  const all = names(zip);

  if (!isOdf(format)) {
    fields.push(...collectFields(safeParse(await readText(zip, 'docProps/core.xml')), 'core', OOXML_FIELDS));
    fields.push(...collectFields(safeParse(await readText(zip, 'docProps/app.xml')), 'app', OOXML_FIELDS));
    const customRoot = safeParse(await readText(zip, 'docProps/custom.xml'));
    if (customRoot) for (const p of customRoot.children.filter((c) => c.local === 'property')) custom.push({ name: p.attrs.name ?? '', value: textOf(p) });

    if (format === 'docx') {
      const parts = await readParts(zip, (n) => /^word\/(document|comments|footnotes|endnotes|people|header\d*|footer\d*)\.xml$/.test(n));
      for (const { name, text } of parts) {
        if (name === 'word/comments.xml') comments += count(text, /<w:comment\b/g);
        if (/^word\/(document|footnotes|endnotes)\.xml$/.test(name)) trackedChanges += count(text, /<w:(ins|del|moveFrom|moveTo|rPrChange|pPrChange)\s/g);
        reviewers.push(...attrValues(text, 'w:author'), ...attrValues(text, 'w15:author'));
      }
    } else if (format === 'xlsx') {
      const wb = await readText(zip, 'xl/workbook.xml');
      if (wb) for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
        const state = /\bstate="(hidden|veryHidden)"/.exec(m[1]);
        if (state) hiddenItems.push(`Sheet "${decode(/\bname="([^"]*)"/.exec(m[1])?.[1] ?? '?')}" (${state[1] === 'veryHidden' ? 'very hidden' : 'hidden'})`);
      }
      for (const { name, text } of await readParts(zip, (n) => /^xl\/(comments\d*\.xml|threadedComments\/[^/]+\.xml|persons\/person\.xml)$/.test(n))) {
        if (/comments\d*\.xml$/.test(name) && !name.includes('threaded')) comments += count(text, /<comment\b/g);
        if (name.includes('threadedComments')) comments += count(text, /<threadedComment\b/g);
        reviewers.push(...[...text.matchAll(/<author>([^<]*)<\/author>/g)].map((m) => decode(m[1])), ...attrValues(text, 'displayName'));
      }
      trackedChanges += all.filter((n) => n.startsWith('xl/revisions/')).length;
    } else {
      const slides = all.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(/\d+/.exec(a)![0], 10) - parseInt(/\d+/.exec(b)![0], 10)).slice(0, MAX_SLIDES);
      for (const s of slides) {
        const head = new TextDecoder().decode(await readEntry(zip, entry(zip, s)!));
        if (/<p:sld\b[^>]*\bshow="0"/.test(head.slice(0, 4096))) hiddenItems.push(`Slide ${/\d+/.exec(s)![0]} (hidden)`);
      }
      for (const { name, text } of await readParts(zip, (n) => /^ppt\/(comments\/[^/]+\.xml|commentAuthors\.xml|authors\.xml)$/.test(n))) {
        if (name.startsWith('ppt/comments/')) comments += count(text, /<p(?:188)?:cm\b/g);
        else reviewers.push(...attrValues(text, 'name'));
      }
    }
  } else {
    const meta = safeParse(await readText(zip, 'meta.xml'));
    fields.push(...collectFields(meta, 'meta', ODF_FIELDS));
    if (meta) for (const u of findAll(meta, 'user-defined')) custom.push({ name: u.attrs['meta:name'] ?? '', value: textOf(u) });
    const content = await readText(zip, 'content.xml', ZIP_LIMITS.maxPartBytes);
    if (content) {
      comments += count(content, /<office:annotation\b/g);
      trackedChanges += count(content, /<text:changed-region\b/g);
      reviewers.push(...[...content.matchAll(/<dc:creator>([^<]*)<\/dc:creator>/g)].map((m) => decode(m[1])));
    }
  }

  const thumb = zip.entries.find((e) => /^(docProps\/thumbnail\.[a-z]+|Thumbnails\/thumbnail\.[a-z]+)$/i.test(e.name));
  return {
    format,
    fields,
    custom,
    comments,
    trackedChanges,
    reviewers: uniq(reviewers),
    hiddenItems,
    thumbnail: thumb ? { name: thumb.name, bytes: thumb.size } : null,
    hasMacros: all.some((n) => /vbaProject\.bin$/i.test(n)),
    externalLinks: all.filter((n) => /^xl\/externalLinks\/[^/]+\.xml$/.test(n)).length,
    printerSettings: all.some((n) => /\/printerSettings\//i.test(n)),
    parts: zip.entries.length,
  };
}

export async function inspectOffice(bytes: Uint8Array): Promise<OfficeReport> {
  try {
    return await inspectZip(openZip(bytes));
  } catch (err) {
    throw toOfficeError(err);
  }
}

function toOfficeError(err: unknown): unknown {
  if (err instanceof ZipError) {
    if (err.code === 'encrypted') return new OfficeError('encrypted', err.message);
    if (err.code === 'not-zip') return new OfficeError('unsupported', "This isn't an Office document. Add a .docx, .xlsx, .pptx, .odt, .ods or .odp file.");
    return new OfficeError('unreadable', err.message);
  }
  return err;
}

/* ---------------------------------------------------------------- cleaning */

const REMOVE: Record<Group, { core: string[]; app: string[]; meta: string[] }> = {
  authors: { core: ['creator', 'lastModifiedBy'], app: [], meta: ['initial-creator', 'creator', 'printed-by'] },
  dates: { core: ['created', 'modified', 'lastPrinted', 'revision'], app: ['TotalTime'], meta: ['creation-date', 'date', 'print-date', 'editing-cycles', 'editing-duration'] },
  details: { core: ['title', 'subject', 'keywords', 'description', 'category', 'contentStatus'], app: [], meta: ['title', 'subject', 'description', 'keyword'] },
  company: { core: [], app: ['Company', 'Manager', 'HyperlinkBase'], meta: [] },
  application: { core: [], app: ['Application', 'AppVersion', 'Template'], meta: ['generator'] },
};

/** Removes the named elements (any prefix) from a metadata part. */
export function removeElements(xml: string, locals: string[]): string {
  let out = xml;
  for (const l of locals) out = out.replace(elementRe(l), '');
  return out;
}

function groupsOf(opts: OfficeOptions): Group[] {
  return (['authors', 'dates', 'details', 'company', 'application'] as Group[]).filter((g) => opts[g]);
}

const anonymise = (xml: string, attr: string, to: string) => xml.replace(new RegExp(`(\\b${attr}=")[^"]*(")`, 'g'), `$1${to}$2`);

/** Rewrites one part for the options; returns the same string when nothing applies. */
export function editPart(name: string, xml: string, format: OfficeFormat, opts: OfficeOptions): string {
  let out = xml;
  const groups = groupsOf(opts);
  if (name === 'docProps/core.xml') out = removeElements(out, groups.flatMap((g) => REMOVE[g].core));
  else if (name === 'docProps/app.xml') out = removeElements(out, groups.flatMap((g) => REMOVE[g].app));
  else if (name === 'docProps/custom.xml' && opts.custom) out = removeElements(out, ['property']);
  else if (name === 'meta.xml') {
    out = removeElements(out, groups.flatMap((g) => REMOVE[g].meta));
    if (opts.custom) out = removeElements(out, ['user-defined']);
  } else if (name === 'META-INF/manifest.xml' && opts.thumbnail) out = out.replace(/<manifest:file-entry\b[^>]*manifest:full-path="Thumbnails\/[^"]*"[^>]*?(?:\/>|>[\s\S]*?<\/manifest:file-entry>)/g, '');
  else if (name === '_rels/.rels' && opts.thumbnail) out = out.replace(/<Relationship\b[^>]*(?:thumbnail)[^>]*?(?:\/>|>\s*<\/Relationship>)/gi, '');
  else if (opts.reviewers) {
    if (format === 'docx' && /^word\/[^/]+\.xml$/.test(name)) {
      if (name === 'word/people.xml') {
        out = anonymise(out, 'w15:author', GENERIC_AUTHOR);
        out = anonymise(out, 'w15:userId', GENERIC_AUTHOR);
        out = anonymise(out, 'w15:providerId', 'None');
      } else {
        out = anonymise(out, 'w:author', GENERIC_AUTHOR);
        out = anonymise(out, 'w:initials', 'A');
        out = out.replace(/\sw:date="[^"]*"/g, '');
      }
    } else if (format === 'xlsx' && /^xl\/(comments\d*\.xml|persons\/person\.xml|threadedComments\/[^/]+\.xml)$/.test(name)) {
      out = out.replace(/<author>[^<]*<\/author>/g, `<author>${GENERIC_AUTHOR}</author>`);
      out = anonymise(out, 'displayName', GENERIC_AUTHOR);
      out = anonymise(out, 'userId', GENERIC_AUTHOR);
      out = anonymise(out, 'providerId', 'None');
    } else if (format === 'pptx' && /^ppt\/(commentAuthors|authors)\.xml$/.test(name)) {
      out = anonymise(out, 'name', GENERIC_AUTHOR);
      out = anonymise(out, 'initials', 'A');
      out = anonymise(out, 'userId', GENERIC_AUTHOR);
      out = anonymise(out, 'providerId', 'None');
    } else if (isOdf(format) && name === 'content.xml') {
      out = out.replace(/<dc:creator>[^<]*<\/dc:creator>/g, `<dc:creator>${GENERIC_AUTHOR}</dc:creator>`);
      out = out.replace(/<dc:date>[^<]*<\/dc:date>/g, '');
    }
  }
  return out;
}

function wantsEdit(name: string, format: OfficeFormat, opts: OfficeOptions): boolean {
  if (name === 'docProps/core.xml' || name === 'docProps/app.xml' || name === 'meta.xml') return true;
  if (name === 'docProps/custom.xml') return opts.custom;
  if (name === 'META-INF/manifest.xml' || name === '_rels/.rels') return opts.thumbnail;
  if (!opts.reviewers) return false;
  if (format === 'docx') return /^word\/[^/]+\.xml$/.test(name);
  if (format === 'xlsx') return /^xl\/(comments\d*\.xml|persons\/person\.xml|threadedComments\/[^/]+\.xml)$/.test(name);
  if (format === 'pptx') return /^ppt\/(commentAuthors|authors)\.xml$/.test(name);
  return name === 'content.xml';
}

export interface CleanResult {
  bytes: Uint8Array;
  before: OfficeReport;
  after: OfficeReport;
  /** Anything the options asked to remove that is still in the output. */
  left: string[];
  changedParts: string[];
}

export async function cleanOffice(bytes: Uint8Array, opts: OfficeOptions): Promise<CleanResult> {
  try {
    const zip = openZip(bytes);
    const before = await inspectZip(zip);
    const format = before.format;
    const out: OutEntry[] = [];
    const changedParts: string[] = [];
    for (const e of zip.entries) {
      if (opts.thumbnail && before.thumbnail && (e.name === before.thumbnail.name || (isOdf(format) && e.name.startsWith('Thumbnails/')))) {
        changedParts.push(`${e.name} (removed)`);
        continue;
      }
      if (e.name.endsWith('/') || !wantsEdit(e.name, format, opts)) {
        out.push({ meta: e, data: rawData(zip, e) });
        continue;
      }
      const original = new TextDecoder().decode(await readEntry(zip, e));
      const edited = editPart(e.name, original, format, opts);
      if (edited === original) out.push({ meta: e, data: rawData(zip, e) });
      else {
        out.push(await textEntry(e, new TextEncoder().encode(edited)));
        changedParts.push(e.name);
      }
    }
    const result = writeZip(out);
    const after = await inspectZip(openZip(result));
    return { bytes: result, before, after, left: leftovers(after, opts), changedParts };
  } catch (err) {
    throw toOfficeError(err);
  }
}

/** What the options asked to remove that is still present. Empty means the output verifies. */
export function leftovers(after: OfficeReport, opts: OfficeOptions): string[] {
  const left = new Set<string>();
  for (const f of after.fields) if (opts[f.group]) left.add(f.label);
  if (opts.custom && after.custom.length) left.add('Custom properties');
  if (opts.thumbnail && after.thumbnail) left.add('Thumbnail');
  if (opts.reviewers && after.reviewers.some((r) => r !== GENERIC_AUTHOR && r !== 'None')) left.add('Comment and revision authors');
  return [...left];
}

export const cleanName = (name: string) => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  // oxlint-disable-next-line no-control-regex
  return `${base.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_') || 'document'}-clean${ext}`;
};

export const isOfficeFile = (f: { name: string }) => /\.(docx|xlsx|pptx|docm|xlsm|pptm|odt|ods|odp)$/i.test(f.name);
