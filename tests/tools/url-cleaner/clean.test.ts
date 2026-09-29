import { describe, expect, it } from 'vitest';
import { cleanLines, cleanText, cleanUrl, DEFAULT_GROUPS, findUrls, type CleanOptions } from '../../../src/tools/url-cleaner/features/clean';

const opts: CleanOptions = { groups: DEFAULT_GROUPS, extraStrip: [], keep: [], unwrap: true };

describe('cleanUrl', () => {
  it('removes utm and click IDs, keeps other params and the fragment', () => {
    const r = cleanUrl('https://example.com/a?id=42&utm_source=x&UTM_Medium=y&fbclid=abc&q=a%20b#top', opts);
    expect(r.output).toBe('https://example.com/a?id=42&q=a%20b#top');
    expect(r.removed.map((p) => p.key)).toEqual(['utm_source', 'UTM_Medium', 'fbclid']);
  });

  it('drops the empty "?"', () => {
    expect(cleanUrl('https://example.com/?gclid=1&msclkid=2', opts).output).toBe('https://example.com/');
    expect(cleanUrl('https://example.com/p?utm_source=x#h', opts).output).toBe('https://example.com/p#h');
  });

  it('strips si only on YouTube / Spotify', () => {
    expect(cleanUrl('https://youtu.be/abc?si=XYZ&t=42', opts).output).toBe('https://youtu.be/abc?t=42');
    expect(cleanUrl('https://open.spotify.com/track/1?si=abc', opts).output).toBe('https://open.spotify.com/track/1');
    expect(cleanUrl('https://example.com/?si=keep', opts).output).toBe('https://example.com/?si=keep');
  });

  it('handles email and prefix params', () => {
    const r = cleanUrl('https://ex.com/?mc_eid=1&mc_cid=2&_hsenc=3&_hsmi=4&oly_enc_id=5&vero_id=6&_ga=7&_gl=8&spm=9&trk=10&igshid=11&yclid=12&ttclid=13&twclid=14&li_fat_id=15&s_cid=16&dclid=17&gbraid=18&wbraid=19&ok=1', opts);
    expect(r.output).toBe('https://ex.com/?ok=1');
    expect(r.removed).toHaveLength(19);
  });

  it('respects group toggles and custom lists', () => {
    const noUtm = { ...opts, groups: DEFAULT_GROUPS.filter((g) => g !== 'utm') };
    expect(cleanUrl('https://ex.com/?utm_source=a&fbclid=b', noUtm).output).toBe('https://ex.com/?utm_source=a');
    expect(cleanUrl('https://ex.com/?aff_id=1&aff_sub=2&x=1', { ...opts, extraStrip: ['aff_*'] }).output).toBe('https://ex.com/?x=1');
    expect(cleanUrl('https://ex.com/?utm_campaign=a&utm_source=b', { ...opts, keep: ['utm_campaign'] }).output).toBe('https://ex.com/?utm_campaign=a');
  });

  it('unwraps redirect links and cleans the target', () => {
    const g = cleanUrl('https://www.google.com/url?q=https://shop.example.org/item?color=blue%26gclid%3Dx&sa=D', opts);
    expect(g.output).toBe('https://shop.example.org/item?color=blue');
    expect(g.unwrapped).toEqual(['www.google.com']);
    expect(cleanUrl('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2F%3Fa%3D1%26fbclid%3Dz&h=AT0', opts).output).toBe('https://example.com/?a=1');
    expect(cleanUrl('https://out.reddit.com/t3_abc?url=https%3A%2F%2Fexample.com%2Fx&token=1', opts).output).toBe('https://example.com/x');
    expect(cleanUrl('https://www.google.com/url?q=https://example.com/', { ...opts, unwrap: false }).output).toContain('google.com/url');
  });

  it('notes shorteners that cannot be unwrapped', () => {
    const r = cleanUrl('https://t.co/abc', opts);
    expect(r.output).toBe('https://t.co/abc');
    expect(r.notes[0]).toMatch(/can't be unwrapped offline/);
  });

  it('reports invalid URLs', () => {
    expect(cleanUrl('not a url', opts).ok).toBe(false);
    expect(cleanUrl('javascript:alert(1)', opts).ok).toBe(false);
  });
});

describe('text mode', () => {
  it('finds URLs and trims punctuation', () => {
    const spans = findUrls('See (https://ex.com/a?utm_source=x). And https://en.wikipedia.org/wiki/Foo_(bar), ok');
    expect(spans.map((s) => s.url)).toEqual(['https://ex.com/a?utm_source=x', 'https://en.wikipedia.org/wiki/Foo_(bar)']);
  });

  it('cleans links in place', () => {
    const r = cleanText('Hi https://ex.com/?utm_source=x&a=1, bye', opts);
    expect(r.text).toBe('Hi https://ex.com/?a=1, bye');
    expect(r.results).toHaveLength(1);
  });

  it('cleans one per line', () => {
    expect(cleanLines('https://a.com/?fbclid=1\n\nhttps://b.com/', opts).map((r) => r.output)).toEqual(['https://a.com/', 'https://b.com/']);
  });
});
