import { describe, expect, it } from 'vitest';
import { parseCurl, type HttpRequest } from '../../../src/tools/curl-converter/features/curl';

function req(cmd: string): HttpRequest & { warnings: string[]; notes: string[] } {
  const r = parseCurl(cmd);
  if (!r.request) throw new Error(r.error);
  return { ...r.request, warnings: r.warnings, notes: r.notes };
}

describe('parseCurl', () => {
  it('parses a plain GET', () => {
    const r = req('curl https://api.example.com/users');
    expect(r.method).toBe('GET');
    expect(r.url).toBe('https://api.example.com/users');
    expect(r.headers).toEqual([]);
    expect(r.body).toBeUndefined();
    expect(r.warnings).toEqual([]);
  });

  it('strips a leading "$ " prompt and accepts curl.exe', () => {
    expect(req('$ curl https://a.b').url).toBe('https://a.b');
    expect(req('curl.exe https://a.b').url).toBe('https://a.b');
  });

  it('reads -X in all its forms', () => {
    expect(req('curl -X put https://a.b').method).toBe('PUT');
    expect(req('curl -XDELETE https://a.b').method).toBe('DELETE');
    expect(req('curl --request PATCH https://a.b').method).toBe('PATCH');
    expect(req('curl --request=PATCH https://a.b').method).toBe('PATCH');
  });

  it('collects headers in order, keeping duplicates', () => {
    const r = req(`curl https://a.b -H 'Accept: application/json' -H "X-Id:  7 " --header 'X-Id: 8'`);
    expect(r.headers).toEqual([
      ['Accept', 'application/json'],
      ['X-Id', '7'],
      ['X-Id', '8'],
    ]);
  });

  it('supports empty and removed headers', () => {
    expect(req(`curl https://a.b -H 'X-Empty;'`).headers).toEqual([['X-Empty', '']]);
    expect(req(`curl https://a.b -A bot -H 'User-Agent:'`).headers).toEqual([]);
  });

  it('turns -d into a POST with a form content type', () => {
    const r = req(`curl https://a.b -d 'a=1' -d 'b=2'`);
    expect(r.method).toBe('POST');
    expect(r.body).toEqual({ kind: 'text', text: 'a=1&b=2' });
    expect(r.headers).toEqual([['Content-Type', 'application/x-www-form-urlencoded']]);
  });

  it('keeps an explicit content type for -d', () => {
    const r = req(`curl https://a.b -H 'content-type: application/json' --data-raw '{"a":1}'`);
    expect(r.headers).toEqual([['content-type', 'application/json']]);
    expect(r.body).toEqual({ kind: 'text', text: '{"a":1}' });
  });

  it('joins --data-binary, --data-raw and --data-urlencode', () => {
    const r = req(`curl https://a.b --data-binary 'x=1' --data-raw '@y' --data-urlencode 'q=a b&c' --data-urlencode '=é' --data-urlencode "raw it's"`);
    expect(r.body).toEqual({ kind: 'text', text: "x=1&@y&q=a%20b%26c&%C3%A9&raw%20it%27s" });
  });

  it('marks file references in data as placeholders', () => {
    const r = req('curl https://a.b -d @body.json');
    expect(r.body).toEqual({ kind: 'text', text: '<contents of body.json>' });
    expect(r.warnings.join()).toMatch(/body\.json/);
  });

  it('handles --json', () => {
    const r = req(`curl https://a.b --json '{"a":1}'`);
    expect(r.method).toBe('POST');
    expect(r.body).toEqual({ kind: 'text', text: '{"a":1}' });
    expect(r.headers).toEqual([
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
    ]);
  });

  it('parses -F multipart fields and files', () => {
    const r = req(`curl https://a.b -F name=Ann -F 'photo=@/tmp/me.png;type=image/png' -F 'doc=@a.txt;filename=b.txt' --form-string 'x=@literal'`);
    expect(r.method).toBe('POST');
    expect(r.body).toEqual({
      kind: 'multipart',
      parts: [
        { name: 'name', value: 'Ann' },
        { name: 'photo', file: '/tmp/me.png', filename: 'me.png', type: 'image/png' },
        { name: 'doc', file: 'a.txt', filename: 'b.txt' },
        { name: 'x', value: '@literal' },
      ],
    });
  });

  it('turns -u into basic auth', () => {
    expect(req('curl -u ann:s3:cret https://a.b').basicAuth).toEqual({ user: 'ann', password: 's3:cret' });
    const r = req('curl -u ann https://a.b');
    expect(r.basicAuth).toEqual({ user: 'ann', password: '' });
    expect(r.warnings.join()).toMatch(/prompt/);
  });

  it('maps -b, -A, -e and --oauth2-bearer to headers', () => {
    const r = req(`curl https://a.b -b 'a=1' -b 'b=2' -A 'Bot/1.0' -e 'https://ref.example;auto' --oauth2-bearer tok`);
    expect(r.headers).toEqual([
      ['Cookie', 'a=1; b=2'],
      ['User-Agent', 'Bot/1.0'],
      ['Referer', 'https://ref.example'],
      ['Authorization', 'Bearer tok'],
    ]);
    expect(req('curl -b jar.txt https://a.b').warnings.join()).toMatch(/file/);
  });

  it('moves data into the query string with -G', () => {
    const r = req(`curl -G https://a.b/s?x=1 -d q=cats --data-urlencode 'tag=a b'`);
    expect(r.method).toBe('GET');
    expect(r.url).toBe('https://a.b/s?x=1&q=cats&tag=a%20b');
    expect(r.body).toBeUndefined();
    expect(req('curl -G https://a.b -d q=1').url).toBe('https://a.b?q=1');
  });

  it('handles -I, -L, -k and --compressed', () => {
    const r = req('curl -I -L -k --compressed https://a.b');
    expect(r.method).toBe('HEAD');
    expect(r.followRedirects).toBe(true);
    expect(r.insecure).toBe(true);
    expect(r.compressed).toBe(true);
    expect(r.notes.join()).toMatch(/--compressed/);
  });

  it('expands bundled short options', () => {
    const r = req('curl -sSLk -XPOST -HX-A:1 https://a.b');
    expect(r.method).toBe('POST');
    expect(r.followRedirects).toBe(true);
    expect(r.insecure).toBe(true);
    expect(r.headers).toEqual([['X-A', '1']]);
    expect(r.warnings).toEqual([]);
  });

  it('ignores -o and friends quietly', () => {
    const r = req('curl -o out.json -w "%{http_code}" --max-time 5 https://a.b');
    expect(r.url).toBe('https://a.b');
    expect(r.warnings).toEqual([]);
  });

  it('lists unknown options as warnings', () => {
    const r = req('curl --frobnicate -Z https://a.b');
    expect(r.warnings).toEqual(['Unknown options ignored: --frobnicate, -Z.']);
  });

  it('uses --url and warns about extra URLs', () => {
    expect(req('curl --url https://a.b').url).toBe('https://a.b');
    expect(req('curl https://a.b https://c.d').warnings.join()).toMatch(/c\.d/);
  });

  it('assumes http:// for scheme-less URLs', () => {
    const r = req('curl example.com/x');
    expect(r.url).toBe('http://example.com/x');
    expect(r.notes.join()).toMatch(/http:\/\//);
  });

  it('uses PUT for -T', () => {
    const r = req('curl -T file.bin https://a.b');
    expect(r.method).toBe('PUT');
    expect(r.body).toEqual({ kind: 'text', text: '<contents of file.bin>' });
  });

  it('only converts the first command in a pipeline', () => {
    const r = req('curl https://a.b | jq .');
    expect(r.url).toBe('https://a.b');
    expect(r.warnings.join()).toMatch(/first command/);
  });

  it('parses a Chrome "Copy as cURL (bash)" command', () => {
    const r = req(`curl 'https://api.example.com/graphql' \\
  -H 'accept: */*' \\
  -H 'content-type: application/json' \\
  -H $'x-note: it\\'s' \\
  --data-raw $'{"query":"{ me { name } }","v":"\\u00e9"}' \\
  --compressed`);
    expect(r.method).toBe('POST');
    expect(r.headers.map((h) => h[0])).toEqual(['accept', 'content-type', 'x-note']);
    expect(r.headers[2][1]).toBe("it's");
    expect(r.body).toEqual({ kind: 'text', text: '{"query":"{ me { name } }","v":"é"}' });
  });

  it('parses a Chrome "Copy as cURL (cmd)" command', () => {
    const r = req('curl ^"https://a.b/p?x=1^&y=2^" ^\n  -H ^"content-type: application/json^" ^\n  --data-raw ^"^{^\\^"a^\\^":1^}^"');
    expect(r.url).toBe('https://a.b/p?x=1&y=2');
    expect(r.body).toEqual({ kind: 'text', text: '{"a":1}' });
  });

  it('reports errors', () => {
    expect(parseCurl('').error).toMatch(/Paste/);
    expect(parseCurl('curl -H').error).toBe('-H needs a value.');
    expect(parseCurl('curl -X POST').error).toMatch(/No URL/);
    expect(parseCurl("curl 'x").error).toMatch(/quote/);
  });

  it('warns when the command is not curl', () => {
    expect(req('wget https://a.b').warnings.join()).toMatch(/doesn.t start with "curl"/);
  });

  it('treats everything after -- as URLs', () => {
    expect(req('curl -- -weird-url').url).toBe('http://-weird-url');
  });
});
