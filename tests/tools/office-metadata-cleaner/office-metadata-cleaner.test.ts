import { describe, expect, it } from 'vitest';
import { createZip } from '../../../src/shared/lib/zip';
import { cleanName, cleanOffice, DEFAULT_OPTIONS, inspectOffice, OfficeError } from '../../../src/tools/office-metadata-cleaner/features/office-metadata-cleaner';
import { isUnsafeName, openZip, readText, textEntry, writeZip, ZipError, type ZipEntry } from '../../../src/tools/office-metadata-cleaner/features/zip-archive';
import { parseXml, textOf } from '../../../src/tools/office-metadata-cleaner/features/xml';

const base = (name: string): ZipEntry => ({ name, flags: 0, method: 0, crc: 0, compSize: 0, size: 0, dosTime: 0, dosDate: 0x21, external: 0, offset: 0 });
const enc = (s: string) => new TextEncoder().encode(s);

/** Builds a ZIP with deflated entries (the way Office does it). */
async function makeZip(files: Record<string, string>): Promise<Uint8Array> {
  return writeZip(await Promise.all(Object.entries(files).map(([name, text]) => textEntry(base(name), enc(text)))));
}

const CORE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Budget &amp; Plan</dc:title><dc:creator>Jane Roe</dc:creator><cp:lastModifiedBy>John Doe</cp:lastModifiedBy><cp:revision>7</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2024-01-31T12:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2024-02-01T08:30:00Z</dcterms:modified></cp:coreProperties>`;
const APP = `<?xml version="1.0"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Template>Normal.dotm</Template><TotalTime>42</TotalTime><Application>Microsoft Office Word</Application><Company>ACME Corp</Company><Manager>Boss</Manager><AppVersion>16.0000</AppVersion><Pages>3</Pages></Properties>`;
const CUSTOM = `<?xml version="1.0"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="Project"><vt:lpwstr>Falcon</vt:lpwstr></property></Properties>`;
const RELS = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/></Relationships>`;
const DOC = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:ins w:id="1" w:author="Jane Roe" w:date="2024-01-01T00:00:00Z"><w:r><w:t>new</w:t></w:r></w:ins><w:del w:id="2" w:author="John Doe" w:date="2024-01-02T00:00:00Z"><w:r><w:delText>old</w:delText></w:r></w:del></w:p></w:body></w:document>`;
const COMMENTS = `<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:comment w:id="0" w:author="Jane Roe" w:initials="JR" w:date="2024-01-03T00:00:00Z"><w:p><w:r><w:t>hi</w:t></w:r></w:p></w:comment></w:comments>`;
const PEOPLE = `<w15:people xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"><w15:person w15:author="Jane Roe"><w15:presenceInfo w15:providerId="AD" w15:userId="S::jane@acme.com::1"/></w15:person></w15:people>`;

const docx = () =>
  makeZip({
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/></Types>',
    '_rels/.rels': RELS,
    'docProps/core.xml': CORE,
    'docProps/app.xml': APP,
    'docProps/custom.xml': CUSTOM,
    'docProps/thumbnail.jpeg': 'JPEGDATA',
    'word/document.xml': DOC,
    'word/comments.xml': COMMENTS,
    'word/people.xml': PEOPLE,
  });

describe('xml reader', () => {
  it('parses, decodes predefined entities and ignores DTDs', () => {
    const root = parseXml('<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x "BOOM">]><r a="1 &amp; 2"><c>&x; &lt;&#65;</c></r>');
    expect(root.attrs.a).toBe('1 & 2');
    expect(textOf(root.children[0])).toBe('&x; <A');
  });
  it('rejects malformed input', () => {
    expect(() => parseXml('<a><b></a>')).toThrow();
    expect(() => parseXml('')).toThrow();
  });
});

describe('zip reader', () => {
  it('reads deflated and stored entries and verifies them', async () => {
    const zip = openZip(await makeZip({ 'a.txt': 'hello '.repeat(100), 'b/c.txt': 'x' }));
    expect(zip.entries.map((e) => e.name)).toEqual(['a.txt', 'b/c.txt']);
    expect(zip.entries[0].method).toBe(8);
    expect(await readText(zip, 'a.txt')).toBe('hello '.repeat(100));
    const stored = openZip(createZip([{ name: 'n.txt', data: enc('plain') }]));
    expect(await readText(stored, 'n.txt')).toBe('plain');
  });

  it('refuses unsafe, duplicate and non-zip input', async () => {
    for (const bad of ['../evil.txt', '/abs.txt', 'a/../../b', 'a\\b', 'C:/x']) expect(isUnsafeName(bad)).toBe(true);
    expect(isUnsafeName('word/document.xml')).toBe(false);
    const evil = await makeZip({ '../evil.txt': 'x' });
    expect(() => openZip(evil)).toThrow(/unsafe/);
    expect(() => openZip(enc('this is not a zip file at all, really'))).toThrow(ZipError);
    expect(() => openZip(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, ...new Array(40).fill(0)]))).toThrow(/password-protected|legacy/);
  });

  it('caps what a part may inflate to', async () => {
    const zip = openZip(await makeZip({ 'big.xml': 'a'.repeat(200_000) }));
    await expect(readText(zip, 'big.xml', 1000)).rejects.toMatchObject({ code: 'too-large' });
  });
});

