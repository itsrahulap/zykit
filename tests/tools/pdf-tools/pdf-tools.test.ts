import { describe, expect, it } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  baseName,
  everyPage,
  moveItem,
  normRotation,
  outputNames,
  pageSizeLabel,
  parseRanges,
  rangeLabel,
  RangeSyntaxError,
  splitName,
} from '../../../src/tools/pdf-tools/features/pdf-tools';
import { composePdf, describePdf, openPdf, PdfOpenError, type PageRef } from '../../../src/tools/pdf-tools/features/pdf-ops';

async function makePdf(pages: [number, number][], title?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const size of pages) doc.addPage(size);
  if (title) {
    doc.setTitle(title);
    doc.setAuthor('Ada');
    doc.setKeywords(['secret']);
  }
  return doc.save();
}

describe('parseRanges', () => {
  it('parses single pages, ranges and open ranges', () => {
    expect(parseRanges('1-3,5,8-', 10)).toEqual([[0, 1, 2], [4], [7, 8, 9]]);
    expect(parseRanges(' -2 ; 4 ', 5)).toEqual([[0, 1], [3]]);
    expect(parseRanges('3–4', 5)).toEqual([[2, 3]]);
  });
  it('rejects bad input with a helpful message', () => {
    expect(() => parseRanges('', 5)).toThrow(RangeSyntaxError);
    expect(() => parseRanges('0', 5)).toThrow(/Page 0 doesn't exist/);
    expect(() => parseRanges('6', 5)).toThrow(/has 5 pages/);
    expect(() => parseRanges('4-2', 5)).toThrow(/backwards/);
    expect(() => parseRanges('a', 5)).toThrow(/isn't a page/);
    expect(() => parseRanges('-', 5)).toThrow(/start or an end/);
  });
  it('splits every page', () => {
    expect(everyPage(3)).toEqual([[0], [1], [2]]);
  });
});

describe('names', () => {
  it('builds sensible file names', () => {
    expect(baseName('Report 2024.PDF')).toBe('Report 2024');
    expect(baseName('a/b:c.pdf')).toBe('a-b-c');
    expect(baseName('.pdf')).toBe('document');
    expect(rangeLabel([0, 1, 2, 4, 7, 8])).toBe('1-3_5_8-9');
    expect(splitName('doc', [3])).toBe('doc-page-4.pdf');
    expect(splitName('doc', [0, 1, 2])).toBe('doc-pages-1-3.pdf');
    expect(outputNames.merge(['a', 'b'])).toBe('a-merged.pdf');
    expect(outputNames.splitZip('doc')).toBe('doc-split.zip');
    expect(outputNames.extract('doc', [1, 2])).toBe('doc-pages-2-3.pdf');
    expect(outputNames.edited('doc')).toBe('doc-edited.pdf');
  });
  it('labels page sizes', () => {
    expect(pageSizeLabel(595.28, 841.89)).toBe('A4 portrait');
    expect(pageSizeLabel(792, 612)).toBe('Letter landscape');
    expect(pageSizeLabel(283.46, 283.46)).toBe('100 × 100 mm');
  });
  it('normalises rotations and moves items', () => {
    expect(normRotation(-90)).toBe(270);
    expect(normRotation(450)).toBe(90);
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });
});

describe('PDF operations', () => {
  it('describes a PDF', async () => {
    const doc = await openPdf(await makePdf([[595, 842], [842, 595]], 'Hello'));
    const info = describePdf(doc);
    expect(info.pageCount).toBe(2);
    expect(info.pages[1]).toEqual({ width: 842, height: 595, rotation: 0 });
    expect(info.title).toBe('Hello');
  });

  it('merges, reorders, rotates and keeps metadata by default', async () => {
    const a = await openPdf(await makePdf([[100, 200], [110, 200]], 'First'));
    const b = await openPdf(await makePdf([[300, 400]]));
    const docs = new Map([
      ['a', a],
      ['b', b],
    ]);
    const pages: PageRef[] = [
      { file: 'a', index: 1, rotate: 0 },
      { file: 'b', index: 0, rotate: 90 },
      { file: 'a', index: 0, rotate: 270 },
    ];
    let progress = 0;
    const out = await PDFDocument.load(await composePdf(docs, pages, { removeMetadata: false, onPage: () => progress++ }));
    expect(progress).toBe(3);
    expect(out.getPageCount()).toBe(3);
    expect(out.getPages().map((p) => p.getWidth())).toEqual([110, 300, 100]);
    expect(out.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90, 270]);
    expect(out.getTitle()).toBe('First');
    expect(out.getAuthor()).toBe('Ada');
  });

  it('adds rotation to a page that is already rotated', async () => {
    const src = await PDFDocument.create();
    src.addPage([100, 100]).setRotation(degrees(90));
    const doc = await openPdf(await src.save());
    const out = await PDFDocument.load(await composePdf(new Map([['x', doc]]), [{ file: 'x', index: 0, rotate: 270 }], { removeMetadata: false }));
    expect(out.getPage(0).getRotation().angle).toBe(0);
  });

  it('extracts, deletes and splits (a subset of pages each)', async () => {
    const doc = await openPdf(await makePdf([[100, 100], [200, 200], [300, 300], [400, 400]]));
    const docs = new Map([['d', doc]]);
    const groups = parseRanges('1-2,4', 4);
    const outs = await Promise.all(groups.map((g) => composePdf(docs, g.map((index) => ({ file: 'd', index, rotate: 0 })), { removeMetadata: false })));
    const counts = await Promise.all(outs.map(async (o) => (await PDFDocument.load(o)).getPageCount()));
    expect(counts).toEqual([2, 1]);
    const kept = [0, 1, 2, 3].filter((i) => i !== 1);
    const deleted = await PDFDocument.load(await composePdf(docs, kept.map((index) => ({ file: 'd', index, rotate: 0 })), { removeMetadata: false }));
    expect(deleted.getPages().map((p) => p.getWidth())).toEqual([100, 300, 400]);
  });

  it('removes metadata when asked', async () => {
    const doc = await openPdf(await makePdf([[100, 100]], 'Secret title'));
    const bytes = await composePdf(new Map([['d', doc]]), [{ file: 'd', index: 0, rotate: 0 }], { removeMetadata: true });
    const out = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(out.getTitle()).toBeUndefined();
    expect(out.getAuthor()).toBeUndefined();
    expect(out.getProducer()).toBeUndefined();
    expect(out.getCreator()).toBeUndefined();
    expect(out.getKeywords()).toBeUndefined();
    expect(out.getCreationDate()).toBeUndefined();
    expect(out.getModificationDate()).toBeUndefined();
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).not.toContain('Secret title');
    expect(text).not.toContain('pdf-lib');
  });

  it('rejects encrypted and invalid files', async () => {
    await expect(openPdf(new TextEncoder().encode('not a pdf'))).rejects.toBeInstanceOf(PdfOpenError);
    // A minimal PDF whose trailer references an /Encrypt dictionary.
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    const enc = doc.context.obj({ Filter: 'Standard', V: 1, R: 2, O: '(x)', U: '(y)', P: -4 });
    doc.context.trailerInfo.Encrypt = doc.context.register(enc);
    const bytes = await doc.save({ useObjectStreams: false });
    await expect(openPdf(bytes)).rejects.toMatchObject({ code: 'encrypted' });
  });
});
