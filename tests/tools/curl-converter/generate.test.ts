import { describe, expect, it } from 'vitest';
import { parseCurl } from '../../../src/tools/curl-converter/features/curl';
import {
  credentialHeaders,
  generate,
  jsString,
  parseJsonExact,
  pyString,
  toJsLiteral,
  toPyLiteral,
  type Target,
} from '../../../src/tools/curl-converter/features/generate';

function gen(cmd: string, target: Target) {
  const r = parseCurl(cmd);
  if (!r.request) throw new Error(r.error);
  return generate(r.request, target);
}

describe('literals', () => {
  it('escapes JavaScript strings', () => {
    expect(jsString(`it's \\ "q"\n\t \x01`)).toBe(`'it\\'s \\\\ "q"\\n\\t\\u2028\\x01'`);
  });

  it('escapes Python strings', () => {
    expect(pyString(`it's \\\n\x7f é`)).toBe(`'it\\'s \\\\\\n\\x7f é'`);
  });

  it('only accepts JSON that survives a round trip', () => {
    expect(parseJsonExact('{ "a": [1, 2], "b": "x" }')).toEqual({ value: { a: [1, 2], b: 'x' } });
    expect(parseJsonExact('{"id": 12345678901234567890}')).toBeNull();
    expect(parseJsonExact('{"a": 1.0}')).toBeNull();
    expect(parseJsonExact('{"a": 1, "a": 2}')).toBeNull();
    expect(parseJsonExact('{"__proto__": {}}')).toBeNull();
    expect(parseJsonExact('"just a string"')).toBeNull();
    expect(parseJsonExact('{bad')).toBeNull();
  });

  it('prints JS and Python literals', () => {
    const v = { name: 'Ann', 'x-y': [true, null, 1.5], nested: {}, list: [] };
    expect(toJsLiteral(v)).toBe(`{\n  name: 'Ann',\n  'x-y': [\n    true,\n    null,\n    1.5,\n  ],\n  nested: {},\n  list: [],\n}`);
    expect(toPyLiteral(v)).toBe(`{\n    'name': 'Ann',\n    'x-y': [\n        True,\n        None,\n        1.5,\n    ],\n    'nested': {},\n    'list': [],\n}`);
  });
});

describe('fetch', () => {
  it('generates a minimal GET', () => {
    expect(gen('curl https://a.b/x', 'fetch').code).toBe(`const response = await fetch('https://a.b/x');\n\nconst data = await response.text();\nconsole.log(data);\n`);
  });

  it('uses JSON.stringify for JSON bodies and reads JSON responses', () => {
    const { code } = gen(`curl https://a.b --json '{"name":"Ann","tags":["a"]}'`, 'fetch');
    expect(code).toBe(
      `const response = await fetch('https://a.b', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    name: 'Ann',
    tags: [
      'a',
    ],
  }),
});

const data = await response.json();
console.log(data);
`,
    );
  });

  it('keeps non-round-trippable JSON as a string', () => {
    const { code } = gen(`curl https://a.b -H 'Content-Type: application/json' -d '{"id":12345678901234567890}'`, 'fetch');
    expect(code).toContain(`body: '{"id":12345678901234567890}',`);
  });

  it('sends form bodies as strings', () => {
    const { code } = gen(`curl -X PUT https://a.b -d "a=1&b=it's"`, 'fetch');
    expect(code).toContain(`method: 'PUT',`);
    expect(code).toContain(`'Content-Type': 'application/x-www-form-urlencoded',`);
    expect(code).toContain(`body: 'a=1&b=it\\'s',`);
  });

  it('builds FormData for -F and drops Content-Type', () => {
    const { code, notes } = gen(`curl https://a.b -H 'Content-Type: multipart/form-data' -F name=Ann -F 'photo=@me.png'`, 'fetch');
    expect(code).toContain(`const form = new FormData();\nform.append('name', 'Ann');\nform.append('photo', fileInput.files[0], 'me.png');`);
    expect(code).toContain('body: form,');
    expect(code).not.toContain('Content-Type');
    expect(notes.join()).toMatch(/File/);
  });

  it('folds -u into an Authorization header', () => {
    expect(gen('curl -u ann:pw https://a.b', 'fetch').code).toContain(`Authorization: 'Basic YW5uOnB3',`);
    expect(gen('curl -u jö:pw https://a.b', 'fetch').code).toContain(`Authorization: 'Basic ${btoa('j\xc3\xb6:pw')}',`);
  });

  it('merges duplicate headers', () => {
    expect(gen(`curl https://a.b -H 'X-A: 1' -H 'x-a: 2'`, 'fetch').code).toContain(`'X-A': '1, 2',`);
  });

  it('notes headers browsers refuse to send', () => {
    const { notes } = gen(`curl https://a.b -b 'sid=1' -H 'Host: x'`, 'fetch');
    expect(notes.join()).toMatch(/Cookie, Host/);
    expect(notes.join()).toMatch(/credentials: 'include'/);
  });

  it('logs status and headers for HEAD', () => {
    expect(gen('curl -I https://a.b', 'fetch').code).toContain(`method: 'HEAD'`);
    expect(gen('curl -I https://a.b', 'fetch').code).toContain('console.log(response.status, [...response.headers]);');
  });
});

