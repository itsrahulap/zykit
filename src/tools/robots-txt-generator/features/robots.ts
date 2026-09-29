// robots.txt generation, parsing, linting and RFC 9309 matching. Pure, no DOM.

export type RuleType = 'allow' | 'disallow';

export interface Rule {
  type: RuleType;
  path: string;
  line?: number;
}

export interface Group {
  userAgents: string[];
  rules: Rule[];
  crawlDelay?: string;
  line?: number;
}

export interface RobotsDoc {
  groups: Group[];
  sitemaps: string[];
}

export const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'Claude-Web',
  'Google-Extended',
  'Applebot-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'meta-externalfetcher',
  'FacebookBot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Timpibot',
  'YouBot',
  'AI2Bot',
  'DuckAssistBot',
  'MistralAI-User',
];

export interface Preset {
  id: string;
  label: string;
  doc: () => RobotsDoc;
}

export const PRESETS: Preset[] = [
  { id: 'allow-all', label: 'Allow all', doc: () => ({ groups: [{ userAgents: ['*'], rules: [{ type: 'allow', path: '/' }] }], sitemaps: [] }) },
  { id: 'disallow-all', label: 'Disallow all', doc: () => ({ groups: [{ userAgents: ['*'], rules: [{ type: 'disallow', path: '/' }] }], sitemaps: [] }) },
  {
    id: 'block-ai',
    label: 'Block AI crawlers',
    doc: () => ({
      groups: [
        { userAgents: [...AI_CRAWLERS], rules: [{ type: 'disallow', path: '/' }] },
        { userAgents: ['*'], rules: [{ type: 'allow', path: '/' }] },
      ],
      sitemaps: [],
    }),
  },
  {
    id: 'wordpress',
    label: 'WordPress',
    doc: () => ({
      groups: [
        {
          userAgents: ['*'],
          rules: [
            { type: 'disallow', path: '/wp-admin/' },
            { type: 'allow', path: '/wp-admin/admin-ajax.php' },
            { type: 'disallow', path: '/?s=' },
            { type: 'disallow', path: '/search/' },
          ],
        },
      ],
      sitemaps: ['https://example.com/wp-sitemap.xml'],
    }),
  },
];

export function generate(doc: RobotsDoc): string {
  const blocks: string[] = [];
  for (const g of doc.groups) {
    const agents = g.userAgents.map((a) => a.trim()).filter(Boolean);
    if (!agents.length) continue;
    const lines = agents.map((a) => `User-agent: ${a}`);
    const rules = g.rules.filter((r) => r.path.trim() || r.type === 'disallow');
    for (const r of rules) lines.push(`${r.type === 'allow' ? 'Allow' : 'Disallow'}: ${r.path.trim()}`);
    if (!rules.length) lines.push('Disallow:');
    if (g.crawlDelay?.trim()) lines.push(`Crawl-delay: ${g.crawlDelay.trim()}`);
    blocks.push(lines.join('\n'));
  }
  const sitemaps = doc.sitemaps.map((s) => s.trim()).filter(Boolean);
  if (sitemaps.length) blocks.push(sitemaps.map((s) => `Sitemap: ${s}`).join('\n'));
  return blocks.length ? `${blocks.join('\n\n')}\n` : '';
}

export interface Issue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

const KNOWN_OTHER = new Set(['host', 'clean-param', 'request-rate', 'visit-time', 'noindex', 'nofollow']);
/** Google's limit; content after it is ignored. */
export const MAX_ROBOTS_BYTES = 500 * 1024;

