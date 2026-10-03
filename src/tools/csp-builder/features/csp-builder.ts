// Content-Security-Policy model: directive catalogue, source validation, parse/serialise, presets,
// an evaluator in the spirit of Google's CSP Evaluator, and output formatters. Pure, no network.

import { parseCsp } from '../../http-headers/features/values';

export interface PolicyDirective {
  name: string;
  sources: string[];
}
export type Policy = PolicyDirective[];

export type DirectiveKind = 'fetch' | 'document' | 'navigation' | 'flag' | 'reporting' | 'trusted' | 'other';

export interface DirectiveInfo {
  name: string;
  kind: DirectiveKind;
  description: string;
  /** Directives that apply when this one is absent, nearest first. */
  fallback: string[];
  /** Shown in the builder. */
  builder: boolean;
  /** Not supported when delivered in a <meta> tag. */
  metaIgnored?: boolean;
  deprecated?: boolean;
}

const f = (name: string, description: string, fallback: string[] = ['default-src'], builder = true): DirectiveInfo => ({ name, kind: 'fetch', description, fallback, builder });

export const DIRECTIVES: DirectiveInfo[] = [
  f('default-src', 'Fallback for every fetch directive that is not set.', [], true),
  f('script-src', 'Where JavaScript can load from, and whether inline scripts and eval are allowed.'),
  f('script-src-elem', 'Like script-src, but only for <script> elements.', ['script-src', 'default-src'], false),
  f('script-src-attr', 'Like script-src, but only for inline event handlers such as onclick.', ['script-src', 'default-src'], false),
  f('style-src', 'Where stylesheets can load from, and whether inline styles are allowed.'),
  f('style-src-elem', 'Like style-src, but only for <style> and <link rel=stylesheet>.', ['style-src', 'default-src'], false),
  f('style-src-attr', 'Like style-src, but only for style="" attributes.', ['style-src', 'default-src'], false),
  f('img-src', 'Where images and favicons can load from.'),
  f('connect-src', 'Where scripts can connect to: fetch, XHR, WebSocket, EventSource, beacons.'),
  f('font-src', 'Where web fonts can load from.'),
  f('media-src', 'Where <audio> and <video> can load from.'),
  f('frame-src', 'Where <iframe> and <frame> content can load from.', ['child-src', 'default-src']),
  f('child-src', 'Where frames and workers can load from.'),
  f('object-src', 'Where <object>, <embed> and <applet> plugins can load from. Set to \'none\'.'),
  f('worker-src', 'Where Worker, SharedWorker and ServiceWorker scripts can load from.', ['child-src', 'script-src', 'default-src']),
  f('manifest-src', 'Where the web app manifest can load from.'),
  f('prefetch-src', 'Where prefetch and prerender requests can go (deprecated).', ['default-src'], false),
  { name: 'base-uri', kind: 'document', description: 'Which URLs may be used in <base href>. Prevents base-tag injection.', fallback: [], builder: true },
  { name: 'form-action', kind: 'navigation', description: 'Where forms can submit to.', fallback: [], builder: true },
  { name: 'frame-ancestors', kind: 'navigation', description: 'Which sites may embed this page in a frame. Replaces X-Frame-Options.', fallback: [], builder: true, metaIgnored: true },
  { name: 'sandbox', kind: 'document', description: 'Applies iframe-style sandbox restrictions to the page.', fallback: [], builder: false, metaIgnored: true },
  { name: 'upgrade-insecure-requests', kind: 'flag', description: 'Rewrites http:// subresource and navigation URLs to https://.', fallback: [], builder: true },
  { name: 'block-all-mixed-content', kind: 'flag', description: 'Blocks mixed content (deprecated: use upgrade-insecure-requests).', fallback: [], builder: false, deprecated: true },
  { name: 'report-uri', kind: 'reporting', description: 'URL that receives violation reports (deprecated in favour of report-to, still widely used).', fallback: [], builder: true, metaIgnored: true, deprecated: true },
  { name: 'report-to', kind: 'reporting', description: 'Name of a Reporting-Endpoints / Report-To group that receives violation reports.', fallback: [], builder: true, metaIgnored: true },
  { name: 'require-trusted-types-for', kind: 'trusted', description: "Enforces Trusted Types for DOM XSS sinks. The only value is 'script'.", fallback: [], builder: true },
  { name: 'trusted-types', kind: 'trusted', description: 'Names of allowed Trusted Types policies.', fallback: [], builder: true },
];

