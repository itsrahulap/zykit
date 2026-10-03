import { PDFDocument, PDFHexString, PDFName } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  cleanName,
  cleanPdf,
  DEFAULT_OPTIONS,
  extractXmpFields,
  inspectPdf,
  isAiTool,
  leftovers,
  loadPdf,
  parsePdfDate,
  PdfMetaError,
  prettyXml,
} from '../../../src/tools/pdf-metadata-cleaner/features/pdf-metadata-cleaner';

const XMP = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmp:CreatorTool="ChatGPT Plugin" pdf:Producer="Acme Print 3.1">
<dc:creator><rdf:Seq><rdf:li>Jane Roe</rdf:li></rdf:Seq></dc:creator>
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">Secret &amp; Plan</rdf:li></rdf:Alt></dc:title>
<xmp:CreateDate>2024-01-31T12:00:00+01:00</xmp:CreateDate>
</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;

async function makePdf(opts: { xmp?: boolean; id?: boolean; extras?: boolean } = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([300, 400]);
  doc.addPage([300, 400]);
  doc.setTitle('Quarterly Report');
  doc.setAuthor('Jane Roe');
  doc.setSubject('Money');
  doc.setKeywords(['a', 'b']);
  doc.setCreator('Microsoft Word');
  doc.setProducer('Acme Print 3.1');
  doc.setCreationDate(new Date('2024-01-31T12:00:00Z'));
  doc.setModificationDate(new Date('2024-02-01T08:30:00Z'));
  doc.context.lookup(doc.context.trailerInfo.Info!, (await import('pdf-lib')).PDFDict).set(PDFName.of('Company'), doc.context.obj('ACME Corp'));
  if (opts.xmp) {
    const stream = doc.context.stream(XMP, { Type: 'Metadata', Subtype: 'XML' });
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(stream));
  }
  if (opts.id) doc.context.trailerInfo.ID = doc.context.obj([PDFHexString.of('00112233445566778899aabbccddeeff'), PDFHexString.of('ffeeddccbbaa99887766554433221100')]);
  if (opts.extras) {
    await doc.attach(new TextEncoder().encode('hello'), 'note.txt', { mimeType: 'text/plain' });
    doc.addJavaScript('boot', 'app.alert(1)');
    doc.getForm().createTextField('name').addToPage(doc.getPage(0), { x: 10, y: 10 });
  }
  return doc.save({ useObjectStreams: false });
}

describe('helpers', () => {
  it('parses PDF dates', () => {
    expect(parsePdfDate("D:20240131120000+01'00'")).toBe('2024-01-31T12:00:00+01:00');
    expect(parsePdfDate('D:20240131')).toBe('2024-01-31T00:00:00Z');
    expect(parsePdfDate('yesterday')).toBeUndefined();
  });

  it('spots AI tools', () => {
    expect(isAiTool('Created with ChatGPT')).toBe(true);
    expect(isAiTool('Adobe Firefly')).toBe(true);
    expect(isAiTool('Microsoft Word')).toBe(false);
  });

  it('pretty-prints XMP without interpreting it', () => {
    const out = prettyXml('<a><b>text</b><c x="1"/></a>');
    expect(out).toBe('<a>\n  <b>text</b>\n  <c x="1"/>\n</a>');
  });

  it('extracts and flags XMP fields', () => {
    const fields = extractXmpFields(XMP);
    const get = (k: string) => fields.find((f) => f.key === k);
    expect(get('xmp:CreatorTool')).toMatchObject({ value: 'ChatGPT Plugin', kind: 'ai' });
    expect(get('pdf:Producer')?.kind).toBe('software');
    expect(get('dc:creator')).toMatchObject({ value: 'Jane Roe', kind: 'person' });
    expect(get('dc:title')?.value).toBe('Secret & Plan');
    expect(get('xmp:CreateDate')?.kind).toBe('date');
  });

  it('names output files', () => {
    expect(cleanName('My Report.PDF')).toBe('My Report-clean.pdf');
    expect(cleanName('a/b.pdf')).toBe('a_b-clean.pdf');
  });
});

