import { describe, expect, it } from 'vitest';
import { buildRows, entryDetail, isSensitiveHeader, isSensitiveParam, parseHar, redactHar, redactUrl, summarize, typeOf, viewRows } from '../../../src/tools/har-viewer/features/har';

const entry = (over: Record<string, unknown> = {}) => ({
  startedDateTime: '2025-01-01T00:00:00.000Z',
  time: 100,
  request: { method: 'GET', url: 'https://a.test/x?q=1', headers: [{ name: 'Cookie', value: 's=1' }], queryString: [{ name: 'q', value: '1' }] },
  response: { status: 200, headers: [], content: { size: 50, mimeType: 'application/json', text: '{"a":1}' }, bodySize: 20 },
  timings: { blocked: 1, dns: 2, connect: 10, ssl: 4, send: 1, wait: 60, receive: 22 },
  ...over,
});
const har = (entries: unknown[]) => JSON.stringify({ log: { entries } });

describe('parseHar', () => {
  it('accepts a HAR and rejects other JSON with a message', () => {
    expect(parseHar(har([entry()])).ok).toBe(true);
    const r = parseHar('{"a":1}');
    expect(!r.ok && r.error.message).toMatch(/not a HAR/);
  });
  it('reports JSON syntax errors with a position', () => {
    const r = parseHar('{"log":\n{"entries": [,]}}');
    expect(!r.ok && 'line' in r.error && r.error.line).toBe(2);
  });
});

describe('buildRows / summarize', () => {
  const rows = buildRows([
    entry(),
    entry({ startedDateTime: '2025-01-01T00:00:00.500Z', time: 900, request: { method: 'POST', url: 'https://b.test/y' }, response: { status: 500, content: { mimeType: 'text/html' }, bodySize: -1 }, timings: {} }),
  ]);
  it('derives size, start, phases and type', () => {
    expect(rows[0]).toMatchObject({ host: 'a.test', type: 'json', size: 20, start: 0 });
    expect(rows[0].phases.connect).toBe(6); // ssl split out of connect
    expect(rows[1]).toMatchObject({ start: 500, size: 0, type: 'html' });
    expect(rows[1].phases.wait).toBe(900); // no timings: whole time is waiting
  });
  it('summarizes totals, slowest and groups', () => {
    const s = summarize(rows);
    expect(s).toMatchObject({ requests: 2, size: 20, span: 1400, failed: 1 });
    expect(s.slowest[0].i).toBe(1);
    expect(s.byDomain.map((g) => g.name).sort()).toEqual(['a.test', 'b.test']);
    expect(s.byType.map((g) => g.name).sort()).toEqual(['html', 'json']);
  });
  it('filters and sorts', () => {
    expect(viewRows(rows, 'post', null)).toEqual([1]);
    expect(viewRows(rows, '500', null)).toEqual([1]);
    expect(viewRows(rows, '', { key: 'time', dir: 'desc' })).toEqual([1, 0]);
    expect(viewRows(rows, '', { key: 'url', dir: 'asc' })).toEqual([0, 1]);
  });
  it('handles an empty HAR', () => {
    expect(summarize(buildRows([]))).toMatchObject({ requests: 0, span: 0 });
  });
});

describe('entryDetail', () => {
  it('returns headers, query and a text preview', () => {
    const d = entryDetail(entry());
    expect(d.requestHeaders).toEqual([['Cookie', 's=1']]);
    expect(d.query).toEqual([['q', '1']]);
    expect(d.preview?.text).toBe('{"a":1}');
  });
  it('decodes base64 text, refuses binary, caps long text', () => {
    const b64 = entry({ response: { status: 200, content: { mimeType: 'text/plain', encoding: 'base64', text: btoa('héllo'.replace('é', 'e')) } } });
    expect(entryDetail(b64).preview?.text).toBe('hello');
    const bin = entry({ response: { status: 200, content: { mimeType: 'image/png', text: 'AAAA' } } });
    expect(entryDetail(bin).preview).toMatchObject({ text: '', note: expect.stringMatching(/Binary/) as string });
    const big = entry({ response: { status: 200, content: { mimeType: 'text/plain', text: 'x'.repeat(200_000) } } });
    expect(entryDetail(big).preview?.text.length).toBe(100_000);
  });
  it('captures post data', () => {
    const d = entryDetail(entry({ request: { method: 'POST', url: 'u', postData: { mimeType: 'application/json', text: '{}' } } }));
    expect(d.postData).toEqual({ mimeType: 'application/json', text: '{}' });
  });
});

