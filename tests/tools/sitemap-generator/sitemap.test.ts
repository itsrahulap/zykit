import { describe, expect, it } from 'vitest';
import { buildSitemaps, escapeXml, isW3cDate, parseUrlList, parseXml, validateSitemap } from '../../../src/tools/sitemap-generator/features/sitemap';

describe('parseUrlList', () => {
  it('validates, dedupes and reads per-URL columns', () => {
    const r = parseUrlList('https://ex.com/\nhttps://ex.com/a 2026-01-15 0.8 weekly\n/relative\nhttps://ex.com/#frag\nhttps://other.org/x, 1.0\nhttps://ex.com/b bogus\n# comment');
    expect(r.entries.map((e) => e.loc)).toEqual(['https://ex.com/', 'https://ex.com/a', 'https://other.org/x', 'https://ex.com/b']);
    expect(r.entries[1]).toEqual({ loc: 'https://ex.com/a', lastmod: '2026-01-15', priority: '0.8', changefreq: 'weekly' });
    expect(r.entries[2].priority).toBe('1.0');
    expect(r.duplicates).toBe(1);
    expect(r.problems.map((p) => p.line)).toEqual([3, 6]);
    expect(r.hosts).toEqual(['ex.com', 'other.org']);
  });

  it('extracts URLs from text', () => {
    const r = parseUrlList('Links: https://ex.com/a, and (https://ex.com/b). Again https://ex.com/a', true);
    expect(r.entries.map((e) => e.loc)).toEqual(['https://ex.com/a', 'https://ex.com/b']);
  });

  it('checks dates', () => {
    expect(isW3cDate('2026-02-28')).toBe(true);
    expect(isW3cDate('2026-02-30')).toBe(false);
    expect(isW3cDate('2026-09-29T10:00:00+02:00')).toBe(true);
    expect(isW3cDate('29/09/2026')).toBe(false);
  });
});

describe('buildSitemaps', () => {
  it('writes an escaped single sitemap', () => {
    const { files, index } = buildSitemaps([{ loc: 'https://ex.com/?a=1&b=<2>' }, { loc: "https://ex.com/it's", priority: '0.5' }], { lastmod: '2026-01-01', changefreq: 'daily' }, { baseUrl: 'https://ex.com' });
    expect(index).toBeNull();
    expect(files[0].name).toBe('sitemap.xml');
    expect(files[0].content).toContain('<loc>https://ex.com/?a=1&amp;b=&lt;2&gt;</loc>');
    expect(files[0].content).toContain('<loc>https://ex.com/it&apos;s</loc>');
    expect(files[0].content).toContain('<changefreq>daily</changefreq>');
    expect(files[0].content).toContain('<priority>0.5</priority>');
    expect(validateSitemap(files[0].content)).toEqual({ kind: 'urlset', count: 2, issues: [] });
  });

  it('splits by URL count and writes an index', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ loc: `https://ex.com/${i}` }));
    const { files, index } = buildSitemaps(entries, {}, { baseUrl: 'https://ex.com/maps', maxUrls: 2 });
    expect(files.map((f) => f.urls)).toEqual([2, 2, 1]);
    expect(index?.content).toContain('<loc>https://ex.com/maps/sitemap-3.xml</loc>');
    expect(validateSitemap(index!.content).kind).toBe('sitemapindex');
    for (const f of files) expect(validateSitemap(f.content).issues).toEqual([]);
  });

  it('splits by size', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ loc: `https://ex.com/${'x'.repeat(100)}${i}` }));
    const { files } = buildSitemaps(entries, {}, { baseUrl: 'https://ex.com', maxBytes: 600 });
    expect(files.length).toBeGreaterThan(1);
    for (const f of files) expect(new TextEncoder().encode(f.content).length).toBeLessThanOrEqual(600);
  });

  it('escapes all five XML specials', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;');
  });
});

describe('validateSitemap', () => {
  it('reports malformed XML with a line', () => {
    const v = validateSitemap('<?xml version="1.0"?>\n<urlset>\n<url><loc>a</url>\n</urlset>');
    expect(v.kind).toBeNull();
    expect(v.issues[0]).toMatchObject({ severity: 'error', line: 3 });
    expect(validateSitemap('<urlset xmlns="x"><url><loc>https://a.com/?a=1&b=2</loc></url></urlset>').issues[0].message).toMatch(/Unescaped "&"/);
  });

  it('checks namespace, duplicates, values and hosts', () => {
    const v = validateSitemap(`<urlset xmlns="http://example.com/wrong">
<url><loc>https://a.com/</loc><lastmod>yesterday</lastmod><priority>2</priority><changefreq>sometimes</changefreq></url>
<url><loc>https://a.com/</loc></url>
<url><loc>https://b.com/</loc></url>
<url><loc>not-a-url</loc></url>
<url></url>
</urlset>`);
    const m = v.issues.map((i) => i.message).join('\n');
    expect(v.count).toBe(5);
    expect(m).toMatch(/namespace/);
    expect(m).toMatch(/lastmod "yesterday"/);
    expect(m).toMatch(/priority "2"/);
    expect(m).toMatch(/changefreq "sometimes"/);
    expect(m).toMatch(/Duplicate URL \(first on line 2\)/);
    expect(m).toMatch(/Invalid URL/);
    expect(m).toMatch(/without <loc>/);
    expect(m).toMatch(/span 2 hosts/);
  });

  it('rejects wrong roots and doctype', () => {
    expect(validateSitemap('<html></html>').issues[0].message).toMatch(/Root element is <html>/);
    expect(validateSitemap('<!DOCTYPE x><urlset/>').issues[0].message).toMatch(/DOCTYPE/);
  });

  it('parses comments, CDATA, entities and prefixed roots', () => {
    const root = parseXml('<?xml version="1.0"?><!-- c --><a x=\'1\'><b><![CDATA[<raw>]]>&amp;&#65;&#x42;</b><c/></a>');
    expect(root.children[0].text).toBe('<raw>&AB');
    expect(root.attrs.x).toBe('1');
    const v = validateSitemap('<s:urlset xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"><s:url><s:loc>https://a.com/</s:loc></s:url></s:urlset>');
    expect(v).toEqual({ kind: 'urlset', count: 1, issues: [] });
  });
});