describe('inspectOffice', () => {
  it('reads core, app, custom, comments, tracked changes and reviewers from a docx', async () => {
    const r = await inspectOffice(await docx());
    expect(r.format).toBe('docx');
    const f = Object.fromEntries(r.fields.map((x) => [x.label, x.value]));
    expect(f.Author).toBe('Jane Roe');
    expect(f['Last modified by']).toBe('John Doe');
    expect(f.Title).toBe('Budget & Plan');
    expect(f.Company).toBe('ACME Corp');
    expect(f.Application).toBe('Microsoft Office Word');
    expect(f.Revision).toBe('7');
    expect(r.custom).toEqual([{ name: 'Project', value: 'Falcon' }]);
    expect(r.comments).toBe(1);
    expect(r.trackedChanges).toBe(2);
    expect(r.reviewers).toEqual(expect.arrayContaining(['Jane Roe', 'John Doe']));
    expect(r.thumbnail).toMatchObject({ name: 'docProps/thumbnail.jpeg' });
  });

  it('finds hidden sheets and slides', async () => {
    const xlsx = await makeZip({
      '[Content_Types].xml': '<Types/>',
      'xl/workbook.xml': '<workbook><sheets><sheet name="Public" sheetId="1" r:id="rId1"/><sheet name="Salaries &amp; Bonus" sheetId="2" state="hidden" r:id="rId2"/></sheets></workbook>',
      'xl/comments1.xml': '<comments><authors><author>Jane Roe</author></authors><commentList><comment ref="A1" authorId="0"/></commentList></comments>',
    });
    const r = await inspectOffice(xlsx);
    expect(r.format).toBe('xlsx');
    expect(r.hiddenItems).toEqual(['Sheet "Salaries & Bonus" (hidden)']);
    expect(r.comments).toBe(1);
    expect(r.reviewers).toEqual(['Jane Roe']);

    const pptx = await makeZip({
      '[Content_Types].xml': '<Types/>',
      'ppt/presentation.xml': '<p:presentation/>',
      'ppt/slides/slide1.xml': '<p:sld xmlns:p="x"/>',
      'ppt/slides/slide2.xml': '<p:sld xmlns:p="x" show="0"/>',
    });
    expect((await inspectOffice(pptx)).hiddenItems).toEqual(['Slide 2 (hidden)']);
  });

  it('reads OpenDocument metadata', async () => {
    const odt = await makeZip({
      mimetype: 'application/vnd.oasis.opendocument.text',
      'meta.xml': '<office:document-meta xmlns:office="o" xmlns:meta="m" xmlns:dc="d"><office:meta><meta:generator>LibreOffice/7</meta:generator><meta:initial-creator>Jane Roe</meta:initial-creator><dc:creator>John Doe</dc:creator><meta:creation-date>2024-01-01T00:00:00</meta:creation-date><meta:user-defined meta:name="Proj">Falcon</meta:user-defined></office:meta></office:document-meta>',
      'content.xml': '<office:document-content xmlns:office="o" xmlns:dc="d"><office:annotation><dc:creator>Jane Roe</dc:creator></office:annotation></office:document-content>',
      'Thumbnails/thumbnail.png': 'PNG',
    });
    const r = await inspectOffice(odt);
    expect(r.format).toBe('odt');
    expect(r.fields.find((x) => x.label === 'Author')?.value).toBe('Jane Roe');
    expect(r.custom).toEqual([{ name: 'Proj', value: 'Falcon' }]);
    expect(r.comments).toBe(1);
    expect(r.thumbnail?.name).toBe('Thumbnails/thumbnail.png');
  });

  it('explains files that are not Office documents', async () => {
    await expect(inspectOffice(await makeZip({ 'a.txt': 'x' }))).rejects.toBeInstanceOf(OfficeError);
    await expect(inspectOffice(enc('nope nope nope nope nope nope'))).rejects.toMatchObject({ code: 'unsupported' });
  });
});

