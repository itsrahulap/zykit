// Code generators: HttpRequest → JavaScript fetch, Node fetch, axios, Python requests.

import { textToBase64 } from '../../../shared/lib/base64';
import { getHeader, type FormPart, type HttpRequest } from './curl';

export type Target = 'fetch' | 'node' | 'axios' | 'python';

export interface Generated {
  code: string;
  notes: string[];
}

// ---- literals -------------------------------------------------------------

const hex = (c: string, width: number) => c.charCodeAt(0).toString(16).padStart(width, '0');

/** Single-quoted JavaScript string literal. */
export function jsString(s: string): string {
  let out = "'";
  for (const c of s) {
    if (c === "'") out += "\\'";
    else if (c === '\\') out += '\\\\';
    else if (c === '\n') out += '\\n';
    else if (c === '\r') out += '\\r';
    else if (c === '\t') out += '\\t';
    else if (c === ' ' || c === ' ') out += '\\u' + hex(c, 4);
    else if (c < ' ' || c === '\x7f') out += '\\x' + hex(c, 2);
    else out += c;
  }
  return out + "'";
}

/** Single-quoted Python string literal. */
export function pyString(s: string): string {
  let out = "'";
  for (const c of s) {
    if (c === "'") out += "\\'";
    else if (c === '\\') out += '\\\\';
    else if (c === '\n') out += '\\n';
    else if (c === '\r') out += '\\r';
    else if (c === '\t') out += '\\t';
    else if (c < ' ' || c === '\x7f') out += '\\x' + hex(c, 2);
    else out += c;
  }
  return out + "'";
}

const JS_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const jsKey = (k: string) => (JS_IDENT.test(k) ? k : jsString(k));

/** Removes insignificant whitespace from JSON text (outside strings). */
function compactJson(text: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === '\\') out += text[++i] ?? '';
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (!/\s/.test(c)) out += c;
  }
  return out;
}

/**
 * Parses a JSON body only if re-serialising it gives back the same text, so numbers too big for
 * a double, "1.0", escapes or duplicate keys never get silently changed in the generated code.
 */
export function parseJsonExact(text: string): { value: unknown } | null {
  if (text.includes('"__proto__"')) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== 'object') return null;
    return JSON.stringify(value) === compactJson(text) ? { value } : null;
  } catch {
    return null;
  }
}

export function toJsLiteral(value: unknown, indent = ''): string {
  const inner = indent + '  ';
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return `[\n${value.map((v) => inner + toJsLiteral(v, inner)).join(',\n')},\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    return `{\n${entries.map(([k, v]) => `${inner}${jsKey(k)}: ${toJsLiteral(v, inner)}`).join(',\n')},\n${indent}}`;
  }
  if (typeof value === 'string') return jsString(value);
  return JSON.stringify(value);
}

export function toPyLiteral(value: unknown, indent = ''): string {
  const inner = indent + '    ';
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return `[\n${value.map((v) => inner + toPyLiteral(v, inner)).join(',\n')},\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    return `{\n${entries.map(([k, v]) => `${inner}${pyString(k)}: ${toPyLiteral(v, inner)}`).join(',\n')},\n${indent}}`;
  }
  if (typeof value === 'string') return pyString(value);
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (value === null) return 'None';
  return JSON.stringify(value);
}

// ---- shared preparation ----------------------------------------------------

const isJsonType = (ct: string | undefined) => !!ct && /[/+]json\b/i.test(ct);

interface Prepared {
  headers: [string, string][];
  json?: unknown;
  text?: string;
  parts?: FormPart[];
}

/** Folds duplicate headers (as fetch's Headers would) and works out the body shape. */
function prepare(req: HttpRequest, { foldAuth, dropJsonType }: { foldAuth: boolean; dropJsonType?: boolean }): Prepared {
  const headers: [string, string][] = [];
  for (const [name, value] of req.headers) {
    const existing = headers.find(([n]) => n.toLowerCase() === name.toLowerCase());
    if (existing) existing[1] = name.toLowerCase() === 'cookie' ? `${existing[1]}; ${value}` : `${existing[1]}, ${value}`;
    else headers.push([name, value]);
  }
  if (foldAuth && req.basicAuth && !getHeader(headers, 'Authorization')) {
    headers.push(['Authorization', `Basic ${textToBase64(`${req.basicAuth.user}:${req.basicAuth.password}`)}`]);
  }
  const out: Prepared = { headers };
  const body = req.body;
  if (body?.kind === 'multipart') {
    out.parts = body.parts;
    // The runtime must write the multipart boundary itself.
    out.headers = headers.filter(([n]) => n.toLowerCase() !== 'content-type');
  } else if (body) {
    const parsed = isJsonType(getHeader(headers, 'Content-Type')) ? parseJsonExact(body.text) : null;
    if (parsed) {
      out.json = parsed.value;
      if (dropJsonType) out.headers = headers.filter(([n, v]) => !(n.toLowerCase() === 'content-type' && /^application\/json\s*$/i.test(v)));
    } else out.text = body.text;
  }
  return out;
}

