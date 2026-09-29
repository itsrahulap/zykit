// Removes tracking parameters from URLs and unwraps known redirect links. Pure, no DOM.

export interface ParamRule {
  /** Exact name, or a prefix when it ends with `*`. Matched case-insensitively. */
  name: string;
  /** Only strip on these hosts (and their subdomains). */
  hosts?: string[];
}

export interface ParamGroup {
  id: string;
  label: string;
  description: string;
  rules: ParamRule[];
}

export const GROUPS: ParamGroup[] = [
  {
    id: 'utm',
    label: 'UTM campaign tags',
    description: 'utm_source, utm_medium, utm_campaign and friends: tell analytics which campaign sent the click.',
    rules: [{ name: 'utm_*' }],
  },
  {
    id: 'ads',
    label: 'Ad click IDs',
    description: 'Unique IDs that ad networks add to link a visit back to an ad click: Google (gclid, gbraid, wbraid, dclid), Meta (fbclid), Microsoft (msclkid), Yandex (yclid), X (twclid), TikTok (ttclid), LinkedIn (li_fat_id) and others.',
    rules: ['gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid', 'gad_source', 'gad_campaignid', 'fbclid', 'msclkid', 'yclid', 'twclid', 'ttclid', 'li_fat_id', 'epik', 'ScCid', 'rdt_cid', 'irclickid', 'ef_id', 's_kwcid', 'wickedid', 'obclid'].map((name) => ({ name })),
  },
  {
    id: 'analytics',
    label: 'Analytics & cross-domain',
    description: 'Google Analytics cross-domain linker (_ga, _gl), Adobe (s_cid), Openstat, Alibaba spm/scm and generic tracking codes like trk.',
    rules: ['_ga', '_gl', '_gac', 's_cid', '_openstat', 'trk', 'trkCampaign', 'sc_campaign', 'spm', 'scm', 'cmpid', 'ncid'].map((name) => ({ name })),
  },
  {
    id: 'email',
    label: 'Email marketing',
    description: 'Mailchimp (mc_eid, mc_cid), HubSpot (_hsenc, _hsmi, __hs*), Marketo (mkt_tok), Omeda (oly_*), Vero (vero_*), Klaviyo (_kx) and MailerLite: identify the subscriber who clicked.',
    rules: ['mc_eid', 'mc_cid', '_hsenc', '_hsmi', '__hstc', '__hssc', '__hsfp', 'hsCtaTracking', 'mkt_tok', 'oly_*', 'vero_*', '_kx', 'ml_subscriber', 'ml_subscriber_hash'].map((name) => ({ name })),
  },
  {
    id: 'social',
    label: 'Social share IDs',
    description: 'Added when you tap "Share": Instagram (igshid, igsh), YouTube and Spotify (si), X/Twitter (ref_src, ref_url, s, t). They can tie the link back to your account.',
    rules: [
      { name: 'igshid' },
      { name: 'igsh' },
      { name: 'si', hosts: ['youtube.com', 'youtu.be', 'spotify.com', 'music.youtube.com'] },
      { name: 'feature', hosts: ['youtube.com', 'youtu.be'] },
      { name: 'pp', hosts: ['youtube.com'] },
      { name: 'ref_src', hosts: ['twitter.com', 'x.com'] },
      { name: 'ref_url', hosts: ['twitter.com', 'x.com'] },
      { name: 's', hosts: ['twitter.com', 'x.com'] },
      { name: 't', hosts: ['twitter.com', 'x.com'] },
      { name: 'share_id', hosts: ['reddit.com'] },
      { name: 'rdt', hosts: ['reddit.com'] },
      { name: 'mibextid', hosts: ['facebook.com', 'fb.com'] },
      { name: '_t', hosts: ['tiktok.com'] },
      { name: '_r', hosts: ['tiktok.com'] },
    ],
  },
  {
    id: 'amazon',
    label: 'Shop referral junk',
    description: 'Amazon ref/pd_rd_* and similar parameters that record which widget or page you clicked from.',
    rules: ['ref', 'ref_', 'pd_rd_*', 'pf_rd_*', 'psc', 'content-id', 'crid', 'sprefix', 'qid', 'sr', 'dib', 'dib_tag'].map((name) => ({
      name,
      hosts: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.in', 'amazon.ca', 'amazon.es', 'amazon.it', 'amazon.co.jp', 'amazon.com.au'],
    })),
  },
];

export const DEFAULT_GROUPS = GROUPS.map((g) => g.id);

export interface CleanOptions {
  groups: string[];
  /** Extra names to strip; `name*` means prefix. */
  extraStrip: string[];
  /** Names that must never be stripped (wins over everything). */
  keep: string[];
  unwrap: boolean;
}

export interface RemovedParam {
  key: string;
  value: string;
  group: string;
}

export interface CleanResult {
  input: string;
  output: string;
  ok: boolean;
  error?: string;
  removed: RemovedParam[];
  unwrapped: string[];
  notes: string[];
}

function hostMatches(host: string, hosts: string[]): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  return hosts.some((x) => h === x || h.endsWith(`.${x}`));
}

function nameMatches(pattern: string, key: string): boolean {
  const p = pattern.toLowerCase();
  const k = key.toLowerCase();
  return p.endsWith('*') ? k.startsWith(p.slice(0, -1)) : k === p;
}

function decode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

