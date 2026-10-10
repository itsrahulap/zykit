import { describe, expect, it } from 'vitest';
import { buildRows, entryDetail, parseHar, summarize, typeOf, viewRows } from '../../../src/tools/har-viewer/features/har';

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
