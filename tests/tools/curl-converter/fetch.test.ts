import { describe, expect, it } from 'vitest';
import { parseCurl } from '../../../src/tools/curl-converter/features/curl';
import { generate } from '../../../src/tools/curl-converter/features/generate';
import { parseFetch, toCurl } from '../../../src/tools/curl-converter/features/fetch';
import { tokenizeShell } from '../../../src/tools/curl-converter/features/shell';

function ok(code: string) {
  const r = parseFetch(code);
  if (!r.request) throw new Error(r.error);
  return r;
}

describe('parseFetch', () => {
  it('parses a URL-only call', () => {
    const r = ok(`const res = await fetch('https://a.b/x');`);
    expect(r.request).toEqual({ method: 'GET', url: 'https://a.b/x', headers: [], body: undefined, followRedirects: true });
  });

  it('parses method, headers and a JSON.stringify body', () => {
    const r = ok(`
      // create a user
      fetch("https://api.example.com/users", {
        method: 'post',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer abc\`, "X-N": 5 },
        body: JSON.stringify({ name: 'Ann', tags: ['a', "b"], age: 30, ok: true, none: null, /* c */ }),
      }).then((r) => r.json());
    `);
    expect(r.request!.method).toBe('POST');
    expect(r.request!.headers).toEqual([
      ['Content-Type', 'application/json'],
      ['Authorization', 'Bearer abc'],
      ['X-N', '5'],
    ]);
    expect(r.request!.body).toEqual({ kind: 'text', text: '{"name":"Ann","tags":["a","b"],"age":30,"ok":true,"none":null}' });
    expect(r.warnings).toEqual([]);
  });

  it('honours JSON.stringify spacing', () => {
    expect(ok(`fetch('u', { method: 'POST', body: JSON.stringify({ a: 1 }, null, 2) })`).request!.body).toEqual({ kind: 'text', text: '{\n  "a": 1\n}' });
  });

  it('decodes string escapes', () => {
    const r = ok(`fetch('https://a.b', { body: 'l1\\nl2 \\'q\\' \\x41\\u00e9\\u{1F600}' , method: "PUT"})`);
    expect(r.request!.body).toEqual({ kind: 'text', text: "l1\nl2 'q' Aé😀" });
  });

  it('concatenates string literals', () => {
    expect(ok(`fetch('https://a.b/' + 'x' + 1)`).request!.url).toBe('https://a.b/x1');
  });

  it('accepts header arrays and new Headers()', () => {
    expect(ok(`fetch('u', { headers: [['A', '1'], ['A', '2']] })`).request!.headers).toEqual([
      ['A', '1'],
      ['A', '2'],
    ]);
    expect(ok(`fetch('u', { headers: new Headers({ B: 'x' }) })`).request!.headers).toEqual([['B', 'x']]);
  });

  it('adds fetch\'s default text/plain content type for string bodies', () => {
    expect(ok(`fetch('u', { method: 'POST', body: 'hi' })`).request!.headers).toEqual([['Content-Type', 'text/plain;charset=UTF-8']]);
  });

  it('converts URLSearchParams bodies', () => {
    const r = ok(`fetch('u', { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({ q: 'a b', n: 1 }) })`);
    expect(r.request!.body).toEqual({ kind: 'text', text: 'q=a+b&n=1' });
  });

  it('keeps template interpolations literally with a warning', () => {
    const r = ok('fetch(`https://a.b/${id}`)');
    expect(r.request!.url).toBe('https://a.b/${id}');
    expect(r.warnings.join()).toMatch(/\$\{id\}/);
  });

  it('uses placeholders for values it cannot resolve', () => {
    const r = ok(`fetch('u', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(payload) })`);
    expect(r.request!.headers).toEqual([['Authorization', "<'Bearer ' + token>"]]);
    expect(r.request!.body).toEqual({ kind: 'text', text: '<JSON.stringify(payload)>' });
    expect(r.warnings.length).toBe(3);
  });

  it('handles shorthand properties and spreads', () => {
    const r = ok(`fetch('u', { ...{ method: 'DELETE' }, body })`);
    expect(r.request!.method).toBe('DELETE');
    expect(r.request!.body).toEqual({ kind: 'text', text: '<body>' });
  });

  it('respects redirect and referrer options', () => {
    const r = ok(`fetch('u', { redirect: 'manual', referrer: 'https://r.example/', credentials: 'include', foo: 1 })`);
    expect(r.request!.followRedirects).toBe(false);
    expect(r.request!.headers).toEqual([['Referer', 'https://r.example/']]);
    expect(r.warnings.join()).toMatch(/cookies/);
    expect(r.warnings.join()).toMatch(/Unknown fetch option ignored: foo/);
  });

  it('warns about plain object bodies', () => {
    expect(ok(`fetch('u', { method: 'POST', body: { a: 1 } })`).warnings.join()).toMatch(/JSON\.stringify/);
  });

  it('does not match methods named fetch or refetch', () => {
    expect(parseFetch(`refetch('x'); api.fetch('y')`).error).toMatch(/No fetch/);
    expect(ok(`refetch('x'); fetch('y')`).request!.url).toBe('y');
  });

  it('never runs code', () => {
    const r = ok(`fetch('u', (() => { throw new Error('ran') })())`);
    expect(r.request!.url).toBe('u');
    expect(r.warnings.join()).toMatch(/aren't an object literal/);
  });

  it('reports syntax errors with a position', () => {
    expect(parseFetch(`fetch('u', { method: 'POST' `).error).toMatch(/Expected "}" \(line 1, column \d+\)/);
    expect(parseFetch(`fetch('unterminated)`).error).toMatch(/Unterminated string/);
    expect(parseFetch(`fetch(url)`).error).toMatch(/string literal; found "url"/);
    expect(parseFetch('no call here').error).toMatch(/No fetch/);
  });
});

describe('toCurl', () => {
  it('writes a readable multi-line command', () => {
    const r = ok(`fetch('https://a.b/x?q=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: "it's" }) })`);
    expect(toCurl(r.request!)).toBe(`curl 'https://a.b/x?q=1' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"msg":"it'\\''s"}' \\\n  -L`);
  });

  it('adds -X only when needed', () => {
    expect(toCurl({ method: 'GET', url: 'https://a.b', headers: [] })).toBe('curl https://a.b');
    expect(toCurl({ method: 'DELETE', url: 'https://a.b', headers: [] })).toBe('curl https://a.b \\\n  -X DELETE');
    expect(toCurl({ method: 'POST', url: 'https://a.b', headers: [] })).toBe('curl https://a.b \\\n  -X POST');
    expect(toCurl({ method: 'HEAD', url: 'https://a.b', headers: [] })).toBe('curl https://a.b \\\n  -I');
  });

  it('writes empty headers, auth and multipart fields', () => {
    const cmd = toCurl({
      method: 'POST',
      url: 'https://a.b',
      headers: [['X-E', ''], ['Content-Type', 'multipart/form-data']],
      basicAuth: { user: 'u', password: 'p w' },
      body: { kind: 'multipart', parts: [{ name: 'a', value: '@x' }, { name: 'f', file: 'f.png', type: 'image/png' }] },
      insecure: true,
      compressed: true,
    });
    expect(cmd).toBe(`curl https://a.b \\\n  -H 'X-E;' \\\n  -u 'u:p w' \\\n  --form-string a=@x \\\n  -F 'f=@f.png;type=image/png' \\\n  -k \\\n  --compressed`);
  });

  it('round-trips through the cURL parser', () => {
    const cmds = [
      `curl 'https://a.b/p?x=1&y=2' -X PATCH -H 'Content-Type: application/json' -H "X-Q: it's \\"quoted\\"" --data-raw '{"a":"line1\\nline2 $HOME"}'`,
      `curl https://a.b -u 'ann:p@ss:w' -F name=Ann -F 'up=@/tmp/a b.txt;type=text/plain' -k -L --compressed`,
      `curl -I https://a.b -H 'X-Empty;'`,
    ];
    for (const c of cmds) {
      const first = parseCurl(c).request!;
      const again = parseCurl(toCurl(first)).request!;
      expect(again).toEqual(first);
    }
  });

  it('produces commands the shell tokenizer reads back exactly', () => {
    const body = `{"s":"a'b\\"c $x \`y\` \\\\ \n"}`;
    const cmd = toCurl({ method: 'PUT', url: 'https://a.b', headers: [], body: { kind: 'text', text: body } });
    expect(tokenizeShell(cmd).words.map((w) => w.value)).toEqual(['curl', 'https://a.b', '-X', 'PUT', '--data-raw', body]);
  });
});

describe('fetch → cURL → fetch', () => {
  it('keeps the request intact', () => {
    const r = ok(`fetch('https://a.b', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: [1, { b: 'c' }] }) })`);
    const back = parseCurl(toCurl(r.request!)).request!;
    expect(generate(back, 'fetch').code).toContain(`body: JSON.stringify({\n    a: [\n      1,\n      {\n        b: 'c',\n      },\n    ],\n  }),`);
  });
});
