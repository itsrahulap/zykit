import { describe, expect, it } from 'vitest';
import { generate, matches, normalizePath, parse, PRESETS, selectGroups, testUrl, toPath } from '../../../src/tools/robots-txt-generator/features/robots';

const doc = (text: string) => parse(text).doc;

describe('generate', () => {
  it('writes groups and sitemaps', () => {
    const out = generate({
      groups: [
        { userAgents: ['GPTBot', 'ClaudeBot'], rules: [{ type: 'disallow', path: '/' }] },
        { userAgents: ['*'], rules: [{ type: 'allow', path: '/' }], crawlDelay: '5' },
        { userAgents: [''], rules: [] },
      ],
      sitemaps: ['https://ex.com/sitemap.xml', ''],
    });
    expect(out).toBe('User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nCrawl-delay: 5\n\nSitemap: https://ex.com/sitemap.xml\n');
  });

  it('presets round-trip through the parser', () => {
    for (const p of PRESETS) {
      const text = generate(p.doc());
      const { issues } = parse(text);
      expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
    }
    const ai = doc(generate(PRESETS.find((p) => p.id === 'block-ai')!.doc()));
    expect(testUrl(ai, 'GPTBot', '/page').allowed).toBe(false);
    expect(testUrl(ai, 'Googlebot', '/page').allowed).toBe(true);
    expect(testUrl(ai, 'Google-Extended', '/page').allowed).toBe(false);
  });
});

describe('matching (RFC 9309)', () => {
  it('handles * and $', () => {
    expect(matches('/fish', '/fish.html')).toBe(true);
    expect(matches('/fish', '/Fish.asp')).toBe(false);
    expect(matches('/*.php', '/index.php?x=1')).toBe(true);
    expect(matches('/*.php$', '/index.php?x=1')).toBe(false);
    expect(matches('/*.php$', '/a/b.php')).toBe(true);
    expect(matches('/fish*', '/fish')).toBe(true);
    expect(matches('*', '/anything')).toBe(true);
    expect(matches('/a*b*c', '/axxbyyc')).toBe(true);
    expect(matches('/a*b*c$', '/axxbyycd')).toBe(false);
  });

  it('longest match wins; Allow wins ties', () => {
    const d = doc('User-agent: *\nDisallow: /folder/\nAllow: /folder/page\nDisallow: /tie\nAllow: /tie\nDisallow: /*.gif$');
    expect(testUrl(d, 'x', '/folder/other').allowed).toBe(false);
    expect(testUrl(d, 'x', '/folder/page.html').allowed).toBe(true);
    expect(testUrl(d, 'x', '/tie').allowed).toBe(true);
    expect(testUrl(d, 'x', '/img/a.gif').allowed).toBe(false);
    expect(testUrl(d, 'x', '/img/a.gif?x').allowed).toBe(true);
    expect(testUrl(d, 'x', '/robots.txt').allowed).toBe(true);
    expect(testUrl(d, 'x', '/folder/other').rule?.line).toBe(2);
  });

  it('empty Disallow allows everything', () => {
    expect(testUrl(doc('User-agent: *\nDisallow:'), 'x', '/a').allowed).toBe(true);
  });

  it('normalises percent-encoding', () => {
    expect(normalizePath('/%7efoo/%2fbar/ä')).toBe('/~foo/%2Fbar/%C3%A4');
    expect(testUrl(doc('User-agent: *\nDisallow: /ä'), 'x', '/%C3%A4x').allowed).toBe(false);
  });

  it('selects the most specific group and merges duplicates', () => {
    const d = doc('User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nDisallow: /a\n\nUser-agent: googlebot-news\nDisallow: /b\n\nUser-agent: Googlebot\nDisallow: /c');
    expect(selectGroups(d, 'Googlebot').groups).toHaveLength(2);
    expect(testUrl(d, 'Googlebot', '/c').allowed).toBe(false);
    expect(testUrl(d, 'Googlebot', '/x').allowed).toBe(true);
    expect(testUrl(d, 'Googlebot-News', '/b').allowed).toBe(false);
    expect(testUrl(d, 'Googlebot-News', '/a').allowed).toBe(true);
    expect(testUrl(d, 'Googlebot-Image', '/a').allowed).toBe(false); // falls back to Googlebot
    expect(testUrl(d, 'Bingbot', '/x').allowed).toBe(false);
    expect(testUrl(d, 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '/a').allowed).toBe(false);
  });

  it('allows everything when no group applies', () => {
    expect(testUrl(doc('User-agent: Foo\nDisallow: /'), 'Bar', '/').allowed).toBe(true);
  });

  it('extracts the path from a full URL', () => {
    expect(toPath('https://ex.com/a/b?c=1#d')).toBe('/a/b?c=1');
    expect(toPath('a?b')).toBe('/a?b');
  });
});

describe('lint', () => {
  it('flags problems', () => {
    const { issues, doc: d } = parse('Disallow: /early\nUser-agent: *\nDisalow: /typo\nCrawl-delay: abc\nSitemap: /relative.xml\nNoindex: /x\nno colon here\nAllow: private');
    const msgs = issues.map((i) => `${i.line}:${i.severity}:${i.message}`);
    expect(msgs.some((m) => m.startsWith('1:error') && m.includes('before any User-agent'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('3:warning') && m.includes('Unknown directive "Disalow"'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('4:error') && m.includes('number'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('5:error') && m.includes('absolute'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('6:info') && m.includes('Noindex'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('7:error') && m.includes('Missing ":"'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('8:warning') && m.includes('should start with'))).toBe(true);
    expect(d.groups).toHaveLength(1);
  });

  it('groups consecutive user-agent lines and ignores comments', () => {
    const d = doc('# hi\nUser-agent: a # comment\nUser-agent: b\nDisallow: /x\nUser-agent: c\nAllow: /');
    expect(d.groups.map((g) => g.userAgents)).toEqual([['a', 'b'], ['c']]);
  });
});
