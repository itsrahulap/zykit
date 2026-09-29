// Builds campaign URLs with UTM parameters. Pure functions, no DOM.

export type UtmKey =
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'utm_term'
  | 'utm_content'
  | 'utm_id'
  | 'utm_source_platform'
  | 'utm_creative_format'
  | 'utm_marketing_tactic';

export interface UtmField {
  key: UtmKey;
  label: string;
  required: boolean;
  placeholder: string;
  help: string;
}

export const UTM_FIELDS: UtmField[] = [
  { key: 'utm_source', label: 'Source', required: true, placeholder: 'google, newsletter', help: 'Where the traffic comes from.' },
  { key: 'utm_medium', label: 'Medium', required: true, placeholder: 'cpc, email, social', help: 'The marketing channel.' },
  { key: 'utm_campaign', label: 'Campaign', required: true, placeholder: 'spring_sale', help: 'The campaign or promotion name.' },
  { key: 'utm_term', label: 'Term', required: false, placeholder: 'running shoes', help: 'Paid search keyword.' },
  { key: 'utm_content', label: 'Content', required: false, placeholder: 'header_link, banner_a', help: 'Tells apart links or ads with the same destination.' },
  { key: 'utm_id', label: 'Campaign ID', required: false, placeholder: 'abc.123', help: 'Campaign ID, used for GA4 data import.' },
  { key: 'utm_source_platform', label: 'Source platform', required: false, placeholder: 'Search Ads 360', help: 'The platform that directs traffic (GA4).' },
  { key: 'utm_creative_format', label: 'Creative format', required: false, placeholder: 'display, video', help: 'The creative type (GA4).' },
  { key: 'utm_marketing_tactic', label: 'Marketing tactic', required: false, placeholder: 'remarketing, prospecting', help: 'Targeting criteria (GA4).' },
];

export type UtmValues = Partial<Record<UtmKey, string>>;

export interface UtmPreset {
  id: string;
  label: string;
  values: UtmValues;
  note?: string;
}

export const PRESETS: UtmPreset[] = [
  { id: 'google-ads', label: 'Google Ads', values: { utm_source: 'google', utm_medium: 'cpc' }, note: 'Google Ads auto-tagging (gclid) usually makes manual UTM tags unnecessary for Google Analytics.' },
  { id: 'microsoft-ads', label: 'Microsoft Ads', values: { utm_source: 'bing', utm_medium: 'cpc' } },
  { id: 'facebook', label: 'Facebook', values: { utm_source: 'facebook', utm_medium: 'paid_social' } },
  { id: 'instagram', label: 'Instagram', values: { utm_source: 'instagram', utm_medium: 'social' } },
  { id: 'linkedin', label: 'LinkedIn', values: { utm_source: 'linkedin', utm_medium: 'social' } },
  { id: 'x', label: 'X (Twitter)', values: { utm_source: 'x', utm_medium: 'social' } },
  { id: 'tiktok', label: 'TikTok', values: { utm_source: 'tiktok', utm_medium: 'paid_social' } },
  { id: 'youtube', label: 'YouTube', values: { utm_source: 'youtube', utm_medium: 'video' } },
  { id: 'reddit', label: 'Reddit', values: { utm_source: 'reddit', utm_medium: 'social' } },
  { id: 'newsletter', label: 'Newsletter', values: { utm_source: 'newsletter', utm_medium: 'email' } },
  { id: 'qr', label: 'QR code / print', values: { utm_source: 'qr', utm_medium: 'offline' } },
];

export type SpaceMode = 'dash' | 'underscore' | 'encode';

export interface FormatOptions {
  lowercase: boolean;
  spaces: SpaceMode;
}

export function formatValue(value: string, opts: FormatOptions): string {
  let v = value.trim();
  if (opts.lowercase) v = v.toLowerCase();
  if (opts.spaces === 'dash') v = v.replace(/\s+/g, '-');
  else if (opts.spaces === 'underscore') v = v.replace(/\s+/g, '_');
  else v = v.replace(/\s+/g, ' ');
  return v;
}