export const DIRECTIVE_BY_NAME = new Map(DIRECTIVES.map((d) => [d.name, d]));
export const BUILDER_DIRECTIVES = DIRECTIVES.filter((d) => d.builder);
export const META_IGNORED = DIRECTIVES.filter((d) => d.metaIgnored).map((d) => d.name);

// ---------- sources ----------

export type SourceKind = 'keyword' | 'nonce' | 'hash' | 'scheme' | 'host' | 'token' | 'invalid';

const KEYWORDS = ['self', 'none', 'unsafe-inline', 'unsafe-eval', 'unsafe-hashes', 'strict-dynamic', 'wasm-unsafe-eval', 'report-sample', 'inline-speculation-rules', 'trusted-types-eval'];
const HASH_LEN: Record<string, number> = { sha256: 44, sha384: 64, sha512: 88 };

/** Quote bare keywords and nonce/hash sources ("self" to "'self'"); leave everything else alone. */
export function normaliseSource(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const bare = s.replace(/^'|'$/g, '');
  if (KEYWORDS.includes(bare.toLowerCase())) return `'${bare.toLowerCase()}'`;
  if (/^nonce-/i.test(bare)) return `'nonce-${bare.slice(6)}'`;
  if (/^sha(256|384|512)-/i.test(bare)) return `'${bare.toLowerCase().slice(0, 6)}${bare.slice(6)}'`;
  return s;
}

const HOST_RE = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:\*|(?:\*\.)?[a-z0-9_-]+(?:\.[a-z0-9_-]+)*|\[[0-9a-f:.]+\])(?::(?:\d{1,5}|\*))?(?:\/[^\s;,]*)?$/i;

export function classifySource(s: string): SourceKind {
  if (/^'[^']*'$/.test(s)) {
    const inner = s.slice(1, -1);
    if (KEYWORDS.includes(inner.toLowerCase())) return 'keyword';
    if (/^nonce-[A-Za-z0-9+/_=-]+$/.test(inner)) return 'nonce';
    const h = /^(sha256|sha384|sha512)-([A-Za-z0-9+/_=-]+)$/.exec(inner);
    if (h) return 'hash';
    return 'invalid';
  }
  if (/^[a-z][a-z0-9+.-]*:$/i.test(s)) return 'scheme';
  if (s === '*' || HOST_RE.test(s)) return 'host';
  return 'invalid';
}

