import { describe, expect, it } from 'vitest';
import { analyze, analyzeJsonLd, resolveUrl, truncate } from '../../../src/tools/meta-tag-inspector/features/analyze';
import type { PageMeta } from '../../../src/tools/meta-tag-inspector/features/extract';

const page = (p: Partial<PageMeta>): PageMeta => ({
  titles: [],
  lang: null,
  baseHref: null,
  metas: [],
  links: [],
  jsonLd: [],
  headings: [],
  images: 0,
  imagesWithoutAlt: 0,
  ...p,
});

const good = page({
  titles: ['Handmade Ceramic Mugs | Clay & Co. Pottery Studio'],
  lang: 'en',
  metas: [
    { charset: 'utf-8', content: '' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Wheel-thrown stoneware mugs, glazed by hand in small batches. Dishwasher safe, shipped plastic-free.' },
    { property: 'og:title', content: 'Mugs' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: 'https://clay.example/img/og.jpg' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url', content: 'https://clay.example/mugs' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  links: [
    { rel: 'canonical', href: 'https://clay.example/mugs' },
    { rel: 'icon', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', href: '/apple.png', sizes: '180x180' },
    { rel: 'alternate', href: '/mugs', hreflang: 'en' },
    { rel: 'alternate', href: '/de/tassen', hreflang: 'de-DE' },
    { rel: 'alternate', href: '/mugs', hreflang: 'x-default' },
  ],
  jsonLd: ['{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":["Product","Thing"],"offers":{"@type":"Offer"}}]}'],
  headings: [
    { level: 1, text: 'Mugs' },
    { level: 2, text: 'Glazes' },
  ],
});

const levels = (a: ReturnType<typeof analyze>, l: string) => a.checks.filter((c) => c.level === l).map((c) => c.message);

describe('analyze', () => {
  it('passes a well-tagged page', () => {
    const a = analyze(good);
    expect(levels(a, 'error')).toEqual([]);
    expect(levels(a, 'warning')).toEqual([]);
    expect(a.title.state).toBe('ok');
    expect(a.description.state).toBe('ok');
    expect(a.canonical).toBe('https://clay.example/mugs');
    expect(a.preview.image).toBe('https://clay.example/img/og.jpg');
    expect(a.preview.siteName).toBe('clay.example');
    expect(a.icons.map((i) => i.href)).toEqual(['https://clay.example/favicon.svg', 'https://clay.example/apple.png']);
    expect(a.hreflang[1]).toEqual({ lang: 'de-DE', href: 'https://clay.example/de/tassen' });
    expect(a.jsonLd[0].types).toEqual(['Organization', 'Product', 'Thing', 'Offer']);
    expect(a.h1Count).toBe(1);
  });

  it('flags missing and problematic tags', () => {
    const a = analyze(
      page({
        titles: ['Hi', 'Again'],
        metas: [
          { name: 'robots', content: 'noindex, nofollow' },
          { name: 'viewport', content: 'width=device-width, maximum-scale=1' },
          { property: 'og:image', content: 'img.jpg' },
          { property: 'og:image:width', content: '300' },
          { property: 'og:image:height', content: '200' },
          { charset: 'iso-8859-1', content: '' },
        ],
        links: [
          { rel: 'canonical', href: '/a' },
          { rel: 'canonical', href: '/b' },
          { rel: 'alternate', href: '/x', hreflang: 'english' },
        ],
        jsonLd: ['{ bad json'],
        headings: [
          { level: 2, text: 'A' },
          { level: 4, text: 'B' },
        ],
        images: 3,
        imagesWithoutAlt: 2,
      }),
    );
    const all = a.checks.map((c) => `${c.level}: ${c.message}`).join('\n');
    expect(a.title.state).toBe('short');
    expect(all).toMatch(/warning: Title is 2 characters/);
    expect(all).toMatch(/2 <title> elements/);
    expect(all).toMatch(/warning: No meta description/);
    expect(all).toMatch(/error: 2 canonical links/);
    expect(all).toMatch(/warning: The canonical URL is relative/);
    expect(all).toMatch(/error: The page asks search engines not to index/);
    expect(all).toMatch(/nofollow/);
    expect(all).toMatch(/blocks zooming/);
    expect(all).toMatch(/charset is iso-8859-1/);
    expect(all).toMatch(/warning: No lang attribute/);
    expect(all).toMatch(/Invalid hreflang value: english/);
    expect(all).toMatch(/og:image should be an absolute URL/);
    expect(all).toMatch(/300×200/);
    expect(all).toMatch(/error: JSON-LD block 1 is not valid JSON/);
    expect(all).toMatch(/warning: No <h1>/);
    expect(all).toMatch(/skip from h2 to h4/);
    expect(all).toMatch(/2 of 3 images lack an alt/);
  });

  it('checks description and title length boundaries', () => {
    const t = (s: string) => analyze(page({ titles: [s] })).title.state;
    expect(t('x'.repeat(29))).toBe('short');
    expect(t('x'.repeat(30))).toBe('ok');
    expect(t('x'.repeat(60))).toBe('ok');
    expect(t('x'.repeat(61))).toBe('long');
    const d = (s: string) => analyze(page({ metas: [{ name: 'description', content: s }] })).description.state;
    expect(d('x'.repeat(69))).toBe('short');
    expect(d('x'.repeat(160))).toBe('ok');
    expect(d('x'.repeat(161))).toBe('long');
    expect(d('   ')).toBe('missing');
  });

  it('falls back from Twitter tags to Open Graph', () => {
    const a = analyze(page({ metas: [{ property: 'og:title', content: 'OG' }, { property: 'og:image', content: 'https://x.test/i.png' }] }));
    expect(a.preview.twitterCard).toBe('summary');
    expect(a.preview.twitterImage).toBe('https://x.test/i.png');
    expect(a.checks.some((c) => /falls back to Open Graph/.test(c.message))).toBe(true);
  });
});

describe('helpers', () => {
  it('resolves URLs and parses JSON-LD', () => {
    expect(resolveUrl('/a', 'https://x.test/b/c')).toBe('https://x.test/a');
    expect(resolveUrl('rel', null)).toBe('rel');
    expect(analyzeJsonLd(['[{"@type":"A"}]', 'nope'])).toMatchObject([{ types: ['A'] }, { pretty: null }]);
    expect(truncate('abcdef', 4)).toBe('abc…');
  });
});