export interface BuildResult {
  ok: boolean;
  url: string;
  error?: string;
  warnings: string[];
}

export interface BuildOptions extends FormatOptions {
  /** Your own site's host name: UTM tags on links to it are flagged. */
  siteHost?: string;
}

function decodeKey(k: string): string {
  try {
    return decodeURIComponent(k.replace(/\+/g, ' '));
  } catch {
    return k;
  }
}

/** Parse a base URL. Adds https:// when the scheme is missing. */
export function parseBase(input: string): { url: URL; addedScheme: boolean } | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/:]+:\d/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw.replace(/^\/\//, '')}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname || (!url.hostname.includes('.') && url.hostname !== 'localhost' && !url.hostname.startsWith('['))) return null;
    return { url, addedScheme: !hasScheme };
  } catch {
    return null;
  }
}

export function buildUtmUrl(base: string, values: UtmValues, opts: BuildOptions): BuildResult {
  const warnings: string[] = [];
  const parsed = parseBase(base);
  if (!parsed) return { ok: false, url: '', error: base.trim() ? 'Not a valid http(s) URL.' : 'Enter a website URL.', warnings };
  const { url, addedScheme } = parsed;
  if (addedScheme) warnings.push('No scheme given, so https:// was added.');

  const formatted: [UtmKey, string][] = [];
  for (const f of UTM_FIELDS) {
    const v = formatValue(values[f.key] ?? '', opts);
    if (v) formatted.push([f.key, v]);
  }

  const missing = UTM_FIELDS.filter((f) => f.required && !formatted.some(([k]) => k === f.key)).map((f) => f.key);
  if (missing.length) warnings.push(`Missing required ${missing.join(', ')}.`);

  const mixed = formatted.filter(([, v]) => /[a-z]/.test(v) && /[A-Z]/.test(v)).map(([k]) => k);
  if (mixed.length) warnings.push(`Mixed case in ${mixed.join(', ')}: analytics tools treat "Email" and "email" as different values.`);

  const site = (opts.siteHost ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (site && (host === site || host.endsWith(`.${site}`)))
    warnings.push('This links to your own site. UTM tags on internal links start a new session and overwrite the original traffic source.');

  // Keep existing parameters as written, minus the UTM keys we are about to set.
  const setKeys = new Set(formatted.map(([k]) => k as string));
  const existing = url.search.replace(/^\?/, '').split('&').filter(Boolean);
  const replaced: string[] = [];
  const kept = existing.filter((pair) => {
    const key = decodeKey(pair.split('=')[0]);
    if (setKeys.has(key)) {
      replaced.push(key);
      return false;
    }
    return true;
  });
  if (replaced.length) warnings.push(`Replaced existing ${[...new Set(replaced)].join(', ')} from the base URL.`);
  const added = formatted.map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  const query = [...kept, ...added].join('&');
  url.search = query ? `?${query}` : '';
  return { ok: true, url: url.href, warnings };
}

/** Bulk mode: one base URL per line, blank lines skipped. */
export function buildBulk(lines: string, values: UtmValues, opts: BuildOptions): { line: number; base: string; result: BuildResult }[] {
  return lines
    .split(/\r?\n/)
    .map((base, i) => ({ line: i + 1, base: base.trim() }))
    .filter((l) => l.base)
    .map((l) => ({ ...l, result: buildUtmUrl(l.base, values, opts) }));
}

export interface HistoryItem {
  url: string;
  at: number;
}

export const HISTORY_KEY = 'zykit-utm-history';
export const HISTORY_LIMIT = 50;

export function addToHistory(list: HistoryItem[], url: string, at = Date.now()): HistoryItem[] {
  return [{ url, at }, ...list.filter((h) => h.url !== url)].slice(0, HISTORY_LIMIT);
}

export function parseHistory(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((h): h is HistoryItem => !!h && typeof (h as HistoryItem).url === 'string' && typeof (h as HistoryItem).at === 'number')
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}