/** A reason this source can't be valid in this directive, or null. */
export function sourceProblem(directive: string, source: string): string | null {
  const info = DIRECTIVE_BY_NAME.get(directive);
  const kind = classifySource(source);
  if (directive === 'report-uri') return /^(https?:\/\/|\/)[^\s]+$/i.test(source) ? null : 'report-uri needs a URL or a path such as /csp-report.';
  if (directive === 'report-to') return /^[A-Za-z0-9_.-]+$/.test(source) ? null : 'report-to needs a group name (letters, digits, - _ .).';
  if (directive === 'require-trusted-types-for') return source === "'script'" ? null : "require-trusted-types-for only accepts 'script'.";
  if (directive === 'trusted-types') return source === "'none'" || source === "'allow-duplicates'" || source === '*' || /^[A-Za-z0-9\-#=_/@.%]+$/.test(source) ? null : 'trusted-types takes policy names, \'none\', \'allow-duplicates\' or *.';
  if (directive === 'sandbox') return /^allow-[a-z-]+$/.test(source) ? null : 'sandbox takes allow-* tokens.';
  if (info?.kind === 'flag') return `${directive} takes no values.`;
  if (kind === 'invalid') {
    if (/^'/.test(source) || /'$/.test(source)) return `${source} is not a valid quoted keyword, nonce or hash.`;
    return `${source} isn't a valid source. Use a keyword like 'self', a scheme like https:, or a host like cdn.example.com.`;
  }
  if (kind === 'hash') {
    const m = /^'(sha256|sha384|sha512)-([A-Za-z0-9+/_=-]+)'$/.exec(source)!;
    if (m[2].length !== HASH_LEN[m[1]]) return `A ${m[1]} hash should be ${HASH_LEN[m[1]]} base64 characters.`;
  }
  const scriptish = ['default-src', 'script-src', 'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem', 'style-src-attr'].includes(directive);
  if ((kind === 'nonce' || kind === 'hash') && !scriptish) return `Nonces and hashes only apply to script and style directives, not ${directive}.`;
  const navOnly = ['base-uri', 'form-action', 'frame-ancestors'].includes(directive);
  if (kind === 'keyword') {
    const k = source.slice(1, -1).toLowerCase();
    if (['unsafe-inline', 'unsafe-eval', 'unsafe-hashes', 'strict-dynamic', 'wasm-unsafe-eval', 'report-sample', 'inline-speculation-rules'].includes(k) && (navOnly || !scriptish) && !(k === 'wasm-unsafe-eval' && directive === 'script-src')) return `${source} has no effect in ${directive}.`;
  }
  if (kind === 'scheme' && directive === 'frame-ancestors' && /^(data|blob):$/i.test(source)) return `${source} isn't useful in frame-ancestors.`;
  return null;
}

// ---------- parse / serialise ----------

export function serialisePolicy(policy: Policy): string {
  return policy.map((d) => [d.name, ...d.sources].join(' ')).join('; ');
}

export interface ParseResult {
  policy: Policy;
  notes: string[];
}

/** Parse a policy from a bare value, a "Content-Security-Policy:" header line or a <meta> tag. */
export function parsePolicy(text: string): ParseResult {
  let value = text.trim();
  const notes: string[] = [];
  const meta = /<meta[^>]*content\s*=\s*("([^"]*)"|'([^']*)')/is.exec(value);
  if (meta) {
    value = (meta[2] ?? meta[3] ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    notes.push('Read the policy from the <meta> tag.');
  }
  const server = /(?:add_header|Header\s+(?:always\s+)?set)\s+(Content-Security-Policy(?:-Report-Only)?)\s+"((?:[^"\\]|\\.)*)"/i.exec(value);
  if (server) {
    value = `${server[1]}: ${server[2].replace(/\\(.)/g, '$1')}`;
    notes.push('Read the policy from a server config line.');
  }
  const header = /^\s*(content-security-policy(?:-report-only)?)\s*:\s*/i.exec(value);
  if (header) {
    if (/report-only/i.test(header[1])) notes.push('This was a Report-Only header; the builder outputs an enforcing policy unless you tick Report-Only.');
    value = value.slice(header[0].length);
  }
  if (/^".*"$/s.test(value)) value = value.slice(1, -1); // a policy pasted inside double quotes (nginx, Apache)
  value = value.replace(/\s+/g, ' ').trim();
  const policy = parseCsp(value).map((d) => ({ name: d.name, sources: d.sources }));
  const counts = new Map<string, number>();
  for (const part of value.split(';')) {
    const name = part.trim().split(/\s+/)[0]?.toLowerCase();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const [name, n] of counts) if (n > 1) notes.push(`"${name}" appears ${n} times. Browsers use only the first, so the extra copies were dropped.`);
  return { policy, notes };
}

export const getDirective = (p: Policy, name: string) => p.find((d) => d.name === name);

/** Sources that apply to `name`, following the fallback chain. Undefined when nothing applies. */
export function effectiveSources(p: Policy, name: string): { from: string; sources: string[] } | undefined {
  const own = getDirective(p, name);
  if (own) return { from: name, sources: own.sources };
  for (const fb of DIRECTIVE_BY_NAME.get(name)?.fallback ?? []) {
    const d = getDirective(p, fb);
    if (d) return { from: fb, sources: d.sources };
  }
  return undefined;
}