describe('cleanOffice', () => {
  it('blanks metadata, drops the thumbnail with its relationship, and verifies the output', async () => {
    const src = await docx();
    const { bytes, before, after, left } = await cleanOffice(src, DEFAULT_OPTIONS);
    expect(before.fields.length).toBeGreaterThan(8);
    expect(left).toEqual([]);
    expect(after.thumbnail).toBeNull();
    expect(after.custom).toEqual([]);
    expect(after.reviewers).toEqual(['Author']);
    // Title is kept by default (the "details" group is off).
    expect(after.fields.map((f) => f.label)).toEqual(['Title']);
    const zip = openZip(bytes);
    expect(zip.entries.map((e) => e.name)).not.toContain('docProps/thumbnail.jpeg');
    expect(await readText(zip, '_rels/.rels')).not.toMatch(/thumbnail/);
    expect(await readText(zip, '_rels/.rels')).toMatch(/officeDocument/);
    // Document content, comments and tracked changes survive.
    expect(after.comments).toBe(1);
    expect(after.trackedChanges).toBe(2);
    const text = await readText(zip, 'word/document.xml');
    expect(text).toContain('<w:t>new</w:t>');
    expect(text).not.toMatch(/Jane Roe|w:date/);
    expect(await readText(zip, 'word/people.xml')).not.toMatch(/jane@acme/);
    // Output is still valid XML everywhere that was edited.
    for (const n of ['docProps/core.xml', 'docProps/app.xml', 'docProps/custom.xml', '_rels/.rels', 'word/people.xml', 'word/comments.xml']) {
      const xml = (await readText(zip, n))!;
      expect(() => parseXml(xml), n).not.toThrow();
    }
  });

  it('removes only what is asked', async () => {
    const opts = { ...DEFAULT_OPTIONS, authors: false, dates: false, company: false, application: false, custom: false, thumbnail: false, reviewers: false, details: true };
    const { after, left } = await cleanOffice(await docx(), opts);
    expect(left).toEqual([]);
    expect(after.fields.map((f) => f.label)).not.toContain('Title');
    expect(after.fields.map((f) => f.label)).toContain('Author');
    expect(after.thumbnail).not.toBeNull();
  });

  it('copies untouched parts byte for byte', async () => {
    const src = await docx();
    const { bytes } = await cleanOffice(src, { ...DEFAULT_OPTIONS, reviewers: false });
    const a = openZip(src);
    const b = openZip(bytes);
    const doc = b.entries.find((e) => e.name === 'word/document.xml')!;
    expect(doc.crc).toBe(a.entries.find((e) => e.name === 'word/document.xml')!.crc);
    expect(doc.compSize).toBe(a.entries.find((e) => e.name === 'word/document.xml')!.compSize);
  });

  it('cleans OpenDocument files and their manifest', async () => {
    const odt = await makeZip({
      mimetype: 'application/vnd.oasis.opendocument.text',
      'META-INF/manifest.xml': '<manifest:manifest xmlns:manifest="m"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/><manifest:file-entry manifest:full-path="Thumbnails/thumbnail.png" manifest:media-type="image/png"/></manifest:manifest>',
      'meta.xml': '<office:document-meta xmlns:office="o" xmlns:meta="m" xmlns:dc="d"><office:meta><meta:generator>LibreOffice/7</meta:generator><meta:initial-creator>Jane Roe</meta:initial-creator><dc:creator>John Doe</dc:creator><dc:date>2024-01-01T00:00:00</dc:date></office:meta></office:document-meta>',
      'content.xml': '<office:document-content xmlns:office="o"/>',
      'Thumbnails/thumbnail.png': 'PNG',
    });
    const { bytes, after, left } = await cleanOffice(odt, DEFAULT_OPTIONS);
    expect(left).toEqual([]);
    expect(after.fields).toEqual([]);
    const zip = openZip(bytes);
    expect(zip.entries[0].name).toBe('mimetype');
    expect(zip.entries[0].method).toBe(0);
    expect(zip.entries.map((e) => e.name)).not.toContain('Thumbnails/thumbnail.png');
    expect(await readText(zip, 'META-INF/manifest.xml')).not.toMatch(/Thumbnails/);
  });

  it('names output files', () => {
    expect(cleanName('Report.docx')).toBe('Report-clean.docx');
    expect(cleanName('a.b.xlsx')).toBe('a.b-clean.xlsx');
  });
});
