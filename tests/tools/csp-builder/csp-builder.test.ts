import { describe, expect, it } from 'vitest';
import {
  addSource,
  classifySource,
  cspHash,
  effectiveSources,
  evaluate,
  extractInlineBody,
  formatOutput,
  generateNonce,
  metaTag,
  normaliseSource,
  parsePolicy,
  presetPolicy,
  removeDirective,
  removeSource,
  serialisePolicy,
  setDirective,
  sourceProblem,
  type Policy,
} from '../../../src/tools/csp-builder/features/csp-builder';

const ev = (text: string) => evaluate(parsePolicy(text).policy);
const find = (text: string, re: RegExp, severity?: string) => ev(text).findings.find((f) => re.test(f.message) && (!severity || f.severity === severity));

describe('sources', () => {
  it('quotes keywords, nonces and hashes', () => {
    expect(normaliseSource('self')).toBe("'self'");
    expect(normaliseSource("'NONE'")).toBe("'none'");
    expect(normaliseSource('strict-dynamic')).toBe("'strict-dynamic'");
    expect(normaliseSource('nonce-abc123')).toBe("'nonce-abc123'");
    expect(normaliseSource('sha256-AAAA')).toBe("'sha256-AAAA'");
    expect(normaliseSource(' https://cdn.example.com ')).toBe('https://cdn.example.com');
  });

  it('classifies sources', () => {
    expect(classifySource("'self'")).toBe('keyword');
    expect(classifySource("'nonce-abc123=='")).toBe('nonce');
    expect(classifySource(`'sha256-${'A'.repeat(43)}='`)).toBe('hash');
    expect(classifySource('https:')).toBe('scheme');
    expect(classifySource('*.example.com')).toBe('host');
    expect(classifySource('https://example.com:8443/path/')).toBe('host');
    expect(classifySource('*')).toBe('host');
    expect(classifySource("'selff'")).toBe('invalid');
    expect(classifySource('exa mple')).toBe('invalid');
  });

  it('explains invalid sources per directive', () => {
    expect(sourceProblem('script-src', "'self'")).toBeNull();
    expect(sourceProblem('script-src', "'sha256-abc'")).toMatch(/44 base64/);
    expect(sourceProblem('img-src', "'nonce-abc123'")).toMatch(/only apply to script and style/);
    expect(sourceProblem('base-uri', "'unsafe-inline'")).toMatch(/no effect/);
    expect(sourceProblem('report-uri', 'not a url')).toMatch(/needs a URL/);
    expect(sourceProblem('require-trusted-types-for', "'script'")).toBeNull();
    expect(sourceProblem('require-trusted-types-for', "'style'")).toMatch(/only accepts/);
    expect(sourceProblem('trusted-types', 'my-policy')).toBeNull();
  });
});

describe('parse and serialise', () => {
  it('round-trips a policy and handles header and meta wrappers', () => {
    const text = "default-src 'self'; img-src 'self' data: https:; upgrade-insecure-requests";
    const { policy } = parsePolicy(text);
    expect(policy).toHaveLength(3);
    expect(serialisePolicy(policy)).toBe(text);
    expect(parsePolicy(`Content-Security-Policy: ${text}`).policy).toEqual(policy);
    const meta = parsePolicy(`<meta http-equiv="Content-Security-Policy" content="${text}">`);
    expect(meta.policy).toEqual(policy);
    expect(meta.notes[0]).toMatch(/meta/);
    expect(parsePolicy('Content-Security-Policy-Report-Only: default-src *').notes[0]).toMatch(/Report-Only/);
  });

  it('drops and reports duplicate directives', () => {
    const r = parsePolicy("script-src 'self'; script-src *");
    expect(r.policy).toEqual([{ name: 'script-src', sources: ["'self'"] }]);
    expect(r.notes.join(' ')).toMatch(/"script-src" appears 2 times/);
  });

  it('edits a policy', () => {
    let p: Policy = [];
    p = addSource(p, 'script-src', 'self');
    p = addSource(p, 'script-src', "'self'");
    p = addSource(p, 'script-src', 'https://cdn.example.com');
    expect(p[0].sources).toEqual(["'self'", 'https://cdn.example.com']);
    p = addSource(p, 'script-src', 'none');
    expect(p[0].sources).toEqual(["'none'"]);
    p = addSource(p, 'script-src', 'self');
    expect(p[0].sources).toEqual(["'self'"]);
    expect(removeSource(p, 'script-src', "'self'")[0].sources).toEqual([]);
    expect(removeDirective(p, 'script-src')).toEqual([]);
    expect(setDirective(p, 'img-src', ['data:'])).toHaveLength(2);
  });

  it('follows the fallback chain', () => {
    const { policy } = parsePolicy("default-src 'self'; child-src https:");
    expect(effectiveSources(policy, 'script-src')).toEqual({ from: 'default-src', sources: ["'self'"] });
    expect(effectiveSources(policy, 'frame-src')).toEqual({ from: 'child-src', sources: ['https:'] });
    expect(effectiveSources(policy, 'worker-src')?.from).toBe('child-src');
    expect(effectiveSources(policy, 'base-uri')).toBeUndefined();
  });
});