export function setDirective(p: Policy, name: string, sources: string[]): Policy {
  return p.some((d) => d.name === name) ? p.map((d) => (d.name === name ? { name, sources } : d)) : [...p, { name, sources }];
}

export const removeDirective = (p: Policy, name: string): Policy => p.filter((d) => d.name !== name);

/** Add a source, applying 'none' exclusivity rules. */
export function addSource(p: Policy, name: string, source: string): Policy {
  const s = normaliseSource(source);
  if (!s) return p;
  const cur = getDirective(p, name)?.sources ?? [];
  if (cur.includes(s)) return p;
  const next = s === "'none'" ? [s] : [...cur.filter((x) => x !== "'none'"), s];
  return setDirective(p, name, next);
}

export function removeSource(p: Policy, name: string, source: string): Policy {
  return setDirective(p, name, (getDirective(p, name)?.sources ?? []).filter((x) => x !== source));
}

// ---------- presets ----------

export type PresetId = 'strict' | 'spa' | 'static';

export const PRESETS: { id: PresetId; label: string; description: string }[] = [
  { id: 'strict', label: 'Strict (nonce)', description: "Nonce-based with 'strict-dynamic', as recommended by Google. You must add a fresh nonce to every response." },
  { id: 'spa', label: 'Single-page app', description: 'Same-origin scripts, inline styles allowed, HTTPS APIs and images. Fits a bundled React/Vue/Svelte app.' },
  { id: 'static', label: 'Static site', description: 'Everything locked to the same origin, no inline code, no framing.' },
];

export function presetPolicy(id: PresetId, nonce = 'REPLACE_WITH_RANDOM_NONCE'): Policy {
  const p = (name: string, ...sources: string[]): PolicyDirective => ({ name, sources });
  if (id === 'strict') {
    return [
      p('script-src', `'nonce-${nonce}'`, "'strict-dynamic'", 'https:', "'unsafe-inline'"),
      p('object-src', "'none'"),
      p('base-uri', "'none'"),
      p('require-trusted-types-for', "'script'"),
    ];
  }
  if (id === 'spa') {
    return [
      p('default-src', "'self'"),
      p('script-src', "'self'"),
      p('style-src', "'self'", "'unsafe-inline'"),
      p('img-src', "'self'", 'data:', 'https:'),
      p('font-src', "'self'", 'data:'),
      p('connect-src', "'self'", 'https:'),
      p('object-src', "'none'"),
      p('base-uri', "'self'"),
      p('form-action', "'self'"),
      p('frame-ancestors', "'self'"),
      p('upgrade-insecure-requests'),
    ];
  }
  return [
    p('default-src', "'none'"),
    p('script-src', "'self'"),
    p('style-src', "'self'"),
    p('img-src', "'self'", 'data:'),
    p('font-src', "'self'"),
    p('connect-src', "'self'"),
    p('manifest-src', "'self'"),
    p('object-src', "'none'"),
    p('base-uri', "'self'"),
    p('form-action', "'self'"),
    p('frame-ancestors', "'none'"),
    p('upgrade-insecure-requests'),
  ];
}

// ---------- evaluator ----------

export type Severity = 'high' | 'medium' | 'low' | 'syntax' | 'info' | 'ok';

export interface Finding {
  severity: Severity;
  directive: string;
  message: string;
  fix?: string;
}

export interface Evaluation {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  findings: Finding[];
}