export function parse(text: string): { doc: RobotsDoc; issues: Issue[] } {
  const doc: RobotsDoc = { groups: [], sitemaps: [] };
  const issues: Issue[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  if (new TextEncoder().encode(text).length > MAX_ROBOTS_BYTES)
    issues.push({ line: 1, severity: 'warning', message: 'File is larger than 500 KiB; Google ignores everything after that.' });

  lines.forEach((rawLine, i) => {
    const line = i + 1;
    const content = rawLine.replace(/#.*$/, '').trim();
    if (!content) return;
    const colon = content.indexOf(':');
    if (colon < 0) {
      issues.push({ line, severity: 'error', message: `Missing ":" in "${content}".` });
      return;
    }
    const key = content.slice(0, colon).trim().toLowerCase();
    const value = content.slice(colon + 1).trim();
    if (key === 'user-agent' || key === 'useragent' || key === 'user agent') {
      if (key !== 'user-agent') issues.push({ line, severity: 'warning', message: `"${content.slice(0, colon)}" should be spelled "User-agent".` });
      if (!value) issues.push({ line, severity: 'error', message: 'User-agent has no value.' });
      if (!lastWasAgent || !current) {
        current = { userAgents: [], rules: [], line };
        doc.groups.push(current);
      }
      if (value) current.userAgents.push(value);
      if (value && value !== '*' && !/^[A-Za-z_-]+$/.test(value))
        issues.push({ line, severity: 'info', message: `"${value}" isn't a plain product token; RFC 9309 crawlers match only letters, "_" and "-".` });
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (key === 'allow' || key === 'disallow') {
      if (!current) {
        issues.push({ line, severity: 'error', message: `${key === 'allow' ? 'Allow' : 'Disallow'} appears before any User-agent line and is ignored.` });
        return;
      }
      if (value && !value.startsWith('/') && !value.startsWith('*'))
        issues.push({ line, severity: 'warning', message: `Path "${value}" should start with "/" or "*".` });
      if (key === 'allow' && !value) issues.push({ line, severity: 'info', message: 'Empty Allow has no effect.' });
      current.rules.push({ type: key, path: value, line });
      return;
    }
    if (key === 'sitemap') {
      if (!/^https?:\/\/\S+$/i.test(value)) issues.push({ line, severity: 'error', message: 'Sitemap must be an absolute http(s) URL.' });
      doc.sitemaps.push(value);
      return;
    }
    if (key === 'crawl-delay') {
      if (!current) issues.push({ line, severity: 'error', message: 'Crawl-delay appears before any User-agent line.' });
      else current.crawlDelay = value;
      if (!/^\d+(\.\d+)?$/.test(value)) issues.push({ line, severity: 'error', message: 'Crawl-delay must be a number of seconds.' });
      else issues.push({ line, severity: 'info', message: 'Crawl-delay is ignored by Google; Bing and Yandex honour it.' });
      return;
    }
    if (KNOWN_OTHER.has(key)) {
      issues.push({
        line,
        severity: 'info',
        message: key === 'noindex' ? 'Noindex in robots.txt is not supported by Google (since 2019). Use a meta robots tag instead.' : `"${content.slice(0, colon)}" is non-standard and ignored by most crawlers.`,
      });
      return;
    }
    issues.push({ line, severity: 'warning', message: `Unknown directive "${content.slice(0, colon)}".` });
  });
  for (const g of doc.groups) if (!g.rules.length && !g.crawlDelay) issues.push({ line: g.line ?? 1, severity: 'info', message: `Group for ${g.userAgents.join(', ')} has no rules, so everything is allowed.` });
  return { doc, issues };
}

/** Normalise percent-escapes and encode non-ASCII so paths and patterns compare octet-wise. */
export function normalizePath(s: string): string {
  let out = '';
  for (const ch of s) {
    if (ch.charCodeAt(0) > 0x7e || ch === ' ') out += encodeURIComponent(ch);
    else out += ch;
  }
  // Decode escapes of unreserved characters, uppercase the rest.
  return out.replace(/%([0-9a-fA-F]{2})/g, (_, h: string) => {
    const c = String.fromCharCode(parseInt(h, 16));
    return /[A-Za-z0-9\-._~]/.test(c) ? c : `%${h.toUpperCase()}`;
  });
}

/** Does `pattern` (with * and trailing $) match the start of `path`? Linear-time wildcard matching. */
export function matches(pattern: string, path: string): boolean {
  let p = pattern;
  let anchored = false;
  if (p.endsWith('$')) {
    anchored = true;
    p = p.slice(0, -1);
  }
  if (!anchored) p += '*';
  let i = 0;
  let j = 0;
  let star = -1;
  let mark = 0;
  while (j < path.length) {
    if (i < p.length && p[i] !== '*' && p[i] === path[j]) {
      i++;
      j++;
    } else if (i < p.length && p[i] === '*') {
      star = i++;
      mark = j;
    } else if (star >= 0) {
      i = star + 1;
      j = ++mark;
    } else return false;
  }
  while (i < p.length && p[i] === '*') i++;
  return i === p.length;
}

/** The product token of a crawler: "Googlebot/2.1 (+http://…)" → "googlebot". */
function productTokens(ua: string): string[] {
  return ua
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean);
}

/** Pick the groups that apply to a user agent (RFC 9309 §2.2.1). Returns the matched token, or '*'. */
export function selectGroups(doc: RobotsDoc, userAgent: string): { token: string | null; groups: Group[] } {
  const ua = userAgent.trim().toLowerCase();
  const tokens = /[\s/;()]/.test(ua) ? productTokens(ua) : [ua];
  let best: string | null = null;
  for (const g of doc.groups) {
    for (const a of g.userAgents) {
      const v = a.trim().toLowerCase();
      if (!v || v === '*') continue;
      // Exact product-token match; a crawler like "googlebot-news" also falls back to "googlebot".
      const hit = tokens.some((t) => t === v || t.startsWith(`${v}-`));
      if (hit && (!best || v.length > best.length)) best = v;
    }
  }
  if (best) {
    const b = best;
    return { token: best, groups: doc.groups.filter((g) => g.userAgents.some((a) => a.trim().toLowerCase() === b)) };
  }
  const star = doc.groups.filter((g) => g.userAgents.some((a) => a.trim() === '*'));
  return { token: star.length ? '*' : null, groups: star };
}

export interface TestResult {
  allowed: boolean;
  rule: Rule | null;
  group: string | null;
  reason: string;
}

/** Turn "https://x.com/a?b#c" or "a?b" into "/a?b". */
export function toPath(input: string): string {
  const s = input.trim();
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      return u.pathname + u.search;
    } catch {
      return s;
    }
  }
  const noHash = s.replace(/#.*$/, '');
  return noHash.startsWith('/') ? noHash : `/${noHash}`;
}

export function testUrl(doc: RobotsDoc, userAgent: string, url: string): TestResult {
  const path = normalizePath(toPath(url));
  if (path === '/robots.txt') return { allowed: true, rule: null, group: null, reason: '/robots.txt is always allowed.' };
  const { token, groups } = selectGroups(doc, userAgent || '*');
  if (!groups.length) return { allowed: true, rule: null, group: null, reason: 'No group matches this user agent, so everything is allowed.' };
  let best: Rule | null = null;
  let bestLen = -1;
  for (const g of groups)
    for (const r of g.rules) {
      if (!r.path) continue; // Empty Disallow/Allow matches nothing.
      const pat = normalizePath(r.path);
      if (!matches(pat, path)) continue;
      const len = pat.length;
      if (len > bestLen || (len === bestLen && r.type === 'allow' && best?.type === 'disallow')) {
        best = r;
        bestLen = len;
      }
    }
  const group = token === '*' ? 'User-agent: *' : `User-agent: ${groups[0].userAgents.find((a) => a.toLowerCase() === token) ?? token}`;
  if (!best) return { allowed: true, rule: null, group, reason: 'No rule in the group matches this path.' };
  return {
    allowed: best.type === 'allow',
    rule: best,
    group,
    reason: `Longest matching rule is "${best.type === 'allow' ? 'Allow' : 'Disallow'}: ${best.path}".`,
  };
}