const SENSITIVE = /^(authorization|proxy-authorization|cookie|x-api-key|api-key|x-auth-token|x-access-token|x-csrf-token)$/i;

/** Header names (plus "-u") that carry credentials. */
export function credentialHeaders(req: HttpRequest): string[] {
  const names = req.headers.filter(([n]) => SENSITIVE.test(n)).map(([n]) => n);
  if (req.basicAuth) names.push('Authorization (from -u)');
  return [...new Set(names)];
}

// ---- JavaScript ------------------------------------------------------------

function jsHeaders(headers: [string, string][], indent: string): string {
  const inner = indent + '  ';
  return `{\n${headers.map(([n, v]) => `${inner}${jsKey(n)}: ${jsString(v)},`).join('\n')}\n${indent}}`;
}

function jsFormLines(parts: FormPart[], node: boolean): string[] {
  const lines = ['const form = new FormData();'];
  for (const p of parts) {
    if (p.file !== undefined) {
      const file = node
        ? `await openAsBlob(${jsString(p.file)}${p.type ? `, { type: ${jsString(p.type)} }` : ''})`
        : `fileInput.files[0]`;
      const comment = node ? '' : ` // ${p.file}: pick a File, e.g. from <input type="file">`;
      lines.push(`form.append(${jsString(p.name)}, ${file}, ${jsString(p.filename ?? p.file)});${comment}`);
    } else if (p.type) {
      lines.push(`form.append(${jsString(p.name)}, new Blob([${jsString(p.value ?? '')}], { type: ${jsString(p.type)} }));`);
    } else lines.push(`form.append(${jsString(p.name)}, ${jsString(p.value ?? '')});`);
  }
  return lines;
}

const BROWSER_FORBIDDEN = /^(cookie|cookie2|host|content-length|connection|accept-encoding|accept-charset|keep-alive|te|trailer|transfer-encoding|upgrade|via|date|expect|origin|referer|dnt)$/i;

function generateFetch(req: HttpRequest, node: boolean): Generated {
  const notes: string[] = [];
  const p = prepare(req, { foldAuth: true });
  const pre: string[] = [];
  if (node && p.parts?.some((x) => x.file !== undefined)) pre.push("import { openAsBlob } from 'node:fs';", '');
  if (node && req.insecure) {
    notes.push('-k (insecure): Node fetch has no per-request switch. For local testing only, run with NODE_TLS_REJECT_UNAUTHORIZED=0.');
  }
  if (!node && req.insecure) notes.push('-k (insecure) can’t be reproduced in a browser: certificate errors always fail the request.');

  const opts: string[] = [];
  if (req.method !== 'GET') opts.push(`  method: ${jsString(req.method)},`);
  if (p.headers.length) opts.push(`  headers: ${jsHeaders(p.headers, '  ')},`);
  if (p.parts) {
    pre.push(...jsFormLines(p.parts, node), '');
    opts.push('  body: form,');
    notes.push('The body is sent as FormData, so the Content-Type header (with its multipart boundary) is set automatically.');
    if (!node && p.parts.some((x) => x.file !== undefined)) notes.push('File uploads need a File or Blob object; the code reads one from a file input.');
  } else if (p.json !== undefined) {
    opts.push(`  body: JSON.stringify(${toJsLiteral(p.json, '  ')}),`);
  } else if (p.text !== undefined) {
    opts.push(`  body: ${jsString(p.text)},`);
  }

  if (!node) {
    const blocked = p.headers.map(([n]) => n).filter((n) => BROWSER_FORBIDDEN.test(n));
    if (blocked.length) {
      notes.push(
        `Browsers silently drop ${blocked.join(', ')} when set from a script.` +
          (blocked.some((n) => /^cookie$/i.test(n)) ? " To send the site's cookies use credentials: 'include'." : '') +
          ' Use the Node version to send them as-is.',
      );
    }
    notes.push('A browser will only let this run if the server allows your page’s origin (CORS).');
  }

  const accept = getHeader(p.headers, 'Accept') ?? '';
  const readJson = /json/i.test(accept) && req.method !== 'HEAD';
  const call = opts.length ? `await fetch(${jsString(req.url)}, {\n${opts.join('\n')}\n});` : `await fetch(${jsString(req.url)});`;
  const lines = [
    ...pre,
    `const response = ${call}`,
    '',
    req.method === 'HEAD' ? 'console.log(response.status, [...response.headers]);' : `const data = await response.${readJson ? 'json' : 'text'}();`,
    ...(req.method === 'HEAD' ? [] : ['console.log(data);']),
  ];
  return { code: lines.join('\n') + '\n', notes };
}

