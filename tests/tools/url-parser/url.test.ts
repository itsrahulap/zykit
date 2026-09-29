import { describe, expect, it } from 'vitest';
import { defaultPort, hostToUnicode, paramRows, parseUrl, pathSegments, punycodeDecode, rebuild } from '../../../src/tools/url-parser/features/url';

describe('parseUrl', () => {
  it('parses absolute URLs', () => {
    const r = parseUrl('  https://user:p%40ss@Example.com:8443/a/b%20c/?q=1&q=2&x=%C3%A9#frag ');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.relative).toBe(false);
    expect(r.url.hostname).toBe('example.com');
    expect(r.url.port).toBe('8443');
    expect(r.url.username).toBe('user');
    expect(r.url.password).toBe('p%40ss');
    expect(pathSegments(r.url)).toEqual(['a', 'b c', '']);
    expect(paramRows(r.url).map((p) => [p.key, p.value])).toEqual([
      ['q', '1'],
      ['q', '2'],
      ['x', 'é'],
    ]);
    expect(r.url.hash).toBe('#frag');
  });
  it('resolves relative URLs against a base', () => {
    const r = parseUrl('../img/logo.png?v=2', 'https://example.com/docs/guide/page.html');
    expect(r.ok && r.url.href).toBe('https://example.com/docs/img/logo.png?v=2');
    expect(r.ok && r.relative).toBe(true);
  });
  it('explains errors', () => {
    expect(parseUrl('')).toEqual({ ok: false, error: 'Enter a URL.' });
    expect(parseUrl('/path/only')).toMatchObject({
      ok: false,
      error: expect.stringMatching(/relative URL/),
    });
    expect(parseUrl('example.com/x')).toMatchObject({
      ok: false,
      error: expect.stringMatching(/relative URL/),
    });
    expect(parseUrl('/x', 'not a base')).toMatchObject({
      ok: false,
      error: expect.stringMatching(/base URL is not valid/),
    });
    expect(parseUrl('https://exa mple.com')).toMatchObject({ ok: false });
  });
  it('handles IDN hosts and opaque paths', () => {
    const r = parseUrl('https://münchen.de/');
    expect(r.ok && r.url.hostname).toBe('xn--mnchen-3ya.de');
    expect(hostToUnicode('xn--mnchen-3ya.de')).toBe('münchen.de');
    expect(punycodeDecode('ls8h')).toBe('💩');
    expect(hostToUnicode('xn--fsqu00a.xn--0zwm56d')).toBe('例子.测试');
    expect(hostToUnicode('xn--!!.com')).toBe('xn--!!.com');
    const m = parseUrl('mailto:a@b.c');
    expect(m.ok && pathSegments(m.url)).toEqual(['a@b.c']);
  });
});

describe('ports and rebuild', () => {
  it('knows default ports', () => {
    expect(defaultPort('https:')).toBe('443');
    expect(defaultPort('http:')).toBe('80');
    expect(defaultPort('gopher:')).toBeUndefined();
  });
  it('rebuilds the query keeping duplicates and order', () => {
    const r = parseUrl('https://a.com/p?b=1&a=2#h');
    if (!r.ok) throw new Error('parse failed');
    const rows = paramRows(r.url);
    expect(rebuild(r.url, [...rows, { id: 9, key: 'b', value: 'x y&z' }])).toBe('https://a.com/p?b=1&a=2&b=x+y%26z#h');
    expect(rebuild(r.url, [])).toBe('https://a.com/p#h');
    expect(rebuild(r.url, [{ id: 1, key: '', value: '' }])).toBe('https://a.com/p#h');
  });
});
