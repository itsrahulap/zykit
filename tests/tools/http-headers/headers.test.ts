import { describe, expect, it } from 'vitest';
import { HEADERS, headerInfo } from '../../../src/tools/http-headers/features/headers';
import { groupHeaders, parseHeaders, SAMPLE_HEADERS } from '../../../src/tools/http-headers/features/parse';
import { reviewSecurity, summariseCaching } from '../../../src/tools/http-headers/features/review';
import { describeValue, humanDuration, parseCsp, parseDirectives, parseHsts, parseMediaType, parseSetCookie } from '../../../src/tools/http-headers/features/values';

const check = (text: string, id: string) => reviewSecurity(parseHeaders(text).headers).checks.find((c) => c.id === id)!;

describe('parseHeaders', () => {
  it('parses a status line, duplicates and folded lines', () => {
    const p = parseHeaders('HTTP/1.1 404 Not Found\r\nSet-Cookie: a=1\r\nSet-Cookie: b=2\r\nX-Long: one\r\n  two\r\n\tthree\r\n');
    expect(p.start).toEqual({ kind: 'response', version: 'HTTP/1.1', status: 404, reason: 'Not Found' });
    expect(p.headers.map((h) => [h.name, h.value])).toEqual([
      ['Set-Cookie', 'a=1'],
      ['Set-Cookie', 'b=2'],
      ['X-Long', 'one two three'],
    ]);
    expect(groupHeaders(p.headers).get('set-cookie')).toHaveLength(2);
    expect(p.kind).toBe('response');
  });

  it('keeps the last response of curl -IL redirects', () => {
    const p = parseHeaders('HTTP/1.1 301 Moved Permanently\nLocation: https://x.test/\n\nHTTP/2 200\ncontent-type: text/html\n');
    expect(p.start).toMatchObject({ status: 200, version: 'HTTP/2' });
    expect(p.headers).toHaveLength(1);
    expect(p.notices[0]).toMatch(/2 responses/);
  });

  it('understands curl -v output', () => {
    const p = parseHeaders('* Connected\n> GET / HTTP/2\n> Host: x.test\n>\n< HTTP/2 200\n< server: nginx\n< \n* done');
    expect(p.start).toMatchObject({ kind: 'response', status: 200 });
    expect(p.headers.map((h) => h.name)).toEqual(['server']);
  });

  it('accepts DevTools copies with values on the next line and pseudo headers', () => {
    const p = parseHeaders(':status: 204\ncontent-type:\ntext/plain\nx-empty:\ndate:\nTue, 29 Sep 2026 10:00:00 GMT\nlocation:\nhttps://x.test/a');
    expect(p.start).toMatchObject({ status: 204 });
    expect(p.headers.map((h) => [h.name, h.value])).toEqual([
      ['content-type', 'text/plain'],
      ['x-empty', ''],
      ['date', 'Tue, 29 Sep 2026 10:00:00 GMT'],
      ['location', 'https://x.test/a'],
    ]);
  });

  it('detects request headers and reports junk lines', () => {
    const p = parseHeaders('GET /api HTTP/1.1\nHost: x.test\nnot a header\nBad Name: x');
    expect(p.start).toEqual({ kind: 'request', method: 'GET', target: '/api', version: 'HTTP/1.1' });
    expect(p.invalid).toHaveLength(2);
    expect(parseHeaders('Host: x\nUser-Agent: y\nCookie: a=b').kind).toBe('request');
  });
});

describe('values', () => {
  it('parses cache directives, CSP, cookies, HSTS and media types', () => {
    expect(parseDirectives('public, max-age=300, community="UCI"')).toEqual([{ name: 'public' }, { name: 'max-age', value: '300' }, { name: 'community', value: 'UCI' }]);
    expect(parseCsp("default-src 'self'; script-src 'self' https://a; script-src *")).toEqual([
      { name: 'default-src', sources: ["'self'"] },
      { name: 'script-src', sources: ["'self'", 'https://a'] },
    ]);
    const c = parseSetCookie('sid=abc; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Strict');
    expect(c).toMatchObject({ name: 'sid', value: 'abc', path: '/', maxAge: 3600, httpOnly: true, secure: true, sameSite: 'Strict' });
    expect(parseHsts('max-age=31536000; includeSubDomains; preload')).toEqual({ maxAge: 31536000, includeSubDomains: true, preload: true });
    expect(parseMediaType('text/html; charset="UTF-8"')).toEqual({ type: 'text/html', params: { charset: 'UTF-8' } });
    expect(describeValue('Strict-Transport-Security', 'max-age=31536000')?.[0][1]).toMatch(/365 days/);
    expect(describeValue('cache-control', 'max-age=86400')?.[0][1]).toMatch(/1 day/);
    expect(humanDuration(90)).toBe('1.5 minutes');
  });

  it('has explanations for about 80+ headers', () => {
    expect(Object.keys(HEADERS).length).toBeGreaterThanOrEqual(80);
    expect(headerInfo('CONTENT-TYPE')?.category).toBe('Content');
  });
});