describe('presets', () => {
  it('grades the presets well', () => {
    for (const id of ['strict', 'spa', 'static'] as const) {
      const e = evaluate(presetPolicy(id, generateNonce()));
      expect(['A', 'B'], id).toContain(e.grade);
      expect(e.findings.some((f) => f.severity === 'high'), id).toBe(false);
    }
    expect(evaluate(presetPolicy('static')).grade).toBe('A');
    expect(serialisePolicy(presetPolicy('strict', 'abc'))).toContain("'nonce-abc' 'strict-dynamic'");
  });

  it('flags the placeholder nonce', () => {
    expect(evaluate(presetPolicy('strict')).findings.some((f) => /placeholder/.test(f.message))).toBe(true);
  });
});

describe('evaluator', () => {
  it('fails an empty policy', () => {
    const e = evaluate([]);
    expect(e.grade).toBe('F');
    expect(e.findings[0].severity).toBe('high');
  });

  it('flags unsafe-inline without nonce, and treats it as a fallback with one', () => {
    expect(find("script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'", /unsafe-inline/, 'high')).toBeTruthy();
    const withNonce = find("script-src 'nonce-aaaaaaaaaaaaaaaaaaaaaa==' 'unsafe-inline'; object-src 'none'; base-uri 'none'", /unsafe-inline/);
    expect(withNonce?.severity).toBe('info');
    expect(ev("default-src 'unsafe-inline'").findings.some((f) => f.severity === 'high' && f.directive === 'default-src')).toBe(true);
  });

  it('flags unsafe-eval, wildcards and broad schemes in script-src', () => {
    expect(find("script-src 'self' 'unsafe-eval'", /eval/, 'medium')).toBeTruthy();
    expect(find('script-src *', /wildcard/, 'high')).toBeTruthy();
    expect(find('script-src https:', /any HTTPS host/, 'high')).toBeTruthy();
    expect(find('script-src data:', /data: URL/, 'high')).toBeTruthy();
    expect(find('script-src http://example.com', /plain HTTP/, 'high')).toBeTruthy();
    expect(find('script-src *.example.com', /every subdomain/, 'low')).toBeTruthy();
  });

  it('demotes allowlist weaknesses when strict-dynamic is used', () => {
    const nonce = "'nonce-aaaaaaaaaaaaaaaaaaaaaa=='";
    const f = find(`script-src ${nonce} 'strict-dynamic' https: *`, /wildcard/);
    expect(f?.severity).toBe('info');
    expect(find("script-src 'strict-dynamic'", /needs a nonce or hash/, 'medium')).toBeTruthy();
  });

  it('flags JSONP-capable and user-content hosts', () => {
    expect(find('script-src https://ajax.googleapis.com', /ajax\.googleapis\.com/, 'high')).toBeTruthy();
    expect(find('script-src https://cdn.jsdelivr.net', /bypass/, 'high')).toBeTruthy();
    expect(find('script-src https://d111.cloudfront.net', /bypass/, 'high')).toBeTruthy();
    expect(find('script-src *.googleapis.com', /bypass/, 'high')).toBeTruthy();
    expect(find('script-src https://cdn.jsdelivr.net/npm/lib@1/', /bypass/, 'low')).toBeTruthy();
    expect(find('script-src https://static.example.com', /bypass/)).toBeUndefined();
  });

  it('flags missing object-src and base-uri', () => {
    expect(find("script-src 'self'", /object-src is missing/, 'medium')).toBeTruthy();
    expect(find("script-src 'self'", /base-uri is missing/, 'medium')).toBeTruthy();
    expect(find("default-src 'none'", /object-src is missing/)).toBeUndefined();
    expect(find("default-src 'self'", /object-src.*inherited/, 'medium')).toBeTruthy();
    expect(find("script-src 'self'; object-src 'none'; base-uri 'self'", /missing/, 'medium')).toBeUndefined();
  });

  it('flags http sources, wildcards and framing', () => {
    expect(find("script-src 'self'; img-src http://img.example.com", /plain HTTP/, 'medium')).toBeTruthy();
    expect(find("script-src 'self'; connect-src *", /any host/, 'medium')).toBeTruthy();
    expect(find("script-src 'self'; frame-ancestors *", /any site/, 'medium')).toBeTruthy();
    expect(find("script-src 'self'", /frame-ancestors is missing/, 'low')).toBeTruthy();
    expect(find("script-src 'self'", /form-action is missing/, 'low')).toBeTruthy();
    expect(find("default-src *", /default-src \*/, 'medium')).toBeTruthy();
  });

  it('reports syntax problems', () => {
    expect(find("script-src self", /without quotes/, 'syntax')).toBeTruthy();
    expect(find("scriptsrc 'self'", /Unknown directive/, 'syntax')).toBeTruthy();
    expect(find("script-src 'none' https://a.example.com", /'none' is combined/, 'syntax')).toBeTruthy();
    expect(find("upgrade-insecure-requests foo", /takes no values/, 'syntax')).toBeTruthy();
    expect(find("script-src 'nonce-abc'", /short or guessable/, 'medium')).toBeTruthy();
  });

  it('notes reporting and deprecations as info', () => {
    expect(find("default-src 'self'", /No reporting endpoint/, 'info')).toBeTruthy();
    expect(find("default-src 'self'; report-uri /r", /deprecated/, 'info')).toBeTruthy();
    expect(find("default-src 'self'; report-to grp", /Reporting-Endpoints/, 'info')).toBeTruthy();
  });

  it('gives a grade scale', () => {
    expect(evaluate(presetPolicy('static')).grade).toBe('A');
    expect(ev("script-src 'unsafe-inline' 'unsafe-eval' *").grade).toMatch(/[DF]/);
    expect(ev("default-src 'self'").grade).toMatch(/[BCD]/);
  });
});

