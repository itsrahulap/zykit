// Pure logic for PDF Metadata Cleaner: reads and removes a PDF's hidden metadata with pdf-lib.
// No DOM, so it runs in the tool's worker and in unit tests. Nothing here performs network requests.

import {
  decodePDFRawStream,
  EncryptedPDFError,
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
  type PDFContext,
  type PDFObject,
} from 'pdf-lib';

export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
export const MAX_FILES = 50;
/** XMP packets above this are shown truncated (they are removed in full regardless). */
export const MAX_XMP_CHARS = 200_000;

export class PdfMetaError extends Error {
  code: 'encrypted' | 'invalid';
  constructor(code: PdfMetaError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export type FlagKind = 'person' | 'software' | 'ai' | 'date' | 'id' | 'text';

export interface InfoField {
  key: string;
  value: string;
  kind: FlagKind | 'custom';
  /** ISO 8601 when the value is a PDF date. */
  iso?: string;
}

export interface XmpField {
  key: string;
  value: string;
  kind: FlagKind;
}

export interface PdfMetaReport {
  pageCount: number;
  version: string;
  info: InfoField[];
  xmp: { present: boolean; chars: number; pretty: string; truncated: boolean; fields: XmpField[] };
  /** Number of other XMP streams (images, forms) besides the document-level one. */
  extraXmpStreams: number;
  documentId: string[] | null;
  embeddedFiles: number;
  fileAttachments: number;
  javascript: number;
  formFields: number;
  hasForm: boolean;
  /** Adobe-style private application data (/PieceInfo). */
  privateData: number;
  /** Tool and generator names found (Creator, Producer, XMP CreatorTool), AI tools marked. */
  generators: { value: string; ai: boolean }[];
  hasIdentifying: boolean;
}

export interface CleanOptions {
  info: boolean;
  xmp: boolean;
  documentId: boolean;
  privateData: boolean;
}

export const DEFAULT_OPTIONS: CleanOptions = { info: true, xmp: true, documentId: false, privateData: true };

/* ---------------------------------------------------------------- text helpers */

const AI_TOOLS = /\b(chat\s?gpt|gpt-?\d|openai|dall[\s-]?e|midjourney|stable\s?diffusion|firefly|copilot|claude|anthropic|gemini|bard|perplexity|jasper|notion ai|canva magic|ai[\s-]generated|generative ai|llm)\b/i;

export const isAiTool = (s: string) => AI_TOOLS.test(s);

/** "D:20240131120000+01'00'" → ISO 8601, or undefined if it isn't a PDF date. */
export function parsePdfDate(s: string): string | undefined {
  const m = /^D?:?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(Z|[+-]\d{2}(?:'?\d{2}'?)?)?$/.exec(s.trim());
  if (!m) return undefined;
  const [, y, mo = '01', d = '01', h = '00', mi = '00', se = '00', tz = ''] = m;
  let zone = 'Z';
  if (tz && tz !== 'Z') {
    const digits = tz.replace(/'/g, '');
    zone = `${digits.slice(0, 3)}:${digits.slice(3, 5) || '00'}`;
  }
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}${zone}`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
/** Decodes only the five predefined entities and numeric references; never a DTD-defined entity. */
export function decodeXmlText(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e: string) => {
    if (e[0] !== '#') return XML_ENTITIES[e.toLowerCase()] ?? m;
    const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

/** Re-indents an XMP packet. Text-only: tags are never interpreted, so nothing can expand. */
export function prettyXml(xml: string): string {
  const tokens = xml.replace(/\r\n?/g, '\n').match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]*>|[^<]+/g) ?? [];
  const out: string[] = [];
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t[0] !== '<' || t.startsWith('<![CDATA[')) {
      const text = t.trim();
      if (text) out.push(`${'  '.repeat(depth)}${text}`);
      continue;
    }
    const closing = t.startsWith('</');
    const selfClosing = /\/>$/.test(t) || t.startsWith('<?') || t.startsWith('<!');
    if (closing) depth = Math.max(0, depth - 1);
    // <a>text</a> stays on one line.
    const next = tokens[i + 1];
    const after = tokens[i + 2];
    if (!closing && !selfClosing && next && next[0] !== '<' && next.trim() && after?.startsWith('</')) {
      out.push(`${'  '.repeat(depth)}${t}${next.trim()}${after}`);
      i += 2;
      continue;
    }
    out.push(`${'  '.repeat(depth)}${t}`);
    if (!closing && !selfClosing) depth++;
  }
  return out.join('\n');
}

const XMP_KINDS: [RegExp, FlagKind][] = [
  [/(^|:)(creator|lastmodifiedby|author|authorsposition|rights|owner|credit|source|usageterms|webstatement|attributionname|contributor|publisher)$/i, 'person'],
  [/(^|:)(creatortool|producer|generator|application|software|agent|softwareagent)$/i, 'software'],
  [/(^|:)(createdate|modifydate|metadatadate|date|datecreated|when)$/i, 'date'],
  [/(^|:)(documentid|instanceid|originaldocumentid|versionid)$/i, 'id'],
];

function xmpKind(key: string, value: string): FlagKind {
  if (isAiTool(value) || /aigenerated|digitalsourcetype/i.test(key)) return 'ai';
  for (const [re, kind] of XMP_KINDS) if (re.test(key)) return kind;
  return 'text';
}

const SKIP_PREFIX = /^(rdf|x|xmlns|xml|xmpmeta)$/i;

/** Pulls property names and values out of an XMP packet (attributes and simple or list elements). */
export function extractXmpFields(xml: string): XmpField[] {
  const found = new Map<string, XmpField>();
  const add = (key: string, raw: string) => {
    const value = decodeXmlText(raw.replace(/\s+/g, ' ').trim());
    if (!value || value.length > 2000) return;
    const id = `${key}\u0000${value}`;
    if (!found.has(id)) found.set(id, { key, value, kind: xmpKind(key, value) });
  };
  for (const m of xml.matchAll(/<rdf:Description\b([^>]*)>/g))
    for (const a of m[1].matchAll(/([\w.-]+:[\w.-]+)\s*=\s*"([^"]*)"/g)) {
      const prefix = a[1].split(':')[0];
      if (!SKIP_PREFIX.test(prefix) && a[1] !== 'rdf:about') add(a[1], a[2]);
    }
  for (const m of xml.matchAll(/<([\w.-]+:[\w.-]+)(?:\s[^>]*)?>(?=([\s\S]*?)<\/\1>)/g)) {
    const [, key, inner] = m;
    if (SKIP_PREFIX.test(key.split(':')[0])) continue;
    if (/<rdf:li\b/.test(inner)) {
      const items = [...inner.matchAll(/<rdf:li\b[^>]*>([^<]*)<\/rdf:li>/g)].map((x) => x[1].trim()).filter(Boolean);
      if (items.length) add(key, items.join('; '));
    } else if (!inner.includes('<')) add(key, inner);
  }
  return [...found.values()];
}

/* ---------------------------------------------------------------- reading */

const N = PDFName.of;

function valueText(ctx: PDFContext, obj: PDFObject | undefined, depth = 0): string {
  const v = obj instanceof PDFRef ? ctx.lookup(obj) : obj;
  if (!v) return '';
  if (v instanceof PDFString || v instanceof PDFHexString) {
    try {
      return v.decodeText();
    } catch {
      return v.asString();
    }
  }
  if (v instanceof PDFName) return v.decodeText();
  if (v instanceof PDFNumber) return String(v.asNumber());
  if (v instanceof PDFBool) return String(v.asBoolean());
  if (v instanceof PDFArray && depth < 3) return v.asArray().map((x) => valueText(ctx, x, depth + 1)).join(', ');
  return '';
}

function idHex(ctx: PDFContext, obj: PDFObject): string {
  const v = obj instanceof PDFRef ? ctx.lookup(obj) : obj;
  if (v instanceof PDFHexString || v instanceof PDFString) return Array.from(v.asBytes(), (b) => b.toString(16).padStart(2, '0')).join('');
  return '';
}

const INFO_KIND: Record<string, FlagKind> = {
  Title: 'text',
  Author: 'person',
  Subject: 'text',
  Keywords: 'text',
  Creator: 'software',
  Producer: 'software',
  CreationDate: 'date',
  ModDate: 'date',
  Trapped: 'text',
};
const INFO_ORDER = Object.keys(INFO_KIND);

function dictsOf(ctx: PDFContext): PDFDict[] {
  const out: PDFDict[] = [];
  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PDFDict) out.push(obj);
    else if (obj instanceof PDFStream) out.push(obj.dict);
  }
  return out;
}

function nameIs(d: PDFDict, key: string, value: string) {
  const v = d.get(N(key));
  return v instanceof PDFName && v.decodeText() === value;
}

function readXmp(doc: PDFDocument): string | null {
  const stream = doc.catalog.lookupMaybe(N('Metadata'), PDFStream);
  if (!stream) return null;
  try {
    const bytes = stream instanceof PDFRawStream ? decodePDFRawStream(stream).decode() : stream.getContents();
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
}

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (err instanceof EncryptedPDFError || (err instanceof Error && /encrypt/i.test(err.message)))
      throw new PdfMetaError(
        'encrypted',
        "This PDF is encrypted (password-protected or with usage restrictions), so its metadata can't be read or rewritten here. Remove the protection in the app that created it, then add it again.",
      );
    throw new PdfMetaError('invalid', "This file couldn't be read as a PDF. It may be damaged or not a PDF at all.");
  }
}

export function inspectDocument(doc: PDFDocument, bytes?: Uint8Array): PdfMetaReport {
  const ctx = doc.context;

  const info: InfoField[] = [];
  const infoDict = ctx.lookupMaybe(ctx.trailerInfo.Info, PDFDict);
  if (infoDict) {
    for (const [k, v] of infoDict.entries()) {
      const key = k.decodeText();
      const value = valueText(ctx, v).trim();
      const base = INFO_KIND[key];
      const iso = base === 'date' ? parsePdfDate(value) : undefined;
      if (value) info.push({ key, value, kind: base === undefined ? 'custom' : isAiTool(value) ? 'ai' : base, iso });
    }
    info.sort((a, b) => {
      const ia = INFO_ORDER.indexOf(a.key);
      const ib = INFO_ORDER.indexOf(b.key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.key.localeCompare(b.key);
    });
  }

  const raw = readXmp(doc);
  const shown = raw && raw.length > MAX_XMP_CHARS ? raw.slice(0, MAX_XMP_CHARS) : raw;
  const xmpFields = shown ? extractXmpFields(shown) : [];

  let embeddedFiles = 0;
  let fileAttachments = 0;
  let javascript = 0;
  let privateData = 0;
  let metadataStreams = 0;
  for (const d of dictsOf(ctx)) {
    if (nameIs(d, 'Type', 'Filespec') && d.has(N('EF'))) embeddedFiles++;
    if (nameIs(d, 'Subtype', 'FileAttachment')) fileAttachments++;
    if (nameIs(d, 'S', 'JavaScript') || d.has(N('JS'))) javascript++;
    if (d.has(N('PieceInfo'))) privateData++;
    if (nameIs(d, 'Type', 'Metadata') && nameIs(d, 'Subtype', 'XML')) metadataStreams++;
  }

  const form = doc.catalog.lookupMaybe(N('AcroForm'), PDFDict);
  const fields = form?.lookupMaybe(N('Fields'), PDFArray);

  const idArr = ctx.lookupMaybe(ctx.trailerInfo.ID, PDFArray);
  const ids = idArr ? idArr.asArray().map((x) => idHex(ctx, x)).filter(Boolean) : [];

  const generators: { value: string; ai: boolean }[] = [];
  const addGen = (value: string) => {
    if (value && !generators.some((g) => g.value === value)) generators.push({ value, ai: isAiTool(value) });
  };
  for (const f of info) if (f.kind === 'software' || f.kind === 'ai') addGen(f.value);
  for (const f of xmpFields) if (f.kind === 'software' || f.kind === 'ai') addGen(f.value);

  const header = bytes ? new TextDecoder('latin1').decode(bytes.subarray(0, 1024)).match(/%PDF-(\d\.\d)/) : null;

  return {
    pageCount: doc.getPageCount(),
    version: header ? header[1] : '',
    info,
    xmp: {
      present: raw !== null,
      chars: raw?.length ?? 0,
      pretty: shown ? prettyXml(shown) : '',
      truncated: !!raw && raw.length > MAX_XMP_CHARS,
      fields: xmpFields,
    },
    extraXmpStreams: Math.max(0, metadataStreams - (raw !== null ? 1 : 0)),
    documentId: ids.length ? ids : null,
    embeddedFiles,
    fileAttachments,
    javascript,
    formFields: fields?.size() ?? 0,
    hasForm: !!form,
    privateData,
    generators,
    hasIdentifying: info.length > 0 || raw !== null || ids.length > 0,
  };
}

export async function inspectPdf(bytes: Uint8Array): Promise<PdfMetaReport> {
  return inspectDocument(await loadPdf(bytes), bytes);
}

/* ---------------------------------------------------------------- cleaning */

function dropRef(ctx: PDFContext, value: PDFObject | undefined) {
  if (value instanceof PDFRef) ctx.delete(value);
}

/** Removes the chosen metadata and returns the new file plus a re-read of it. */
export async function cleanPdf(bytes: Uint8Array, opts: CleanOptions): Promise<{ bytes: Uint8Array; before: PdfMetaReport; after: PdfMetaReport }> {
  const doc = await loadPdf(bytes);
  const before = inspectDocument(doc, bytes);
  const ctx = doc.context;

  if (opts.info) {
    dropRef(ctx, ctx.trailerInfo.Info);
    ctx.trailerInfo.Info = undefined;
  }
  if (opts.documentId) ctx.trailerInfo.ID = undefined;
  for (const d of dictsOf(ctx)) {
    if (opts.xmp && d.has(N('Metadata'))) {
      dropRef(ctx, d.get(N('Metadata')));
      d.delete(N('Metadata'));
    }
    if (opts.privateData && d.has(N('PieceInfo'))) {
      dropRef(ctx, d.get(N('PieceInfo')));
      d.delete(N('PieceInfo'));
    }
  }

  const out = await doc.save({ useObjectStreams: false, updateFieldAppearances: false });
  const after = await inspectPdf(out);
  return { bytes: out, before, after };
}

/** What is still present after cleaning, given the options (empty means the output verifies). */
export function leftovers(after: PdfMetaReport, opts: CleanOptions): string[] {
  const left: string[] = [];
  if (opts.info && after.info.length) left.push('Info dictionary');
  if (opts.xmp && (after.xmp.present || after.extraXmpStreams)) left.push('XMP metadata');
  if (opts.documentId && after.documentId) left.push('document ID');
  if (opts.privateData && after.privateData) left.push('application data');
  return left;
}

/* ---------------------------------------------------------------- files */

// oxlint-disable-next-line no-control-regex
const UNSAFE_NAME = /[\\/:*?"<>|\u0000-\u001f]/g;
export const cleanName = (name: string) => `${name.replace(/\.pdf$/i, '').replace(UNSAFE_NAME, '_') || 'document'}-clean.pdf`;

export const isPdfFile = (f: { name: string; type: string }) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
