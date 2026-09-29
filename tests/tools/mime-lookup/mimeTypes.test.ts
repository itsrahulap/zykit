import { describe, expect, it } from 'vitest';
import { extensionOf, lookupExtension, MIME_TYPES, searchMime } from '../../../src/tools/mime-lookup/features/mimeTypes';

const mimeOf = (q: string) => lookupExtension(q)?.mime;

describe('data', () => {
  it('has about 300 unique types', () => {
    expect(MIME_TYPES.length).toBeGreaterThanOrEqual(280);
    expect(new Set(MIME_TYPES.map((t) => t.mime)).size).toBe(MIME_TYPES.length);
    for (const t of MIME_TYPES) expect(t.mime).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/i);
  });

  it('maps modern extensions', () => {
    expect(mimeOf('avif')).toBe('image/avif');
    expect(mimeOf('heic')).toBe('image/heic');
    expect(mimeOf('webp')).toBe('image/webp');
    expect(mimeOf('wasm')).toBe('application/wasm');
    expect(mimeOf('mjs')).toBe('text/javascript');
    expect(mimeOf('woff2')).toBe('font/woff2');
    expect(mimeOf('jsonld')).toBe('application/ld+json');
    expect(mimeOf('webmanifest')).toBe('application/manifest+json');
    expect(mimeOf('md')).toBe('text/markdown');
    expect(mimeOf('yaml')).toBe('application/yaml');
    expect(mimeOf('toml')).toBe('application/toml');
  });

  it('marks compressibility', () => {
    expect(lookupExtension('png')!.compressible).toBe(false);
    expect(lookupExtension('svg')!.compressible).toBe(true);
    expect(lookupExtension('json')!.compressible).toBe(true);
    expect(lookupExtension('woff2')!.compressible).toBe(false);
    expect(lookupExtension('ttf')!.compressible).toBe(true);
    expect(lookupExtension('zip')!.compressible).toBe(false);
  });
});

describe('extensionOf / lookupExtension', () => {
  it('handles file names', () => {
    expect(extensionOf('report.final.pdf')).toBe('pdf');
    expect(extensionOf('C:\\x\\Photo.JPG')).toBe('jpg');
    expect(extensionOf('archive.tar.gz')).toBe('tar.gz');
    expect(extensionOf('.gitignore')).toBe('');
    expect(extensionOf('Makefile')).toBe('');
    expect(mimeOf('report.final.pdf')).toBe('application/pdf');
    expect(mimeOf('.png')).toBe('image/png');
    expect(mimeOf('backup.tar.gz')).toBe('application/gzip');
    expect(mimeOf('nothing.unknownext')).toBeUndefined();
  });
});

describe('searchMime', () => {
  it('finds by extension first', () => {
    expect(searchMime('png')[0].mime).toBe('image/png');
    expect(searchMime('.png')[0].mime).toBe('image/png');
    expect(searchMime('ts').slice(0, 2).map((t) => t.mime)).toEqual(['video/mp2t', 'text/typescript']);
  });

  it('finds by MIME prefix', () => {
    const r = searchMime('image/');
    expect(r.length).toBeGreaterThan(20);
    expect(r.every((t) => t.mime.startsWith('image/'))).toBe(true);
    expect(searchMime('application/json')[0].mime).toBe('application/json');
  });

  it('finds by file name', () => {
    expect(searchMime('report.final.pdf').map((t) => t.mime)).toEqual(['application/pdf']);
  });

  it('returns nothing for gibberish', () => {
    expect(searchMime('qqqqzz')).toEqual([]);
  });
});