function generateAxios(req: HttpRequest): Generated {
  const notes: string[] = [];
  const p = prepare(req, { foldAuth: false });
  const pre = ["import axios from 'axios';"];
  if (req.insecure) pre.push("import https from 'node:https';");
  if (p.parts?.some((x) => x.file !== undefined)) pre.push("import { openAsBlob } from 'node:fs';");
  pre.push('');

  const opts = [`  method: ${jsString(req.method.toLowerCase())},`, `  url: ${jsString(req.url)},`];
  if (p.headers.length) opts.push(`  headers: ${jsHeaders(p.headers, '  ')},`);
  if (req.basicAuth) {
    opts.push(`  auth: {\n    username: ${jsString(req.basicAuth.user)},\n    password: ${jsString(req.basicAuth.password)},\n  },`);
  }
  if (p.parts) {
    pre.push(...jsFormLines(p.parts, true), '');
    opts.push('  data: form,');
    notes.push('The body is sent as FormData, so axios sets the multipart Content-Type itself. In a browser, pass a File instead of openAsBlob().');
  } else if (p.json !== undefined) opts.push(`  data: ${toJsLiteral(p.json, '  ')},`);
  else if (p.text !== undefined) opts.push(`  data: ${jsString(p.text)},`);
  if (req.insecure) {
    opts.push('  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // -k: only for local testing');
  }
  const lines = [...pre, `const response = await axios({\n${opts.join('\n')}\n});`, '', 'console.log(response.data);'];
  return { code: lines.join('\n') + '\n', notes };
}

// ---- Python ----------------------------------------------------------------

const PY_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function generatePython(req: HttpRequest): Generated {
  const notes: string[] = [];
  const p = prepare(req, { foldAuth: false, dropJsonType: true });
  const blocks: string[] = ['import requests'];
  const args = [pyString(req.url)];

  if (p.headers.length) {
    blocks.push(`headers = {\n${p.headers.map(([n, v]) => `    ${pyString(n)}: ${pyString(v)},`).join('\n')}\n}`);
    args.push('headers=headers');
  }
  if (p.parts) {
    const lines = p.parts.map((x) => {
      if (x.file !== undefined) {
        const t = x.type ? `, ${pyString(x.type)}` : '';
        return `    (${pyString(x.name)}, (${pyString(x.filename ?? x.file)}, open(${pyString(x.file)}, 'rb')${t})),`;
      }
      return `    (${pyString(x.name)}, (None, ${pyString(x.value ?? '')}${x.type ? `, ${pyString(x.type)}` : ''})),`;
    });
    blocks.push(`files = [\n${lines.join('\n')}\n]`);
    args.push('files=files');
  } else if (p.json !== undefined) {
    blocks.push(`json_data = ${toPyLiteral(p.json)}`);
    args.push('json=json_data');
  } else if (p.text !== undefined) {
    blocks.push(`data = ${pyString(p.text)}`);
    // requests would encode a non-ASCII str body as Latin-1, so send UTF-8 bytes instead.
    args.push([...p.text].some((c) => c > '\x7f') ? "data=data.encode('utf-8')" : 'data=data');
  }
  if (req.basicAuth) args.push(`auth=(${pyString(req.basicAuth.user)}, ${pyString(req.basicAuth.password)})`);
  if (req.insecure) {
    args.push('verify=False');
    notes.push('verify=False (from -k) turns off certificate checks. Only use it for local testing.');
  }
  if (req.method === 'HEAD' && req.followRedirects) args.push('allow_redirects=True');

  const fn = PY_METHODS.has(req.method) ? `requests.${req.method.toLowerCase()}(` : `requests.request(${pyString(req.method)}, `;
  const call = args.length > 2 ? `${fn}\n${args.map((a) => `    ${a},`).join('\n')}\n)` : `${fn}${args.join(', ')})`;
  blocks.push(`response = ${call}\nprint(response.status_code)\nprint(response.text)`);
  return { code: blocks.join('\n\n') + '\n', notes };
}

export function generate(req: HttpRequest, target: Target): Generated {
  switch (target) {
    case 'fetch':
      return generateFetch(req, false);
    case 'node':
      return generateFetch(req, true);
    case 'axios':
      return generateAxios(req);
    case 'python':
      return generatePython(req);
  }
}
