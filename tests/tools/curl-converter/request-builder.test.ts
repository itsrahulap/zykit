import { describe, expect, it } from 'vitest';
import { parseCurl } from '../../../src/tools/curl-converter/features/curl';
import { toCurl } from '../../../src/tools/curl-converter/features/fetch';
import { buildFullUrl, builderStateToRequest, emptyBuilderState, requestToBuilderState, type RequestBuilderState } from '../../../src/tools/curl-converter/features/request-builder';

const state = (over: Partial<RequestBuilderState>): RequestBuilderState => ({ ...emptyBuilderState(), ...over });
const kv = (key: string, value: string, enabled = true) => ({ id: key, key, value, enabled });
/** cURL → form → request; the request should match what cURL alone produced. */
const roundTrip = (curl: string) => {
  const parsed = parseCurl(curl).request!;
  return { parsed, back: builderStateToRequest(requestToBuilderState(parsed)) };
};

describe('query and URL', () => {
  it('encodes parameters and skips disabled or empty ones', () => {
    expect(buildFullUrl('https://a.test/x', [kv('q', 'a b&c'), kv('off', '1', false), kv('', 'x'), kv('ü', '✓')])).toBe('https://a.test/x?q=a%20b%26c&%C3%BC=%E2%9C%93');
  });
  it('adds an API key to the query when asked', () => {
    const req = builderStateToRequest(state({ url: 'https://a.test/x', authType: 'apiKey', apiKeyName: 'api_key', apiKeyValue: 's3cret', apiKeyPlacement: 'query' }));
    expect(req.url).toBe('https://a.test/x?api_key=s3cret');
    expect(req.headers).toEqual([]);
  });
});

describe('auth', () => {
  it('builds Bearer, Basic and API key headers', () => {
    expect(builderStateToRequest(state({ authType: 'bearer', bearerToken: 'tok' })).headers).toEqual([['Authorization', 'Bearer tok']]);
    expect(builderStateToRequest(state({ authType: 'basic', basicUser: 'u', basicPassword: 'p:w' })).basicAuth).toEqual({ user: 'u', password: 'p:w' });
    expect(builderStateToRequest(state({ authType: 'apiKey', apiKeyName: 'X-API-Key', apiKeyValue: 'k' })).headers).toEqual([['X-API-Key', 'k']]);
  });
  it('reads auth back from a cURL command', () => {
    const s = requestToBuilderState(parseCurl("curl https://a.test -H 'Authorization: Bearer abc'").request!);
    expect([s.authType, s.bearerToken]).toEqual(['bearer', 'abc']);
    const b = requestToBuilderState(parseCurl("curl https://a.test -H 'Authorization: Basic dXNlcjpwYXNz'").request!);
    expect([b.authType, b.basicUser, b.basicPassword]).toEqual(['basic', 'user', 'pass']);
  });
  it('keeps an Authorization header it can’t take apart', () => {
    for (const v of ['Basic not-base64!!', 'Basic bm9jb2xvbg==', 'Digest abc']) {
      const s = requestToBuilderState(parseCurl(`curl https://a.test -H 'Authorization: ${v}'`).request!);
      expect(s.authType, v).toBe('none');
      expect(s.headers.map((h) => [h.key, h.value]), v).toEqual([['Authorization', v]]);
    }
  });
});

describe('body', () => {
  it('sets a Content-Type for each body type unless one is given', () => {
    const ct = (s: Partial<RequestBuilderState>) => builderStateToRequest(state({ method: 'POST', ...s })).headers.find(([k]) => k === 'Content-Type')?.[1];
    expect(ct({ bodyType: 'json' })).toBe('application/json');
    expect(ct({ bodyType: 'text', textBody: 'hi' })).toBe('text/plain');
    expect(ct({ bodyType: 'form', formBody: [kv('a', '1')] })).toBe('application/x-www-form-urlencoded');
    expect(ct({ bodyType: 'json', headers: [kv('Content-Type', 'application/vnd.api+json')] })).toBe('application/vnd.api+json');
  });
  it('encodes form fields and builds multipart parts', () => {
    expect(builderStateToRequest(state({ method: 'POST', bodyType: 'form', formBody: [kv('a b', 'c&d'), kv('x', 'y', false)] })).body).toEqual({ kind: 'text', text: 'a%20b=c%26d' });
    const mp = builderStateToRequest(
      state({ method: 'POST', bodyType: 'multipart', multipartBody: [{ id: '1', name: 'f', type: 'file', value: 'a.png', contentType: 'image/png', enabled: true }, { id: '2', name: 't', type: 'text', value: 'hi', enabled: true }] }),
    ).body;
    expect(mp).toEqual({ kind: 'multipart', parts: [{ name: 'f', file: 'a.png', type: 'image/png' }, { name: 't', value: 'hi' }] });
  });
});

describe('round trip cURL → form → cURL', () => {
  it('keeps the JSON body byte for byte', () => {
    const { parsed, back } = roundTrip(`curl https://a.test -H 'Content-Type: application/json' --data-raw '{"a":1,  "b":[1,2]}'`);
    expect(back.body).toEqual(parsed.body);
    expect(toCurl(back)).toContain(`--data-raw '{"a":1,  "b":[1,2]}'`);
  });
  it('doesn’t invent a body for a POST without one', () => {
    const { back } = roundTrip('curl -X POST https://a.test/ping');
    expect(back.body).toBeUndefined();
    expect(back.method).toBe('POST');
  });
  it('keeps text/plain bodies as text even when they look like JSON', () => {
    const s = requestToBuilderState(parseCurl("curl https://a.test -H 'Content-Type: text/plain' --data-raw '123'").request!);
    expect([s.bodyType, s.textBody]).toEqual(['text', '123']);
  });
  it('doesn’t add flags the command didn’t have', () => {
    const { back } = roundTrip('curl https://a.test');
    expect(toCurl(back)).toBe('curl https://a.test');
  });
  it('keeps query parameters, headers, form bodies and flags', () => {
    const { parsed, back } = roundTrip(`curl -L -k --compressed 'https://a.test/s?q=a%20b&tag=x' -H 'X-Trace: 1' --data-urlencode 'name=Zoë & co'`);
    expect(back.url).toBe(parsed.url.replace('%20', '%20'));
    expect(back.headers).toEqual(expect.arrayContaining([['X-Trace', '1']]));
    expect(back.body).toEqual(parsed.body);
    expect([back.followRedirects, back.insecure, back.compressed]).toEqual([true, true, true]);
  });
});

describe('curl’s default form Content-Type', () => {
  it('keeps --data that isn’t really form fields as raw text', () => {
    const { parsed, back } = roundTrip(`curl https://a.test --data-raw '{"a":1}'`);
    expect(back.body).toEqual(parsed.body);
    const plus = roundTrip(`curl https://a.test --data-raw 'q=a+b'`);
    expect(plus.back.body).toEqual(plus.parsed.body);
  });
  it('opens real form data as editable fields', () => {
    const s = requestToBuilderState(parseCurl(`curl https://a.test --data-raw 'a=1&b=x%20y'`).request!);
    expect(s.bodyType).toBe('form');
    expect(s.formBody.map((f) => [f.key, f.value])).toEqual([['a', '1'], ['b', 'x y']]);
  });
});