describe('outputs', () => {
  const policy = parsePolicy("default-src 'self'; frame-ancestors 'none'; report-uri /r; img-src data:").policy;

  it('formats header, nginx, apache, vercel and netlify', () => {
    const v = serialisePolicy(policy);
    expect(formatOutput(policy, 'header')).toBe(`Content-Security-Policy: ${v}`);
    expect(formatOutput(policy, 'header', true)).toMatch(/^Content-Security-Policy-Report-Only: /);
    expect(formatOutput(policy, 'nginx')).toBe(`add_header Content-Security-Policy "${v}" always;`);
    expect(formatOutput(policy, 'apache')).toBe(`Header always set Content-Security-Policy "${v}"`);
    expect(JSON.parse(formatOutput(policy, 'vercel')).headers[0].headers[0]).toEqual({ key: 'Content-Security-Policy', value: v });
    expect(formatOutput(policy, 'netlify')).toBe(`/*\n  Content-Security-Policy: ${v}`);
  });

  it('escapes quotes for server configs', () => {
    const p: Policy = [{ name: 'script-src', sources: ['"x"'] }];
    expect(formatOutput(p, 'nginx')).toContain('\\"x\\"');
    expect(formatOutput(p, 'apache')).toContain('\\"x\\"');
  });

  it('meta output drops directives meta ignores', () => {
    const { tag, dropped } = metaTag(policy);
    expect(dropped).toEqual(['frame-ancestors', 'report-uri']);
    expect(tag).toBe("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; img-src data:\">");
    expect(formatOutput(policy, 'meta')).toBe(tag);
  });
});

describe('hashes and nonces', () => {
  it('computes a known SHA-256 CSP hash', async () => {
    // sha256("") = 47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=
    expect(await cspHash('')).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
    expect(await cspHash("alert('hi')", 'sha384')).toMatch(/^'sha384-[A-Za-z0-9+/]{64}'$/);
    expect(await cspHash('x', 'sha512')).toMatch(/^'sha512-[A-Za-z0-9+/]{86}=='$/);
    expect(classifySource(await cspHash('x'))).toBe('hash');
    expect(sourceProblem('script-src', await cspHash('x'))).toBeNull();
  });

  it('extracts the body from a pasted script tag', () => {
    expect(extractInlineBody('<script>alert(1)</script>')).toBe('alert(1)');
    expect(extractInlineBody('<script type="module"> a\n</script>\n')).toBe(' a\n');
    expect(extractInlineBody('alert(1)')).toBe('alert(1)');
  });

  it('generates distinct 128-bit base64 nonces', () => {
    const a = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(generateNonce()).not.toBe(a);
  });
});

describe('server config paste', () => {
  it('reads nginx and Apache lines', () => {
    const v = "default-src 'self'; img-src data:";
    const policy = parsePolicy(v).policy;
    expect(parsePolicy(formatOutput(policy, 'nginx')).policy).toEqual(policy);
    expect(parsePolicy(formatOutput(policy, 'apache')).policy).toEqual(policy);
    expect(parsePolicy(formatOutput(policy, 'nginx')).notes[0]).toMatch(/server config/);
  });
});