/** Hosts that serve JSONP endpoints, AngularJS or user content, and so can bypass a host allowlist. */
export const BYPASS_HOSTS: [string, string][] = [
  ['ajax.googleapis.com', 'serves AngularJS and JSONP-capable libraries'],
  ['googleapis.com', 'hosts JSONP endpoints'],
  ['www.google.com', 'has JSONP endpoints'],
  ['accounts.google.com', 'has JSONP endpoints'],
  ['apis.google.com', 'has JSONP endpoints'],
  ['cdnjs.cloudflare.com', 'serves AngularJS and other gadget libraries'],
  ['cdn.jsdelivr.net', 'serves any npm or GitHub file'],
  ['unpkg.com', 'serves any npm file'],
  ['raw.githubusercontent.com', 'serves arbitrary user content'],
  ['github.io', 'serves arbitrary user content'],
  ['gist.github.com', 'serves arbitrary user content'],
  ['cloudfront.net', 'serves arbitrary user content'],
  ['amazonaws.com', 'serves arbitrary user content'],
  ['azureedge.net', 'serves arbitrary user content'],
  ['appspot.com', 'serves arbitrary user content and JSONP'],
  ['herokuapp.com', 'serves arbitrary user content'],
  ['firebaseapp.com', 'serves arbitrary user content'],
  ['web.app', 'serves arbitrary user content'],
  ['netlify.app', 'serves arbitrary user content'],
  ['vercel.app', 'serves arbitrary user content'],
  ['googleusercontent.com', 'serves arbitrary user content'],
  ['blogspot.com', 'serves JSONP feeds'],
  ['connect.facebook.net', 'has JSONP-like endpoints'],
  ['platform.twitter.com', 'has JSONP endpoints'],
  ['cdn.syndication.twimg.com', 'has JSONP endpoints'],
  ['yastatic.net', 'serves AngularJS'],
  ['maps.googleapis.com', 'hosts JSONP endpoints'],
];

function hostOf(source: string): { host: string; hasPath: boolean } | null {
  if (classifySource(source) !== 'host') return null;
  const m = /^(?:[a-z][a-z0-9+.-]*:\/\/)?([^/:]+|\[[^\]]+\])(?::(?:\d+|\*))?(\/.*)?$/i.exec(source);
  if (!m) return null;
  return { host: m[1].toLowerCase(), hasPath: !!m[2] && m[2] !== '/' };
}

function bypassFor(source: string): { entry: string; why: string; hasPath: boolean } | null {
  const h = hostOf(source);
  if (!h || h.host === '*') return null;
  for (const [entry, why] of BYPASS_HOSTS) {
    const wildcardCovers = h.host.startsWith('*.') && (entry === h.host.slice(2) || entry.endsWith(h.host.slice(1)));
    if (h.host === entry || h.host.endsWith('.' + entry) || wildcardCovers) return { entry, why, hasPath: h.hasPath };
  }
  return null;
}

const FETCH_FOR_WILDCARD = ['img-src', 'media-src', 'font-src', 'frame-src', 'child-src', 'manifest-src', 'worker-src', 'style-src', 'default-src'];