describe('typeOf', () => {
  it.each([['text/html; charset=utf-8', 'html'], ['application/javascript', 'js'], ['image/webp', 'image'], ['font/woff2', 'font'], ['', 'other']])('%s', (m, t) => {
    expect(typeOf(m)).toBe(t);
  });
});

describe('redaction', () => {
  it('detects sensitive header and parameter names', () => {
    for (const h of ['Cookie', 'set-cookie', 'Authorization', 'Proxy-Authorization', 'X-API-Key', 'x-auth-token', 'X-CSRF-Token']) expect(isSensitiveHeader(h), h).toBe(true);
    for (const h of ['Accept', 'Content-Type', 'Cache-Control', 'Host']) expect(isSensitiveHeader(h), h).toBe(false);
    for (const p of ['access_token', 'api_key', 'apiKey', 'code', 'sig', 'password', 'client_secret']) expect(isSensitiveParam(p), p).toBe(true);
    for (const p of ['page', 'q', 'lang', 'id']) expect(isSensitiveParam(p), p).toBe(false);
  });

  it('redacts URLs without touching the rest', () => {
    expect(redactUrl('https://a.com/x?page=2&access_token=abc&q=hi')).toBe('https://a.com/x?page=2&access_token=[REDACTED]&q=hi');
    expect(redactUrl('https://user:pw@a.com/x')).toBe('https://user:[REDACTED]@a.com/x');
    expect(redactUrl('https://a.com/cb#access_token=abc&state=1')).toBe('https://a.com/cb#access_token=[REDACTED]&state=[REDACTED]');
    expect(redactUrl('https://a.com/x?api%5Fkey=1')).toBe('https://a.com/x?api%5Fkey=[REDACTED]');
    expect(redactUrl('https://a.com/#section')).toBe('https://a.com/#section');
    expect(redactUrl('Not a URL? token=1')).toBe('Not a URL? token=1');
  });

  it('produces a valid HAR with secrets replaced', () => {
    const doc = {
      log: {
        version: '1.2',
        pages: [{ id: 'p', title: 'https://a.com/?token=t1' }],
        entries: [
          {
            startedDateTime: '2024-01-01T00:00:00Z',
            time: 10,
            request: {
              method: 'POST',
              url: 'https://a.com/login?token=t2&page=1',
              headers: [{ name: 'Authorization', value: 'Bearer t3' }, { name: 'Accept', value: '*/*' }, { name: 'Referer', value: 'https://a.com/?code=t4' }],
              cookies: [{ name: 'sid', value: 't5' }],
              queryString: [{ name: 'token', value: 't2' }, { name: 'page', value: '1' }],
              postData: { mimeType: 'application/x-www-form-urlencoded', text: 'password=t6', params: [{ name: 'password', value: 't6' }] },
            },
            response: {
              status: 200,
              headers: [{ name: 'Set-Cookie', value: 'sid=t7' }],
              cookies: [{ name: 'sid', value: 't7' }],
              content: { size: 9, mimeType: 'application/json', text: '{"jwt":"t8"}' },
              redirectURL: '',
            },
            timings: { send: 1, wait: 8, receive: 1 },
          },
        ],
      },
    };
    const original = JSON.stringify(doc);
    const keep = redactHar(doc, false);
    expect(JSON.stringify(doc)).toBe(original); // input untouched
    for (const t of ['t1', 't2', 't3', 't4', 't5', 't6', 't7']) expect(keep, t).not.toMatch(new RegExp(`\\b${t}\\b`));
    expect(keep).toContain('t8'); // response bodies kept unless asked
    expect(keep).toContain('*/*');
    const parsed = parseHar(keep);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(buildRows(parsed.entries)[0].url).toBe('https://a.com/login?token=[REDACTED]&page=1');
    const noBodies = redactHar(doc, true);
    expect(noBodies).not.toContain('t8');
    expect(JSON.parse(noBodies).log.entries[0].response.content).toEqual({ size: 9, mimeType: 'application/json' });
  });

  it('marks missing sizes and times as unknown', () => {
    const rows = buildRows([
      { startedDateTime: '2024-01-01T00:00:00Z', time: -1, request: { url: 'https://a.com' }, response: { status: 0, bodySize: -1, content: { size: -1 } } },
      { startedDateTime: '2024-01-01T00:00:00Z', time: 5, request: { url: 'https://a.com' }, response: { status: 200, bodySize: 0, content: { size: 0 } } },
    ]);
    expect(rows.map((r) => [r.sizeKnown, r.timeKnown])).toEqual([[false, false], [true, true]]);
  });
});
