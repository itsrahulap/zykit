// Classifies decoded QR text (URL, Wi-Fi, vCard, email, SMS, phone, geo) into labelled fields and
// safety warnings. Pure functions; nothing here opens, fetches or follows a link.

export type Kind = 'url' | 'wifi' | 'vcard' | 'email' | 'sms' | 'tel' | 'geo' | 'text';

export interface Field {
  label: string;
  value: string;
  /** Shown masked until the user reveals it. */
  secret?: boolean;
}

export interface Analysis {
  kind: Kind;
  title: string;
  fields: Field[];
  warnings: string[];
}

const SAFE_SCHEMES = new Set(['http:', 'https:']);

/** Warnings for a URL: lookalike (punycode / non-ASCII) hosts, and schemes that run code or embed data. */
export function urlWarnings(raw: string): string[] {
  const out: string[] = [];
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return ['This is not a valid URL; treat it as plain text.'];
  }
  if (!SAFE_SCHEMES.has(u.protocol)) out.push(`This link uses the “${u.protocol}” scheme, not http or https. Do not open it unless you trust the source.`);
  const host = u.hostname;
  if (host.split('.').some((l) => l.startsWith('xn--')) || [...(raw.split('/')[2] ?? '')].some((c) => c.charCodeAt(0) > 127)) {
    out.push(`The address contains international characters (shown as “${host}”). Lookalike letters from other alphabets are used to imitate well-known sites; check it carefully.`);
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) out.push('The address is a bare IP address rather than a domain name.');
  if (u.username || u.password) out.push('The link contains a username or password before the host, a common trick to disguise the real destination.');
  if (u.protocol === 'http:') out.push('The link is not encrypted (http).');
  return out;
}

export function parseWifi(text: string): { ssid: string; password: string; security: string; hidden: boolean } | null {
  if (!/^WIFI:/i.test(text)) return null;
  // `KEY:value;` pairs; backslash escapes ; , : " \ inside values.
  const map: Record<string, string> = {};
  let key = '';
  let cur = '';
  let inValue = false;
  for (let i = 5; i < text.length; i++) {
    const c = text[i];
    if (inValue && c === '\\' && i + 1 < text.length) cur += text[++i];
    else if (!inValue && c === ':') {
      inValue = true;
      key = cur.toUpperCase();
      cur = '';
    } else if (c === ';') {
      if (inValue) map[key] = cur;
      inValue = false;
      cur = '';
    } else cur += c;
  }
  if (inValue) map[key] = cur;
  if (map.S === undefined) return null;
  return { ssid: map.S, password: map.P ?? '', security: map.T || 'nopass', hidden: map.H === 'true' };
}

const unVCard = (s: string) => s.replace(/\\([nN])/g, '\n').replace(/\\([,;\\])/g, '$1');

export function parseVCard(text: string): Field[] | null {
  if (!/^BEGIN:VCARD/i.test(text.trim())) return null;
  const fields: Field[] = [];
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const names: Record<string, string> = { FN: 'Name', ORG: 'Organisation', TITLE: 'Job title', TEL: 'Phone', EMAIL: 'Email', URL: 'Website', ADR: 'Address', NOTE: 'Note', BDAY: 'Birthday' };
  let hasFn = false;
  for (const line of unfolded.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).split(';')[0].toUpperCase().replace(/^ITEM\d+\./, '');
    let value = line.slice(i + 1);
    if (key === 'N' && !hasFn) {
      const [last, first] = value.split(';');
      fields.push({ label: 'Name', value: unVCard(`${first ?? ''} ${last ?? ''}`.trim()) });
      continue;
    }
    if (!names[key]) continue;
    if (key === 'FN') {
      hasFn = true;
      const n = fields.findIndex((f) => f.label === 'Name');
      if (n >= 0) fields.splice(n, 1);
    }
    if (key === 'ADR') value = value.split(';').filter(Boolean).join(', ');
    fields.push({ label: names[key], value: unVCard(value) });
  }
  return fields;
}

function decodeParam(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

/** Classifies decoded text. */
export function analyze(text: string): Analysis {
  const t = text.trim();
  const wifi = parseWifi(t);
  if (wifi) {
    const warnings = wifi.security === 'nopass' || !wifi.password ? ['This network has no password, so anyone nearby could join it.'] : wifi.security.toUpperCase() === 'WEP' ? ['WEP is an obsolete, easily broken security type.'] : [];
    return {
      kind: 'wifi',
      title: 'Wi-Fi network',
      fields: [
        { label: 'Network name', value: wifi.ssid },
        { label: 'Security', value: wifi.security === 'nopass' ? 'None' : wifi.security },
        ...(wifi.password ? [{ label: 'Password', value: wifi.password, secret: true }] : []),
        ...(wifi.hidden ? [{ label: 'Hidden network', value: 'Yes' }] : []),
      ],
      warnings,
    };
  }
  const vc = parseVCard(t);
  if (vc) return { kind: 'vcard', title: 'Contact card', fields: vc, warnings: [] };
  const lower = t.toLowerCase();
  if (lower.startsWith('mailto:')) {
    const [addr, query = ''] = t.slice(7).split('?');
    const q = new URLSearchParams(query);
    const fields: Field[] = [{ label: 'To', value: decodeParam(addr) }];
    for (const [k, label] of [['subject', 'Subject'], ['body', 'Message'], ['cc', 'Cc']] as const) if (q.get(k)) fields.push({ label, value: q.get(k) as string });
    return { kind: 'email', title: 'Email', fields, warnings: [] };
  }
  const sms = /^(smsto|sms|mms|mmsto):([^:?;]*)(?:[:?;]|$)(.*)$/is.exec(t);
  if (sms) {
    const body = /^body=/i.test(sms[3]) ? decodeParam(sms[3].slice(5)) : sms[3];
    return { kind: 'sms', title: 'Text message', fields: [{ label: 'To', value: sms[2] }, ...(body ? [{ label: 'Message', value: body }] : [])], warnings: [] };
  }
  if (lower.startsWith('tel:')) return { kind: 'tel', title: 'Phone number', fields: [{ label: 'Number', value: decodeParam(t.slice(4)) }], warnings: [] };
  const geo = /^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i.exec(t);
  if (geo) {
    const bad = Math.abs(Number(geo[1])) > 90 || Math.abs(Number(geo[2])) > 180;
    return { kind: 'geo', title: 'Location', fields: [{ label: 'Latitude', value: geo[1] }, { label: 'Longitude', value: geo[2] }], warnings: bad ? ['These coordinates are outside the valid range.'] : [] };
  }
  if (/^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(t) || /^(javascript|data|file|vbscript):/i.test(t)) {
    const warnings = urlWarnings(t);
    return { kind: 'url', title: 'Link', fields: [{ label: 'Address', value: t }], warnings };
  }
  return { kind: 'text', title: 'Text', fields: [], warnings: [] };
}

/** Bullets for a masked value. */
export const mask = (s: string) => '•'.repeat(Math.min(Math.max(s.length, 6), 24));
