// Security review and caching summary for a set of response headers.

import { groupHeaders, headerValue, type Header } from './parse';
import { directive, humanDuration, parseCsp, parseDirectives, parseHsts, parseSetCookie, type CspDirective, type Row } from './values';

export type Level = 'good' | 'warn' | 'bad' | 'info';

export interface Check {
  id: string;
  title: string;
  level: Level;
  message: string;
  details?: string[];
}

export interface SecurityReview {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  checks: Check[];
}

const HALF_YEAR = 15_552_000;

function sourcesFor(csp: CspDirective[], name: string): string[] | undefined {
  return csp.find((d) => d.name === name)?.sources ?? csp.find((d) => d.name === 'default-src')?.sources;
}

function reviewCsp(value: string | undefined, reportOnly: string | undefined): Check {
  const base = { id: 'csp', title: 'Content-Security-Policy' };
  if (!value) {
    return reportOnly
      ? { ...base, level: 'warn', message: 'Only a report-only policy is set: violations are reported but nothing is blocked.' }
      : { ...base, level: 'bad', message: 'No CSP. A policy limits the damage of XSS by controlling where scripts can load from.' };
  }
  const csp = parseCsp(value);
  const problems: string[] = [];
  let level: Level = 'good';
  const bump = (l: Level) => {
    if (l === 'bad' || (l === 'warn' && level === 'good')) level = l;
  };
  const scripts = sourcesFor(csp, 'script-src');
  if (!scripts) {
    problems.push('No script-src or default-src: scripts may load from anywhere.');
    bump('bad');
  } else {
    const lower = scripts.map((s) => s.toLowerCase());
    const hasNonceOrHash = lower.some((s) => /^'(nonce-|sha(256|384|512)-)/.test(s));
    const strictDynamic = lower.includes("'strict-dynamic'");
    if (lower.includes("'unsafe-inline'") && !hasNonceOrHash) {
      problems.push("script-src allows 'unsafe-inline': injected inline scripts will run.");
      bump('bad');
    }
    if (lower.includes("'unsafe-eval'")) {
      problems.push("script-src allows 'unsafe-eval' (eval, new Function).");
      bump('warn');
    }
    const wild = lower.filter((s) => s === '*' || s === 'https:' || s === 'http:' || s === 'data:' || s === 'blob:' || /^(https?:\/\/)?\*(\.|$)/.test(s));
    if (wild.length && !strictDynamic) {
      problems.push(`script-src allows broad sources: ${wild.join(' ')}.`);
      bump('bad');
    }
  }
  const objects = sourcesFor(csp, 'object-src');
  if (!objects || !(objects.length === 1 && objects[0] === "'none'")) {
    problems.push("object-src isn't 'none': plugins (<object>, <embed>) aren't blocked.");
    bump('warn');
  }
  if (!csp.some((d) => d.name === 'base-uri')) {
    problems.push("No base-uri: an injected <base> tag could redirect relative script URLs. Use base-uri 'none' or 'self'.");
    bump('warn');
  }
  if (!csp.some((d) => d.name === 'frame-ancestors')) problems.push('No frame-ancestors: framing is controlled only by X-Frame-Options (if set).');
  for (const d of csp) {
    if (d.name !== 'script-src' && d.sources.includes("'unsafe-inline'") && d.name.startsWith('style')) {
      problems.push(`${d.name} allows 'unsafe-inline' (less risky than scripts, but enables CSS injection).`);
    }
  }
  const message = level === 'good' ? 'A policy is set and restricts scripts.' : level === 'bad' ? 'A policy is set but has weaknesses that defeat much of its protection.' : 'A policy is set; a few directives could be tighter.';
  return { ...base, level, message, details: problems.length ? problems : undefined };
}

export function reviewSecurity(headers: Header[]): SecurityReview {
  const g = groupHeaders(headers);
  const get = (n: string) => headerValue(g, n);
  const checks: Check[] = [];

  // HSTS
  const hsts = g.get('strict-transport-security')?.[0]?.value;
  if (!hsts) checks.push({ id: 'hsts', title: 'Strict-Transport-Security', level: 'bad', message: 'No HSTS. Browsers may try plain HTTP first, which can be intercepted. (Only sent over HTTPS.)' });
  else {
    const h = parseHsts(hsts);
    const days = h.maxAge === null ? 0 : Math.round(h.maxAge / 86400);
    if (h.maxAge === null) checks.push({ id: 'hsts', title: 'Strict-Transport-Security', level: 'bad', message: 'HSTS is present but max-age is missing or invalid, so it has no effect.' });
    else if (h.maxAge === 0) checks.push({ id: 'hsts', title: 'Strict-Transport-Security', level: 'warn', message: 'max-age=0 turns HSTS off.' });
    else
      checks.push({
        id: 'hsts',
        title: 'Strict-Transport-Security',
        level: h.maxAge < HALF_YEAR ? 'warn' : 'good',
        message: `HTTPS enforced for ${days} day${days === 1 ? '' : 's'}${h.includeSubDomains ? ', including subdomains' : ''}${h.preload ? ', preload requested' : ''}.${h.maxAge < HALF_YEAR ? ' Use at least 6 months (1 year is common).' : ''}`,
      });
  }

  checks.push(reviewCsp(get('content-security-policy'), get('content-security-policy-report-only')));

  // nosniff
  const xcto = get('x-content-type-options');
  checks.push(
    !xcto
      ? { id: 'xcto', title: 'X-Content-Type-Options', level: 'warn', message: 'Missing. Set "nosniff" so browsers never guess a different content type.' }
      : xcto.trim().toLowerCase() === 'nosniff'
        ? { id: 'xcto', title: 'X-Content-Type-Options', level: 'good', message: 'nosniff is set.' }
        : { id: 'xcto', title: 'X-Content-Type-Options', level: 'warn', message: `Unexpected value "${xcto}". The only valid value is "nosniff".` },
  );

  // Framing
  const fa = parseCsp(get('content-security-policy') ?? '').find((d) => d.name === 'frame-ancestors');
  const xfo = get('x-frame-options')?.trim().toUpperCase();
  if (fa) {
    const wide = fa.sources.some((s) => s === '*' || s === 'https:');
    checks.push({ id: 'frame', title: 'Clickjacking protection', level: wide ? 'warn' : 'good', message: `CSP frame-ancestors ${fa.sources.join(' ') || "'none'"}${wide ? ' allows framing by any site.' : '.'}` });
  } else if (xfo === 'DENY' || xfo === 'SAMEORIGIN') checks.push({ id: 'frame', title: 'Clickjacking protection', level: 'good', message: `X-Frame-Options ${xfo}.` });
  else if (xfo) checks.push({ id: 'frame', title: 'Clickjacking protection', level: 'warn', message: `X-Frame-Options "${xfo}" isn't supported by modern browsers. Use DENY, SAMEORIGIN or CSP frame-ancestors.` });
  else checks.push({ id: 'frame', title: 'Clickjacking protection', level: 'warn', message: "Neither CSP frame-ancestors nor X-Frame-Options is set: other sites can frame this page." });

  // Referrer-Policy
  const rp = get('referrer-policy')?.split(',').pop()?.trim().toLowerCase();
  if (!rp) checks.push({ id: 'referrer', title: 'Referrer-Policy', level: 'info', message: 'Not set. Browsers default to strict-origin-when-cross-origin, which is reasonable.' });
  else if (rp === 'unsafe-url' || rp === 'no-referrer-when-downgrade')
    checks.push({ id: 'referrer', title: 'Referrer-Policy', level: 'warn', message: `"${rp}" sends full URLs (with paths and query strings) to other sites.` });
  else checks.push({ id: 'referrer', title: 'Referrer-Policy', level: 'good', message: `"${rp}".` });

  // Permissions-Policy
  checks.push(
    get('permissions-policy')
      ? { id: 'permissions', title: 'Permissions-Policy', level: 'good', message: 'Set: browser features are restricted.' }
      : { id: 'permissions', title: 'Permissions-Policy', level: 'info', message: 'Not set. Consider disabling features you don\'t use, e.g. camera=(), microphone=(), geolocation=().' },
  );

  // Cross-origin isolation
  const coop = get('cross-origin-opener-policy');
  const coep = get('cross-origin-embedder-policy');
  const corp = get('cross-origin-resource-policy');
  const iso = [coop && `COOP ${coop}`, coep && `COEP ${coep}`, corp && `CORP ${corp}`].filter(Boolean) as string[];
  checks.push({
    id: 'isolation',
    title: 'COOP / COEP / CORP',
    level: coop ? 'good' : 'info',
    message: iso.length
      ? `${iso.join(', ')}.${coop?.includes('same-origin') && coep?.includes('require-corp') ? ' The page is cross-origin isolated.' : ''}`
      : 'None set. COOP "same-origin" protects against cross-window attacks; COEP + COOP enable cross-origin isolation.',
  });

  // Cookies
  const cookies = g.get('set-cookie') ?? [];
  if (cookies.length) {
    const details: string[] = [];
    let level: Level = 'good';
    for (const h of cookies) {
      const c = parseSetCookie(h.value);
      const label = c.name || '(unnamed)';
      const miss: string[] = [];
      if (!c.secure) miss.push('Secure');
      if (!c.httpOnly) miss.push('HttpOnly');
      if (!c.sameSite) miss.push('SameSite');
      if (c.sameSite?.toLowerCase() === 'none' && !c.secure) {
        details.push(`${label}: SameSite=None without Secure is rejected by browsers.`);
        level = 'bad';
      }
      if (c.name.startsWith('__Host-') && (!c.secure || c.domain || c.path !== '/')) details.push(`${label}: __Host- cookies need Secure, Path=/ and no Domain.`);
      if (miss.length) {
        details.push(`${label}: missing ${miss.join(', ')}.`);
        if (!c.secure || (!c.httpOnly && /sess|auth|token|sid|jwt|login/i.test(c.name))) level = 'bad';
        else if (level === 'good') level = 'warn';
      }
    }
    checks.push({
      id: 'cookies',
      title: 'Cookies',
      level,
      message: level === 'good' ? `${cookies.length} cookie${cookies.length === 1 ? '' : 's'}, all Secure, HttpOnly and SameSite.` : `${cookies.length} cookie${cookies.length === 1 ? '' : 's'}; some attributes are missing.`,
      details: details.length ? details : undefined,
    });
  }

  // CORS
  const acao = get('access-control-allow-origin')?.trim();
  const acac = get('access-control-allow-credentials')?.trim().toLowerCase() === 'true';
  if (acao) {
    if (acao === '*' && acac) checks.push({ id: 'cors', title: 'CORS', level: 'bad', message: 'Access-Control-Allow-Origin "*" with credentials is invalid: browsers reject it. If you "fixed" it by echoing the Origin, any site can read authenticated responses.' });
    else if (acao === 'null') checks.push({ id: 'cors', title: 'CORS', level: 'bad', message: 'Allowing the "null" origin lets sandboxed iframes and local files read responses.' });
    else if (acao === '*') checks.push({ id: 'cors', title: 'CORS', level: 'info', message: 'Any website can read this response from JavaScript (without cookies). Fine for public data, not for anything user-specific.' });
    else checks.push({ id: 'cors', title: 'CORS', level: acac ? 'info' : 'good', message: `Only ${acao} may read this response${acac ? ', including with cookies. Make sure that origin is trusted and Vary: Origin is set if it changes.' : '.'}` });
  }

  // Information leaks
  const leaks: string[] = [];
  const server = get('server');
  if (server && /\d/.test(server)) leaks.push(`Server: ${server} (reveals a version)`);
  for (const n of ['x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator']) {
    const v = get(n);
    if (v) leaks.push(`${g.get(n)![0].name}: ${v}`);
  }
  checks.push(
    leaks.length
      ? { id: 'leaks', title: 'Information disclosure', level: 'warn', message: 'These headers reveal software (and versions) that help attackers pick exploits.', details: leaks }
      : { id: 'leaks', title: 'Information disclosure', level: 'good', message: 'No version numbers or framework names found.' },
  );

  // Legacy headers
  const legacy: string[] = [];
  const xxss = get('x-xss-protection');
  if (xxss && xxss.trim() !== '0') legacy.push(`X-XSS-Protection "${xxss}": the filter is gone from browsers and could introduce issues in old ones; set 0 or remove it.`);
  if (get('expect-ct')) legacy.push('Expect-CT is obsolete and can be removed.');
  if (get('public-key-pins')) legacy.push('Public-Key-Pins is removed from browsers and risky: remove it.');
  if (get('feature-policy')) legacy.push('Feature-Policy was renamed Permissions-Policy.');
  if (legacy.length) checks.push({ id: 'legacy', title: 'Deprecated headers', level: 'info', message: 'Some headers are obsolete.', details: legacy });

  let score = 100;
  for (const c of checks) score -= c.level === 'bad' ? 20 : c.level === 'warn' ? 7 : 0;
  score = Math.max(0, score);
  const grade = score === 100 ? 'A+' : score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';
  return { grade, score, checks };
}

// ---------- caching ----------

export interface CacheSummary {
  verdict: string;
  cacheable: boolean;
  rows: Row[];
  notes: string[];
}

export function summariseCaching(headers: Header[], status?: number): CacheSummary {
  const g = groupHeaders(headers);
  const get = (n: string) => headerValue(g, n);
  const cc = parseDirectives(get('cache-control') ?? '');
  const has = (n: string) => !!directive(cc, n);
  const num = (n: string) => {
    const v = directive(cc, n)?.value;
    return v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined;
  };
  const notes: string[] = [];
  const rows: Row[] = [];
  const validators = [get('etag') && 'ETag', get('last-modified') && 'Last-Modified'].filter(Boolean) as string[];
  const vary = get('vary');

  if (has('no-store')) {
    return {
      verdict: 'Not cacheable: no-store tells every cache not to keep a copy.',
      cacheable: false,
      rows: [['Stored by', 'Nobody']],
      notes: [],
    };
  }
  if (vary?.trim() === '*') notes.push('Vary: * makes the response effectively uncacheable.');

  const who = has('private') ? 'Browser only (private)' : 'Browser and shared caches (CDNs, proxies)';
  rows.push(['Stored by', who]);

  let browser: number | undefined = num('max-age');
  let source = 'max-age';
  if (browser === undefined) {
    const exp = get('expires');
    const date = get('date');
    if (exp) {
      const e = Date.parse(exp);
      const d = date ? Date.parse(date) : NaN;
      if (Number.isNaN(e)) {
        browser = 0;
        source = 'invalid Expires (treated as already stale)';
      } else if (!Number.isNaN(d)) {
        browser = Math.max(0, Math.round((e - d) / 1000));
        source = 'Expires − Date';
      } else source = 'Expires (no Date to compare)';
    }
  }
  const shared = has('private') ? undefined : (num('s-maxage') ?? browser);
  const noCache = has('no-cache');

  if (noCache) rows.push(['Freshness', 'Always revalidated before use (no-cache)']);
  else if (browser !== undefined) {
    rows.push(['Browser freshness', `${humanDuration(browser)} (${source})`]);
    if (shared !== undefined && shared !== browser) rows.push(['Shared cache freshness', `${humanDuration(shared)} (s-maxage)`]);
  } else if (get('last-modified')) rows.push(['Freshness', 'Not specified: caches may guess (typically 10% of the time since Last-Modified)']);
  else rows.push(['Freshness', 'Not specified']);

  const age = get('age');
  if (age && /^\d+$/.test(age.trim()) && browser !== undefined) {
    const left = (shared ?? browser) - Number(age);
    rows.push(['Age', `${humanDuration(Number(age))} in cache, ${left > 0 ? `${humanDuration(left)} left` : 'already stale'}`]);
  }
  rows.push(['Revalidation', validators.length ? `Supported via ${validators.join(' and ')}` : 'No ETag or Last-Modified: stale copies must be downloaded again']);
  if (vary) rows.push(['Varies by', vary]);
  const swr = num('stale-while-revalidate');
  if (swr) rows.push(['Stale while revalidate', humanDuration(swr)]);
  if (has('immutable')) rows.push(['Immutable', "Browsers won't revalidate on reload while fresh"]);

  if (get('set-cookie') && !has('private') && (has('public') || (shared ?? 0) > 0)) notes.push('The response sets a cookie but can be stored by shared caches: another user could receive it. Add "private" or strip the cookie.');
  if (get('pragma') && !get('cache-control')) notes.push('Only Pragma is set; use Cache-Control instead.');
  if (!get('cache-control') && !get('expires')) notes.push('No Cache-Control or Expires: caching is left to browser heuristics.');
  if (status && status >= 400 && (browser ?? 0) > 0) notes.push(`This ${status} error response can be cached.`);

  const cacheable = !(vary?.trim() === '*');
  const life = noCache ? 0 : (shared ?? browser);
  const verdict = !cacheable
    ? 'Effectively not cacheable (Vary: *).'
    : noCache
      ? `Cacheable, but revalidated on every use${validators.length ? '' : ' (and with no validators, re-downloaded)'}.`
      : life !== undefined
        ? life > 0
          ? `Cacheable by ${has('private') ? 'the browser only' : 'browsers and CDNs'} for ${humanDuration(life)}.`
          : 'Stored but immediately stale: revalidated every time.'
        : 'Cacheable by heuristics only: no explicit lifetime.';
  return { verdict, cacheable, rows, notes };
}