describe('inspectPdf', () => {
  it('reads the Info dictionary, XMP, ID and risky features', async () => {
    const r = await inspectPdf(await makePdf({ xmp: true, id: true, extras: true }));
    expect(r.pageCount).toBe(2);
    expect(r.version).toMatch(/^1\.\d$/);
    const info = Object.fromEntries(r.info.map((f) => [f.key, f]));
    expect(info.Author.value).toBe('Jane Roe');
    expect(info.Title.value).toBe('Quarterly Report');
    expect(info.CreationDate.iso).toMatch(/^2024-01-31T12:00:00/);
    expect(info.Company).toMatchObject({ value: 'ACME Corp', kind: 'custom' });
    expect(r.xmp.present).toBe(true);
    expect(r.xmp.pretty).toContain('\n');
    expect(r.documentId).toEqual(['00112233445566778899aabbccddeeff', 'ffeeddccbbaa99887766554433221100']);
    expect(r.embeddedFiles).toBe(1);
    expect(r.javascript).toBeGreaterThan(0);
    expect(r.hasForm).toBe(true);
    expect(r.formFields).toBe(1);
    expect(r.generators.some((g) => g.ai)).toBe(true);
  });

  it('reports a clean PDF as empty', async () => {
    const doc = await PDFDocument.create({ updateMetadata: false });
    doc.addPage();
    const r = await inspectPdf(await doc.save());
    expect(r.info).toEqual([]);
    expect(r.xmp.present).toBe(false);
    expect(r.documentId).toBeNull();
    expect(r.hasIdentifying).toBe(false);
  });

  it('explains encrypted and invalid files', async () => {
    await expect(inspectPdf(new TextEncoder().encode('not a pdf'))).rejects.toMatchObject({ code: 'invalid' });
    const doc = await PDFDocument.create({ updateMetadata: false });
    doc.addPage();
    doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: 'Standard', V: 1, R: 2 }));
    await expect(loadPdf(await doc.save())).rejects.toMatchObject({ code: 'encrypted' });
    expect(PdfMetaError).toBeDefined();
  });
});

describe('cleanPdf', () => {
  it('removes Info, XMP and private data, and verifies by re-reading', async () => {
    const src = await makePdf({ xmp: true, id: true });
    const { bytes, before, after } = await cleanPdf(src, DEFAULT_OPTIONS);
    expect(before.info.length).toBeGreaterThan(5);
    expect(after.info).toEqual([]);
    expect(after.xmp.present).toBe(false);
    expect(after.pageCount).toBe(2);
    expect(leftovers(after, DEFAULT_OPTIONS)).toEqual([]);
    // The old values are gone from the file bytes, not just unreferenced.
    const text = new TextDecoder('latin1').decode(bytes);
    for (const s of ['Jane Roe', 'Quarterly Report', 'ACME Corp', 'Acme Print', 'ChatGPT']) expect(text).not.toContain(s);
    expect(text).not.toMatch(/\/Info\b/);
    // The document ID is kept unless asked.
    expect(after.documentId).not.toBeNull();
    // Output re-opens and is a valid PDF.
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
  });

  it('removes the document ID when asked, and only what is asked', async () => {
    const src = await makePdf({ xmp: true, id: true });
    const opts = { info: false, xmp: false, documentId: true, privateData: false };
    const { after } = await cleanPdf(src, opts);
    expect(after.documentId).toBeNull();
    expect(after.info.length).toBeGreaterThan(5);
    expect(after.xmp.present).toBe(true);
  });

  it('keeps pages, attachments and forms intact', async () => {
    const { after } = await cleanPdf(await makePdf({ extras: true }), DEFAULT_OPTIONS);
    expect(after.embeddedFiles).toBe(1);
    expect(after.formFields).toBe(1);
  });
});