describe('security review', () => {
  it('grades a strong configuration highly', () => {
    const r = reviewSecurity(
      parseHeaders(`strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
x-content-type-options: nosniff
referrer-policy: no-referrer
permissions-policy: camera=()
cross-origin-opener-policy: same-origin
set-cookie: __Host-sid=1; Path=/; Secure; HttpOnly; SameSite=Lax`).headers,
    );
    expect(r.checks.filter((c) => c.level === 'bad' || c.level === 'warn')).toEqual([]);
    expect(r.grade).toBe('A+');
  });

  it('flags weak CSP, cookies, CORS and leaks', () => {
    const csp = check("content-security-policy: script-src 'self' 'unsafe-inline' 'unsafe-eval' https:", 'csp');
    expect(csp.level).toBe('bad');
    expect(csp.details!.join(' ')).toMatch(/unsafe-inline.*unsafe-eval.*https:.*object-src.*base-uri/s);
    expect(check("content-security-policy: script-src 'nonce-abc' 'unsafe-inline' 'strict-dynamic'; object-src 'none'; base-uri 'none'", 'csp').level).toBe('good');
    expect(check('', 'csp').level).toBe('bad');
    expect(check('content-security-policy-report-only: default-src x', 'csp').level).toBe('warn');

    const cookies = check('set-cookie: sessionid=1; Path=/\nset-cookie: pref=dark; Secure; SameSite=None', 'cookies');
    expect(cookies.level).toBe('bad');
    expect(cookies.details).toEqual(['sessionid: missing Secure, HttpOnly, SameSite.', 'pref: missing HttpOnly.']);

    expect(check('access-control-allow-origin: *\naccess-control-allow-credentials: true', 'cors').level).toBe('bad');
    expect(check('access-control-allow-origin: *', 'cors').level).toBe('info');
    expect(check('server: nginx/1.18.0\nx-powered-by: PHP/8.1', 'leaks').details).toEqual(['Server: nginx/1.18.0 (reveals a version)', 'x-powered-by: PHP/8.1']);
    expect(check('server: cloudflare', 'leaks').level).toBe('good');
    expect(check('strict-transport-security: max-age=86400', 'hsts').level).toBe('warn');
    expect(check('x-frame-options: ALLOW-FROM https://a', 'frame').level).toBe('warn');
    expect(check("content-security-policy: frame-ancestors 'self'", 'frame').level).toBe('good');
    expect(check('referrer-policy: unsafe-url', 'referrer').level).toBe('warn');
  });

  it('reviews the sample', () => {
    const r = reviewSecurity(parseHeaders(SAMPLE_HEADERS).headers);
    expect(['C', 'D', 'F']).toContain(r.grade);
  });
});

describe('caching summary', () => {
  const sum = (t: string) => summariseCaching(parseHeaders(t).headers);
  it('explains common setups', () => {
    expect(sum('cache-control: no-store').cacheable).toBe(false);
    expect(sum('cache-control: private, max-age=600').verdict).toBe('Cacheable by the browser only for 10 minutes.');
    expect(sum('cache-control: public, max-age=60, s-maxage=3600').verdict).toBe('Cacheable by browsers and CDNs for 1 hour.');
    expect(sum('cache-control: no-cache\netag: "x"').verdict).toMatch(/revalidated on every use\.$/);
    expect(sum('date: Tue, 29 Sep 2026 10:00:00 GMT\nexpires: Tue, 29 Sep 2026 11:00:00 GMT').rows).toContainEqual(['Browser freshness', '1 hour (Expires − Date)']);
    expect(sum('cache-control: public, max-age=600\nset-cookie: a=b').notes.join(' ')).toMatch(/another user/);
    expect(sum('content-type: text/html').notes.join(' ')).toMatch(/heuristics/);
    expect(sum('cache-control: max-age=100\nage: 40').rows).toContainEqual(['Age', '40 seconds in cache, 1 minute left']);
  });
});