export function evaluate(policy: Policy): Evaluation {
  const findings: Finding[] = [];
  const add = (severity: Severity, directive: string, message: string, fix?: string) => findings.push({ severity, directive, message, fix });

  if (policy.length === 0) {
    add('high', 'policy', 'The policy is empty, so nothing is restricted.', "Start with a preset or add default-src 'self'.");
    return { grade: 'F', score: 0, findings };
  }

  // Syntax.
  for (const d of policy) {
    const info = DIRECTIVE_BY_NAME.get(d.name);
    if (!info) {
      add('syntax', d.name, `Unknown directive "${d.name}". Browsers ignore it.`, 'Check the spelling.');
      continue;
    }
    if (info.deprecated) add('info', d.name, `${d.name} is deprecated.`, d.name === 'report-uri' ? 'Also add report-to for modern browsers.' : 'Use upgrade-insecure-requests.');
    if (info.kind === 'flag' && d.sources.length) add('syntax', d.name, `${d.name} takes no values.`);
    if (d.sources.includes("'none'") && d.sources.length > 1) add('syntax', d.name, `'none' is combined with other sources in ${d.name}. Browsers ignore 'none' then.`, "Use 'none' alone or remove it.");
    for (const s of d.sources) {
      const prob = info.kind === 'flag' ? null : sourceProblem(d.name, s);
      if (prob) add('syntax', d.name, prob);
      if (/^(self|none|unsafe-inline|unsafe-eval|strict-dynamic|unsafe-hashes)$/i.test(s)) add('syntax', d.name, `"${s}" without quotes is treated as a host name. Write '${s.toLowerCase()}'.`, `'${s.toLowerCase()}'`);
      const nonce = /^'nonce-(.+)'$/.exec(s);
      if (nonce && nonce[1].length < 16) add('medium', d.name, 'This nonce is short or guessable. Use at least 128 bits (16 random bytes, base64).', 'Generate a fresh random nonce per response.');
      if (nonce && /REPLACE/i.test(nonce[1])) add('medium', d.name, 'The nonce is still the placeholder. Replace it with a fresh random value on every response.');
    }
  }

  // script-src.
  const script = effectiveSources(policy, 'script-src');
  const scriptName = script?.from ?? 'script-src';
  if (!script) {
    add('high', 'script-src', 'Neither script-src nor default-src is set, so scripts can load from anywhere.', "Add script-src with 'self' or a nonce.");
  } else {
    const src = script.sources;
    const hasNonceOrHash = src.some((s) => /^'(nonce|sha256|sha384|sha512)-/.test(s));
    const strictDynamic = src.includes("'strict-dynamic'");
    if (src.includes("'unsafe-inline'")) {
      if (hasNonceOrHash) add('info', scriptName, "'unsafe-inline' is ignored by browsers that support nonces or hashes. It only serves as a fallback for old browsers.");
      else add('high', scriptName, "'unsafe-inline' allows inline scripts, so an injected <script> or onclick handler runs. This defeats XSS protection.", "Remove it and use a nonce or hash ('strict-dynamic' helps).");
    }
    if (src.includes("'unsafe-eval'")) add('medium', scriptName, "'unsafe-eval' allows eval() and similar, which turns many injections into code execution.", "Remove 'unsafe-eval'; use 'wasm-unsafe-eval' if you only need WebAssembly.");
    if (strictDynamic && !hasNonceOrHash) add('medium', scriptName, "'strict-dynamic' needs a nonce or hash to be useful; without one no script is trusted.", "Add a 'nonce-…' or hash source.");
    if (src.includes("'unsafe-hashes'")) add('low', scriptName, "'unsafe-hashes' allows inline event handlers with matching hashes.");
    for (const s of src) {
      const kind = classifySource(s);
      const ignored = strictDynamic;
      const sev = (v: Severity): Severity => (ignored ? 'info' : v);
      const note = ignored ? ' (ignored by browsers that support \'strict-dynamic\', a fallback only)' : '';
      if (s === '*') add(sev('high'), scriptName, `A wildcard (*) allows scripts from any host${note}.`, 'List the exact hosts, or use a nonce with strict-dynamic.');
      else if (kind === 'scheme' && /^(https?|data|blob|filesystem|wss?):$/i.test(s)) {
        const lower = s.toLowerCase();
        add(sev('high'), scriptName, `${s} allows scripts from ${lower === 'data:' ? 'any data: URL, so injected code can be embedded' : lower === 'blob:' ? 'blob: URLs, which can be created from injected strings' : 'any ' + lower.replace(':', '').toUpperCase() + ' host'}${note}.`, 'Use specific hosts, hashes or a nonce.');
      } else if (kind === 'host') {
        const h = hostOf(s);
        if (/^http:\/\//i.test(s)) add(sev('high'), scriptName, `${s} loads scripts over plain HTTP, which a network attacker can modify${note}.`, `Use https://`);
        if (h?.host.startsWith('*.') && !bypassFor(s)) add(sev('low'), scriptName, `${s} trusts every subdomain${note}.`, 'List the specific subdomains you need.');
        const b = bypassFor(s);
        if (b) add(sev(b.hasPath ? 'low' : 'high'), scriptName, `${s} ${b.why}; attackers can use it to bypass this policy${b.hasPath ? ' (narrowed by the path, but still risky)' : ''}${note}.`, 'Self-host the script, or use a nonce or hash.');
      }
    }
  }

  // object-src, base-uri.
  const obj = effectiveSources(policy, 'object-src');
  if (!obj) add('medium', 'object-src', "object-src is missing, so plugins (<object>, <embed>) can load from anywhere and be used to run script.", "Add object-src 'none'.");
  else if (!(obj.sources.length === 1 && obj.sources[0] === "'none'")) add('medium', obj.from, `object-src${obj.from === 'default-src' ? ' (inherited from default-src)' : ''} allows ${obj.sources.join(' ') || 'nothing listed'}: plugins can be abused.`, "Set object-src 'none'.");
  if (!getDirective(policy, 'base-uri')) add('medium', 'base-uri', 'base-uri is missing: an injected <base> tag can redirect all relative script URLs to an attacker.', "Add base-uri 'self' or 'none'.");
  else if (effectiveSources(policy, 'base-uri')!.sources.some((s) => s === '*' || /^https?:$/i.test(s))) add('medium', 'base-uri', 'base-uri allows any host.', "Use 'self' or 'none'.");

  // framing and forms.
  const fa = getDirective(policy, 'frame-ancestors');
  if (!fa) add('low', 'frame-ancestors', 'frame-ancestors is missing: other sites can frame this page (clickjacking) unless X-Frame-Options is set.', "Add frame-ancestors 'self' or 'none'.");
  else if (fa.sources.some((s) => s === '*' || /^https?:$/i.test(s))) add('medium', 'frame-ancestors', 'frame-ancestors allows any site to embed this page.', "Use 'self', 'none' or specific hosts.");
  if (!getDirective(policy, 'form-action')) add('low', 'form-action', 'form-action is missing: injected forms can post to any site. It does not fall back to default-src.', "Add form-action 'self'.");
  else if (getDirective(policy, 'form-action')!.sources.includes('*')) add('low', 'form-action', 'form-action allows submitting forms anywhere.');

  // Other fetch directives.
  const style = effectiveSources(policy, 'style-src');
  if (style?.sources.includes("'unsafe-inline'") && !style.sources.some((s) => /^'(nonce|sha\d+)-/.test(s))) add('low', style.from, "'unsafe-inline' in style-src allows injected styles, which can leak data or restyle the page.", 'Use nonces or hashes for inline styles where you can.');
  const conn = effectiveSources(policy, 'connect-src');
  if (conn?.sources.includes('*')) add('medium', conn.from, 'connect-src * lets injected scripts send data to any host.', 'List the APIs you use.');
  for (const name of FETCH_FOR_WILDCARD) {
    const d = getDirective(policy, name);
    if (!d || name === 'style-src') continue;
    if (d.sources.includes('*') && name !== 'default-src') add('low', name, `${name} * allows loading from any host.`);
    if (name === 'default-src' && d.sources.includes('*')) add('medium', name, 'default-src * allows any host for every directive that falls back to it.', "Start from default-src 'self' or 'none'.");
    if (d.sources.some((s) => /^http:\/\//i.test(s) || s.toLowerCase() === 'http:') && name !== 'script-src') add('medium', name, `${name} includes plain HTTP sources, which a network attacker can tamper with.`, 'Use https:// sources.');
  }
  for (const d of policy) {
    if (['script-src', 'script-src-elem', 'script-src-attr'].includes(d.name) && d.name !== scriptName) {
      if (d.sources.includes("'unsafe-inline'") && !d.sources.some((s) => /^'(nonce|sha\d+)-/.test(s))) add('high', d.name, `'unsafe-inline' in ${d.name} allows inline scripts.`);
      if (d.sources.includes("'unsafe-eval'")) add('medium', d.name, `'unsafe-eval' in ${d.name} allows eval().`);
    }
  }

  // Hygiene.
  if (!getDirective(policy, 'upgrade-insecure-requests') && !getDirective(policy, 'block-all-mixed-content')) add('info', 'upgrade-insecure-requests', 'Consider upgrade-insecure-requests to rewrite http:// subresources to https://.');
  if (!getDirective(policy, 'report-uri') && !getDirective(policy, 'report-to')) add('info', 'report-to', 'No reporting endpoint is set, so you will not see violations. Consider report-to (and report-uri as a fallback), or start with Content-Security-Policy-Report-Only.');
  if (getDirective(policy, 'report-to')) add('info', 'report-to', 'report-to needs a matching Reporting-Endpoints (or Report-To) response header that defines the group.');
  if (!getDirective(policy, 'require-trusted-types-for')) add('info', 'require-trusted-types-for', "Trusted Types ('script') can eliminate DOM XSS but needs code changes; consider it for strict apps.");

  // Positive notes.
  const sc = script?.sources ?? [];
  if (script && sc.some((s) => /^'nonce-/.test(s)) && sc.includes("'strict-dynamic'")) add('ok', scriptName, "Nonce plus 'strict-dynamic' is the recommended modern script policy.");
  else if (script && sc.length === 1 && sc[0] === "'self'") add('ok', scriptName, "script-src 'self' only allows your own scripts, with no inline code.");
  if (obj && obj.sources.length === 1 && obj.sources[0] === "'none'") add('ok', 'object-src', "object-src 'none' blocks plugins.");

  const penalty: Record<Severity, number> = { high: 30, medium: 12, low: 4, syntax: 8, info: 0, ok: 0 };
  const score = Math.max(0, 100 - findings.reduce((n, x) => n + penalty[x.severity], 0));
  const hasHigh = findings.some((x) => x.severity === 'high');
  let grade: Evaluation['grade'] = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  if (hasHigh && (grade === 'A' || grade === 'B')) grade = 'C';
  const order: Record<Severity, number> = { high: 0, medium: 1, syntax: 2, low: 3, info: 4, ok: 5 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { grade, score, findings };
}

// ---------- outputs ----------

export type OutputFormat = 'header' | 'meta' | 'nginx' | 'apache' | 'vercel' | 'netlify';

const headerName = (reportOnly: boolean) => (reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy');

export function metaTag(policy: Policy): { tag: string; dropped: string[] } {
  const dropped = policy.filter((d) => META_IGNORED.includes(d.name)).map((d) => d.name);
  const content = serialisePolicy(policy.filter((d) => !META_IGNORED.includes(d.name)))
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
  return { tag: `<meta http-equiv="Content-Security-Policy" content="${content}">`, dropped };
}

export function formatOutput(policy: Policy, format: OutputFormat, reportOnly = false): string {
  const value = serialisePolicy(policy);
  const name = headerName(reportOnly);
  const quoted = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  switch (format) {
    case 'header':
      return `${name}: ${value}`;
    case 'meta':
      return metaTag(policy).tag;
    case 'nginx':
      return `add_header ${name} "${quoted.replace(/\$/g, '\\$')}" always;`;
    case 'apache':
      return `Header always set ${name} "${quoted}"`;
    case 'vercel':
      return JSON.stringify({ headers: [{ source: '/(.*)', headers: [{ key: name, value }] }] }, null, 2);
    case 'netlify':
      return `/*\n  ${name}: ${value}`;
  }
}

export const FORMAT_HINTS: Record<OutputFormat, string> = {
  header: 'Send as an HTTP response header from your server or CDN.',
  meta: 'Put inside <head>, before any scripts. Meta policies are weaker than headers.',
  nginx: 'Add inside a server or location block of nginx.conf. "always" also sends it on error responses.',
  apache: 'Add to your Apache config or .htaccess (needs mod_headers).',
  vercel: 'Save as vercel.json at the project root.',
  netlify: 'Save as a file named _headers in your publish directory.',
};

// ---------- hashes and nonces ----------

export type HashAlgo = 'sha256' | 'sha384' | 'sha512';

/** Strip a surrounding <script>…</script> or <style>…</style> tag so only the exact body is hashed. */
export function extractInlineBody(text: string): string {
  const m = /^\s*<(script|style)\b[^>]*>([\s\S]*)<\/\1>\s*$/i.exec(text);
  return m ? m[2] : text;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export async function cspHash(body: string, algo: HashAlgo = 'sha256'): Promise<string> {
  const digest = await crypto.subtle.digest(`SHA-${algo.slice(3)}`, new TextEncoder().encode(body));
  return `'${algo}-${toBase64(new Uint8Array(digest))}'`;
}

/** A fresh 128-bit nonce, base64. */
export function generateNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return toBase64(b);
}
