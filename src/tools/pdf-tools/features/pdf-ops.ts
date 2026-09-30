// PDF operations with pdf-lib. Runs in the tool's worker (and in unit tests); the page only
// imports it through the worker, so pdf-lib is its own chunk loaded when the tool is used.

import { degrees, EncryptedPDFError, PDFDict, PDFDocument } from 'pdf-lib';
import { MAX_PAGES, normRotation, type Rotation } from './pdf-tools';

export interface PageInfo {
  width: number;
  height: number;
  rotation: Rotation;
}

export interface PdfInfo {
  pageCount: number;
  pages: PageInfo[];
  title?: string;
}

export class PdfOpenError extends Error {
  code: 'encrypted' | 'invalid' | 'too-large';
  constructor(code: PdfOpenError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

/** A page of the output: which file, which original page (0-based), extra rotation. */
export interface PageRef {
  file: string;
  index: number;
  rotate: number;
}

export async function openPdf(bytes: Uint8Array): Promise<PDFDocument> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (err instanceof EncryptedPDFError || (err instanceof Error && /encrypt/i.test(err.message)))
      throw new PdfOpenError(
        'encrypted',
        "This PDF is encrypted (password-protected or with usage restrictions), so its pages can't be read or copied here. Remove the protection in the app that created it, then add it again.",
      );
    throw new PdfOpenError('invalid', "This file couldn't be read as a PDF. It may be damaged or not a PDF at all.");
  }
  if (doc.getPageCount() > MAX_PAGES) throw new PdfOpenError('too-large', `This PDF has ${doc.getPageCount()} pages; the tool handles up to ${MAX_PAGES}.`);
  return doc;
}

export function describePdf(doc: PDFDocument): PdfInfo {
  const pages = doc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return { width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10, rotation: normRotation(p.getRotation().angle) };
  });
  let title: string | undefined;
  try {
    title = doc.getTitle() || undefined;
  } catch {
    title = undefined;
  }
  return { pageCount: pages.length, pages, title };
}

export interface ComposeOptions {
  /** Drop title, author, subject, keywords, creator, producer and dates. */
  removeMetadata: boolean;
  onPage?: () => void;
}

/** Build a new PDF from pages of the open documents, in the given order, with rotations applied. */
export async function composePdf(docs: ReadonlyMap<string, PDFDocument>, pages: readonly PageRef[], { removeMetadata, onPage }: ComposeOptions): Promise<Uint8Array> {
  if (!pages.length) throw new Error('There are no pages to write.');
  const out = await PDFDocument.create({ updateMetadata: !removeMetadata });
  // Copy in runs of pages from the same file (fewer copier passes; shared resources copied once).
  for (let i = 0; i < pages.length; ) {
    let j = i;
    const seen = new Set<number>([pages[i].index]);
    while (j + 1 < pages.length && pages[j + 1].file === pages[i].file && !seen.has(pages[j + 1].index)) seen.add(pages[++j].index);
    const run = pages.slice(i, j + 1);
    const src = docs.get(run[0].file);
    if (!src) throw new Error('A source file is no longer open.');
    const copied = await out.copyPages(
      src,
      run.map((p) => p.index),
    );
    copied.forEach((page, k) => {
      const extra = run[k].rotate;
      if (extra) page.setRotation(degrees(normRotation(page.getRotation().angle + extra)));
      out.addPage(page);
      onPage?.();
    });
    i = j + 1;
  }
  if (!removeMetadata) {
    const first = docs.get(pages[0].file);
    if (first) copyMetadata(first, out);
  } else {
    stripInfo(out);
  }
  return out.save();
}

function copyMetadata(from: PDFDocument, to: PDFDocument) {
  const safe = <T>(f: () => T) => {
    try {
      return f();
    } catch {
      return undefined;
    }
  };
  const title = safe(() => from.getTitle());
  const author = safe(() => from.getAuthor());
  const subject = safe(() => from.getSubject());
  const keywords = safe(() => from.getKeywords());
  const creator = safe(() => from.getCreator());
  const created = safe(() => from.getCreationDate());
  if (title) to.setTitle(title);
  if (author) to.setAuthor(author);
  if (subject) to.setSubject(subject);
  if (keywords) to.setKeywords([keywords]);
  if (creator) to.setCreator(creator);
  if (created) to.setCreationDate(created);
}

/** Empty the document information dictionary (pdf-lib has no public "remove"). */
function stripInfo(doc: PDFDocument) {
  const ref = doc.context.trailerInfo.Info;
  const info = ref ? doc.context.lookup(ref) : undefined;
  if (info instanceof PDFDict) for (const key of info.keys()) info.delete(key);
}
