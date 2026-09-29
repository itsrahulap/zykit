import { describe, expect, it } from 'vitest';
import { buildHtmlSnippet, buildIco, buildManifest, normalizeBasePath, readIcoDirectory } from '../../../src/tools/favicon-generator/features/favicon';

const fakePng = (n: number) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: n }, (_, i) => i & 0xff)]);
const SITE = { name: 'Zykit', shortName: '', themeColor: '#059669', backgroundColor: '#ffffff', basePath: '/' };

describe('ICO writer', () => {
  it('writes a directory with one PNG entry per size', () => {
    const images = [16, 32, 48, 256].map((s) => ({ width: s, height: s, png: fakePng(s) }));
    const ico = buildIco(images);
    expect([...ico.subarray(0, 6)]).toEqual([0, 0, 1, 0, 4, 0]);
    expect(ico[6 + 48]).toBe(0); // 256 is stored as 0
    const dir = readIcoDirectory(ico);
    expect(dir.map((e) => e.width)).toEqual([16, 32, 48, 256]);
    expect(dir.every((e) => e.bitCount === 32)).toBe(true);
    expect(dir[0].offset).toBe(6 + 16 * 4);
    dir.forEach((e, i) => {
      expect(e.size).toBe(images[i].png.length);
      expect([...ico.subarray(e.offset, e.offset + e.size)]).toEqual([...images[i].png]);
    });
    expect(ico.length).toBe(6 + 64 + images.reduce((s, i) => s + i.png.length, 0));
  });

  it('rejects bad input', () => {
    expect(() => buildIco([])).toThrow();
    expect(() => buildIco([{ width: 300, height: 300, png: fakePng(1) }])).toThrow(/1–256/);
    expect(() => buildIco([{ width: 16, height: 16, png: new Uint8Array(20) }])).toThrow(/PNG/);
    expect(() => readIcoDirectory(new Uint8Array([0, 0, 2, 0, 1, 0]))).toThrow(/Not an ICO/);
    const ico = buildIco([{ width: 16, height: 16, png: fakePng(10) }]);
    expect(() => readIcoDirectory(ico.subarray(0, ico.length - 1))).toThrow(/past the end/);
  });
});

describe('manifest and HTML', () => {
  it('builds a web manifest', () => {
    const m = JSON.parse(buildManifest(SITE));
    expect(m).toMatchObject({ name: 'Zykit', short_name: 'Zykit', theme_color: '#059669', display: 'standalone' });
    expect(m.icons).toEqual([
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ]);
    expect(JSON.parse(buildManifest({ ...SITE, name: 'He said "hi" </script>', themeColor: 'red' }))).toMatchObject({ name: 'He said "hi" </script>', theme_color: '#ffffff' });
  });

  it('builds the link tags with a base path', () => {
    const html = buildHtmlSnippet({ ...SITE, basePath: 'static/icons' });
    expect(html).toContain('<link rel="icon" href="/static/icons/favicon.ico" sizes="48x48">');
    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/static/icons/apple-touch-icon.png">');
    expect(html).toContain('<meta name="theme-color" content="#059669">');
    expect(html.split('\n')).toHaveLength(6);
  });

  it('normalises base paths safely', () => {
    expect(normalizeBasePath('')).toBe('/');
    expect(normalizeBasePath('/')).toBe('/');
    expect(normalizeBasePath('icons')).toBe('/icons/');
    expect(normalizeBasePath('/a//b/')).toBe('/a/b/');
    expect(normalizeBasePath('"><script>')).toBe('/script/');
  });
});