export function parseNameList(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Which group (label) strips this key on this host, or null to keep it. */
export function classify(key: string, host: string, opts: CleanOptions): string | null {
  if (opts.keep.some((k) => nameMatches(k, key))) return null;
  if (opts.extraStrip.some((k) => nameMatches(k, key))) return 'Custom';
  for (const g of GROUPS) {
    if (!opts.groups.includes(g.id)) continue;
    for (const r of g.rules) if (nameMatches(r.name, key) && (!r.hosts || hostMatches(host, r.hosts))) return g.label;
  }
  return null;
}

interface Redirector {
  test: (u: URL) => boolean;
  params: string[];
}

const REDIRECTORS: Redirector[] = [
  { test: (u) => /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === '/url', params: ['q', 'url'] },
  { test: (u) => /^(l|lm)\.facebook\.com$/.test(u.hostname) && u.pathname === '/l.php', params: ['u'] },
  { test: (u) => u.hostname === 'l.instagram.com', params: ['u'] },
  { test: (u) => u.hostname === 'l.messenger.com' && u.pathname === '/l.php', params: ['u'] },
  { test: (u) => u.hostname === 'out.reddit.com', params: ['url'] },
  { test: (u) => /(^|\.)youtube\.com$/.test(u.hostname) && u.pathname === '/redirect', params: ['q'] },
  { test: (u) => /(^|\.)linkedin\.com$/.test(u.hostname) && u.pathname.startsWith('/redir/'), params: ['url'] },
  { test: (u) => u.hostname === 'slack-redir.net', params: ['url'] },
  { test: (u) => u.hostname === 'steamcommunity.com' && u.pathname.startsWith('/linkfilter'), params: ['url', 'u'] },
  { test: (u) => /(^|\.)vk\.com$/.test(u.hostname) && u.pathname === '/away.php', params: ['to'] },
];

const SHORTENERS = ['t.co', 'bit.ly', 'lnkd.in', 'goo.gl', 'ow.ly', 'tinyurl.com', 'buff.ly', 'fb.me', 'amzn.to'];

function tryUrl(s: string): URL | null {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}

function unwrapOnce(u: URL): URL | null {
  if (u.hostname === 'href.li') {
    const target = tryUrl(u.search.slice(1));
    if (target) return target;
  }
  for (const r of REDIRECTORS) {
    if (!r.test(u)) continue;
    for (const p of r.params) {
      const v = u.searchParams.get(p);
      const target = v ? tryUrl(v) : null;
      if (target) return target;
    }
  }
  return null;
}

export function cleanUrl(input: string, opts: CleanOptions): CleanResult {
  const raw = input.trim();
  const result: CleanResult = { input: raw, output: raw, ok: false, removed: [], unwrapped: [], notes: [] };
  let u = tryUrl(raw);
  if (!u) {
    result.error = 'Not a valid http(s) URL.';
    return result;
  }
  if (opts.unwrap) {
    for (let i = 0; i < 5; i++) {
      const next = unwrapOnce(u);
      if (!next) break;
      result.unwrapped.push(u.hostname);
      u = next;
    }
  }
  const host = u.hostname.toLowerCase();
  if (SHORTENERS.includes(host)) result.notes.push(`${host} is a link shortener: the real destination is only known to its server, so it can't be unwrapped offline.`);

  // Work on the raw query so kept parameters stay exactly as written.
  const pairs = u.search.replace(/^\?/, '').split('&').filter(Boolean);
  const kept: string[] = [];
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    const key = decode(eq < 0 ? pair : pair.slice(0, eq));
    const group = classify(key, host, opts);
    if (group) result.removed.push({ key, value: eq < 0 ? '' : decode(pair.slice(eq + 1)), group });
    else kept.push(pair);
  }
  const query = kept.join('&');
  // Build the string ourselves: assigning url.search = '' can leave a bare "?" in some cases.
  const beforeQuery = u.href.slice(0, u.href.length - u.search.length - u.hash.length);
  result.output = beforeQuery + (query ? `?${query}` : '') + u.hash;
  result.ok = true;
  return result;
}

/** Find http(s) URLs in free text, trimming trailing punctuation. Returns [start, end, url] spans. */
export function findUrls(text: string): { start: number; end: number; url: string }[] {
  const out: { start: number; end: number; url: string }[] = [];
  const re = /https?:\/\/[^\s<>"'`]+/gi;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    let url = m[0];
    // Drop trailing punctuation, and a closing bracket that has no opening partner.
    for (;;) {
      const last = url[url.length - 1];
      if (/[.,;:!?'"]/.test(last)) url = url.slice(0, -1);
      else if (last === ')' && (url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)) url = url.slice(0, -1);
      else if (last === ']' && !url.includes('[')) url = url.slice(0, -1);
      else break;
    }
    out.push({ start: m.index, end: m.index + url.length, url });
  }
  return out;
}

export function cleanLines(text: string, opts: CleanOptions): CleanResult[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => cleanUrl(l, opts));
}

/** Clean every URL found in text, in place. */
export function cleanText(text: string, opts: CleanOptions): { text: string; results: CleanResult[] } {
  const spans = findUrls(text);
  const results: CleanResult[] = [];
  let out = '';
  let pos = 0;
  for (const s of spans) {
    const r = cleanUrl(s.url, opts);
    results.push(r);
    out += text.slice(pos, s.start) + (r.ok ? r.output : s.url);
    pos = s.end;
  }
  return { text: out + text.slice(pos), results };
}
