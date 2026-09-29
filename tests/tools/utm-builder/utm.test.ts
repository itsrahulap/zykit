import { describe, expect, it } from 'vitest';
import { addToHistory, buildBulk, buildUtmUrl, formatValue, parseBase, parseHistory, HISTORY_LIMIT } from '../../../src/tools/utm-builder/features/utm';

const opts = { lowercase: true, spaces: 'dash' as const };
const base = { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'spring' };

describe('formatValue', () => {
  it('lowercases and replaces spaces', () => {
    expect(formatValue('  Spring Sale  2026 ', opts)).toBe('spring-sale-2026');
    expect(formatValue('Spring Sale', { lowercase: false, spaces: 'underscore' })).toBe('Spring_Sale');
    expect(formatValue('Spring   Sale', { lowercase: false, spaces: 'encode' })).toBe('Spring Sale');
  });
});

describe('buildUtmUrl', () => {
  it('keeps existing params and the fragment', () => {
    const r = buildUtmUrl('https://example.com/p?plan=pro&x=a%20b#faq', base, opts);
    expect(r.ok).toBe(true);
    expect(r.url).toBe('https://example.com/p?plan=pro&x=a%20b&utm_source=newsletter&utm_medium=email&utm_campaign=spring#faq');
    expect(r.warnings).toEqual([]);
  });

  it('encodes spaces as %20 in encode mode', () => {
    const r = buildUtmUrl('https://example.com', { ...base, utm_campaign: 'Spring Sale & more' }, { lowercase: false, spaces: 'encode' });
    expect(r.url).toContain('utm_campaign=Spring%20Sale%20%26%20more');
    expect(r.warnings.some((w) => w.includes('Mixed case'))).toBe(true);
  });

  it('adds https when the scheme is missing', () => {
    const r = buildUtmUrl('example.com/a', base, opts);
    expect(r.url.startsWith('https://example.com/a?')).toBe(true);
    expect(r.warnings[0]).toMatch(/https:\/\/ was added/);
  });

  it('warns about missing required fields', () => {
    const r = buildUtmUrl('https://example.com', { utm_source: 'x' }, opts);
    expect(r.warnings.some((w) => w.includes('utm_medium, utm_campaign'))).toBe(true);
  });

  it('replaces existing utm params instead of duplicating them', () => {
    const r = buildUtmUrl('https://example.com/?utm_source=old&a=1', base, opts);
    expect(r.url).toBe('https://example.com/?a=1&utm_source=newsletter&utm_medium=email&utm_campaign=spring');
    expect(r.warnings.some((w) => w.includes('Replaced existing utm_source'))).toBe(true);
  });

  it('flags internal links', () => {
    const r = buildUtmUrl('https://www.example.com/a', base, { ...opts, siteHost: 'https://example.com' });
    expect(r.warnings.some((w) => w.includes('your own site'))).toBe(true);
  });

  it('rejects invalid and non-http URLs', () => {
    expect(buildUtmUrl('', base, opts).ok).toBe(false);
    expect(buildUtmUrl('ftp://example.com', base, opts).ok).toBe(false);
    expect(parseBase('localhost:3000/x')?.url.href).toBe('https://localhost:3000/x');
  });

  it('bulk mode tags every line', () => {
    const rows = buildBulk('https://a.com\n\nb.com/x\nnot a url', base, opts);
    expect(rows).toHaveLength(3);
    expect(rows[0].result.url).toContain('https://a.com/?utm_source=newsletter');
    expect(rows[2].result.ok).toBe(false);
  });
});

describe('history', () => {
  it('dedupes, caps and survives junk', () => {
    let h = addToHistory([], 'a', 1);
    h = addToHistory(h, 'b', 2);
    h = addToHistory(h, 'a', 3);
    expect(h.map((x) => x.url)).toEqual(['a', 'b']);
    for (let i = 0; i < 60; i++) h = addToHistory(h, `u${i}`, i);
    expect(h).toHaveLength(HISTORY_LIMIT);
    expect(parseHistory('not json')).toEqual([]);
    expect(parseHistory('[{"url":"x","at":1},{"bad":true}]')).toEqual([{ url: 'x', at: 1 }]);
  });
});