describe('node fetch', () => {
  it('reads files with openAsBlob', () => {
    const { code } = gen(`curl https://a.b -F 'f=@/tmp/a.csv;type=text/csv'`, 'node');
    expect(code.startsWith("import { openAsBlob } from 'node:fs';\n")).toBe(true);
    expect(code).toContain(`form.append('f', await openAsBlob('/tmp/a.csv', { type: 'text/csv' }), 'a.csv');`);
  });

  it('explains -k', () => {
    expect(gen('curl -k https://a.b', 'node').notes.join()).toMatch(/NODE_TLS_REJECT_UNAUTHORIZED/);
  });

  it('does not add browser-only notes', () => {
    expect(gen(`curl https://a.b -b 'a=1'`, 'node').notes).toEqual([]);
  });
});

describe('axios', () => {
  it('generates a request config', () => {
    const { code } = gen(`curl -u ann:pw -k https://a.b --json '{"a":1}'`, 'axios');
    expect(code).toBe(
      `import axios from 'axios';
import https from 'node:https';

const response = await axios({
  method: 'post',
  url: 'https://a.b',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  auth: {
    username: 'ann',
    password: 'pw',
  },
  data: {
    a: 1,
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // -k: only for local testing
});

console.log(response.data);
`,
    );
  });

  it('sends text bodies as strings', () => {
    expect(gen(`curl https://a.b -d x=1`, 'axios').code).toContain(`data: 'x=1',`);
  });
});

describe('python requests', () => {
  it('generates a simple GET on one line', () => {
    expect(gen('curl https://a.b', 'python').code).toBe(`import requests\n\nresponse = requests.get('https://a.b')\nprint(response.status_code)\nprint(response.text)\n`);
  });

  it('uses json= and drops the redundant content type', () => {
    const { code } = gen(`curl https://a.b -H 'Content-Type: application/json' -H 'X-A: 1' -d '{"ok":true,"n":null}'`, 'python');
    expect(code).toBe(
      `import requests

headers = {
    'X-A': '1',
}

json_data = {
    'ok': True,
    'n': None,
}

response = requests.post(
    'https://a.b',
    headers=headers,
    json=json_data,
)
print(response.status_code)
print(response.text)
`,
    );
  });

  it('uses data= for text and encodes non-ASCII as UTF-8', () => {
    expect(gen(`curl https://a.b -d 'a=1'`, 'python').code).toContain('    data=data,');
    expect(gen(`curl https://a.b -d 'a=é'`, 'python').code).toContain("    data=data.encode('utf-8'),");
  });

  it('uses files= for multipart', () => {
    const { code } = gen(`curl https://a.b -F name=Ann -F 'doc=@r.pdf;type=application/pdf'`, 'python');
    expect(code).toContain(`files = [\n    ('name', (None, 'Ann')),\n    ('doc', ('r.pdf', open('r.pdf', 'rb'), 'application/pdf')),\n]`);
  });

  it('passes auth, verify and custom methods', () => {
    const { code, notes } = gen('curl -X PURGE -u a:b -k https://a.b', 'python');
    expect(code).toContain(`requests.request('PURGE', \n`.trimEnd());
    expect(code).toContain(`    auth=('a', 'b'),`);
    expect(code).toContain('    verify=False,');
    expect(notes.join()).toMatch(/verify=False/);
  });
});

describe('credentialHeaders', () => {
  it('finds headers that carry secrets', () => {
    const r = parseCurl(`curl -u a:b https://a.b -H 'Authorization: Bearer x' -b 's=1' -H 'X-Api-Key: k' -H 'Accept: */*'`).request!;
    expect(credentialHeaders(r)).toEqual(['Authorization', 'Cookie', 'X-Api-Key', 'Authorization (from -u)']);
    expect(credentialHeaders(parseCurl('curl https://a.b').request!)).toEqual([]);
  });
});
