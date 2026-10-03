// Parsing, validation and explanation of email-related DNS TXT records (SPF, DKIM, DMARC, MTA-STS,
// TLS-RPT, BIMI), plus builders for DMARC and SPF. Everything is static: nothing is resolved, so
// SPF include/redirect chains are not followed and DMARC external-report authorisation can't be checked.

export type Level = 'error' | 'warning' | 'info';
export interface Issue {
  level: Level;
  message: string;
}
export type RecordKind = 'spf' | 'dkim' | 'dmarc' | 'mta-sts' | 'tls-rpt' | 'bimi' | 'unknown';

export interface Item {
  label: string;
  value: string;
  meaning: string;
}

export interface ParsedRecord {
  kind: RecordKind;
  owner: string;
  raw: string;
  /** Lengths of each quoted character-string, when the input was quoted. */
  chunks: number[];
  items: Item[];
  issues: Issue[];
  summary: string;
  meta: { lookups?: number; keyBits?: number; keyType?: string; revoked?: boolean; policy?: string };
}

export interface Analysis {
  records: ParsedRecord[];
  issues: Issue[];
}

export const MAX_INPUT_CHARS = 200_000;
export const SPF_LOOKUP_LIMIT = 10;

const err = (message: string): Issue => ({ level: 'error', message });
const warn = (message: string): Issue => ({ level: 'warning', message });
const info = (message: string): Issue => ({ level: 'info', message });

// ---------- input extraction ----------

interface RawRecord {
  owner: string;
  value: string;
  chunks: number[];
}

const normOwner = (o: string) => o.trim().replace(/\.$/, '').toLowerCase();

function unquote(s: string): { value: string; chunks: number[] } | null {
  const re = /"((?:[^"\\]|\\.)*)"/g;
  const chunks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) chunks.push(m[1].replace(/\\(.)/g, '$1'));
  if (chunks.length === 0) return null;
  return { value: chunks.join(''), chunks: chunks.map((c) => c.length) };
}

/** Pull TXT values out of plain records, quoted strings, zone-file lines or `dig` output. */
export function extractRecords(input: string): RawRecord[] {
  const out: RawRecord[] = [];
  const lines: string[] = [];
  let pending = '';
  for (const line of input.split(/\r?\n/)) {
    const unq = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    if (pending) {
      pending += ' ' + line;
      if (unq.includes(')')) {
        lines.push(pending.replace(/[()]/g, ' '));
        pending = '';
      }
    } else if (unq.includes('(') && !unq.includes(')')) pending = line;
    else lines.push(line);
  }
  if (pending) lines.push(pending.replace(/[()]/g, ' '));

  let owner = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('$')) continue;
    const txt = /^(.*?)\bTXT\b\s*(.*)$/i.exec(line);
    if (txt && !/^["']/.test(line)) {
      const head = txt[1].split(/\s+/).filter((t) => t && !/^in$/i.test(t) && !/^\d+[smhdw]?$/i.test(t));
      if (head.length > 0) owner = normOwner(head[0] === '@' ? '' : head[0]);
      const rest = txt[2];
      const q = unquote(rest);
      const value = q ? q.value : rest.trim();
      if (value) out.push({ owner, value, chunks: q ? q.chunks : [] });
      continue;
    }
    const q = unquote(line);
    const value = q ? q.value : line;
    if (/^\s*v\s*=|_domainkey|^\s*p\s*=/i.test(value) || /^[a-z]\w*\s*=/.test(value)) out.push({ owner: '', value, chunks: q ? q.chunks : [] });
  }
  return out;
}

// ---------- tag=value lists (DKIM, DMARC, MTA-STS, TLS-RPT, BIMI) ----------

interface Tag {
  name: string;
  value: string;
}

function parseTags(value: string): { tags: Tag[]; malformed: string[] } {
  const tags: Tag[] = [];
  const malformed: string[] = [];
  for (const part of value.split(';')) {
    const p = part.trim();
    if (!p) continue;
    const eq = p.indexOf('=');
    if (eq <= 0) {
      malformed.push(p);
      continue;
    }
    tags.push({ name: p.slice(0, eq).trim().toLowerCase(), value: p.slice(eq + 1).trim() });
  }
  return { tags, malformed };
}

function dupAndMalformed(tags: Tag[], malformed: string[], issues: Issue[]) {
  const seen = new Set<string>();
  for (const t of tags) {
    if (seen.has(t.name)) issues.push(warn(`The tag "${t.name}" appears more than once. Receivers may reject the record or use only the first.`));
    seen.add(t.name);
  }
  for (const m of malformed) issues.push(err(`"${m}" is not a valid tag=value pair.`));
}

const has = (tags: Tag[], n: string) => tags.some((t) => t.name === n);
const get = (tags: Tag[], n: string) => tags.find((t) => t.name === n)?.value;

// ---------- SPF ----------

const QUALIFIERS: Record<string, [string, string]> = {
  '+': ['Pass', 'Mail from matching senders is accepted.'],
  '-': ['Fail', 'Mail from matching senders is rejected.'],
  '~': ['SoftFail', 'Mail from matching senders is accepted but marked suspicious.'],
  '?': ['Neutral', 'No statement is made about matching senders.'],
};

export function isIPv4(s: string): boolean {
  const parts = s.split('.');
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && +p <= 255 && (p === '0' || !p.startsWith('0')));
}

export function isIPv6(s: string): boolean {
  if (!/^[0-9a-f:.]+$/i.test(s) || !s.includes(':')) return false;
  const halves = s.split('::');
  if (halves.length > 2) return false;
  const groups = (h: string) => (h ? h.split(':') : []);
  const all = [...groups(halves[0]), ...(halves[1] !== undefined ? groups(halves[1]) : [])];
  let count = 0;
  for (let i = 0; i < all.length; i++) {
    const g = all[i];
    if (g.includes('.')) {
      if (i !== all.length - 1 || !isIPv4(g)) return false;
      count += 2;
    } else if (/^[0-9a-f]{1,4}$/i.test(g)) count++;
    else return false;
  }
  return halves.length === 2 ? count < 8 : count === 8;
}

function ipPrefixOk(addr: string, max: number): boolean {
  const [ip, prefix] = addr.split('/');
  if (prefix !== undefined && !(/^\d{1,3}$/.test(prefix) && +prefix <= max)) return false;
  return max === 32 ? isIPv4(ip) : isIPv6(ip);
}

const looksLikeDomain = (d: string) => d.length > 0 && (/%\{/.test(d) || /^[a-z0-9_]([a-z0-9_.-]*[a-z0-9_])?(\.[a-z0-9_-]+)*$/i.test(d.replace(/\/\d+(\/\/\d+)?$/, '')));

function parseSpf(r: RawRecord): ParsedRecord {
  const rec = base('spf', r);
  const terms = r.value.trim().split(/\s+/);
  rec.items.push({ label: 'v=spf1', value: '', meaning: 'Marks this as an SPF record, version 1.' });
  let lookups = 0;
  let allIndex = -1;
  let allQualifier = '';
  let hasRedirect = false;
  let hasExp = false;
  const lookupTerms: string[] = [];
  if (!/^v=spf1$/i.test(terms[0])) rec.issues.push(err('An SPF record must start with "v=spf1".'));
  if (terms[0] !== 'v=spf1' && /^v=spf1$/i.test(terms[0])) rec.issues.push(warn('Use lowercase "v=spf1"; some receivers are stricter about case.'));

  terms.slice(1).forEach((term, idx) => {
    const m = /^([+\-~?])?([A-Za-z][A-Za-z0-9_.-]*)(.*)$/.exec(term);
    if (!m) {
      rec.issues.push(err(`"${term}" is not a valid SPF term.`));
      return;
    }
    const q = m[1] ?? '+';
    const name = m[2].toLowerCase();
    const rest = m[3];
    const [qName, qMeaning] = QUALIFIERS[q];
    const add = (meaning: string) => rec.items.push({ label: term, value: '', meaning });
    const lookup = () => {
      lookups++;
      lookupTerms.push(term);
    };
    if (rest.startsWith('=')) {
      const val = rest.slice(1);
      if (name === 'redirect') {
        if (hasRedirect) rec.issues.push(err('"redirect" may appear only once.'));
        hasRedirect = true;
        if (!looksLikeDomain(val)) rec.issues.push(err(`"redirect=" needs a domain, got "${val}".`));
        lookup();
        add(`Use the SPF record of ${val} instead of this one (only if no mechanism matched). Counts as a DNS lookup.`);
      } else if (name === 'exp') {
        if (hasExp) rec.issues.push(err('"exp" may appear only once.'));
        hasExp = true;
        if (!looksLikeDomain(val)) rec.issues.push(err(`"exp=" needs a domain, got "${val}".`));
        add(`On failure, the explanation text is fetched from the TXT record at ${val}. Doesn't count toward the lookup limit.`);
      } else {
        add('Unknown modifier; receivers ignore it.');
        rec.issues.push(warn(`Unknown modifier "${name}=". It will be ignored.`));
      }
      return;
    }
    const arg = rest.startsWith(':') ? rest.slice(1) : rest;
    switch (name) {
      case 'all':
        if (rest) rec.issues.push(err(`"all" takes no value, got "${term}".`));
        if (allIndex < 0) {
          allIndex = idx + 1;
          allQualifier = q;
        }
        add(`${qName}: everything not matched earlier. ${qMeaning}`);
        break;
      case 'include':
        lookup();
        if (!rest.startsWith(':') || !looksLikeDomain(arg)) rec.issues.push(err(`"include" needs a domain ("include:example.com"), got "${term}".`));
        add(`${qName}: also authorise whatever the SPF record of ${arg || '(missing)'} authorises. Counts as a DNS lookup; its own lookups count too.`);
        break;
      case 'a':
      case 'mx': {
        lookup();
        const cidr = /^(?::([^/]*))?(?:\/(\d+))?(?:\/\/(\d+))?$/.exec(rest);
        if (!cidr || (cidr[1] !== undefined && !looksLikeDomain(cidr[1])) || (cidr[2] && +cidr[2] > 32) || (cidr[3] && +cidr[3] > 128)) rec.issues.push(err(`"${term}" is not a valid ${name} mechanism.`));
        const dom = cidr?.[1] ? cidr[1] : 'this domain';
        add(`${qName}: ${name === 'a' ? `the A/AAAA addresses of ${dom}` : `the mail servers (MX) of ${dom}`}${cidr?.[2] ? ` within /${cidr[2]}` : ''}. Counts as a DNS lookup.`);
        break;
      }
      case 'ip4':
      case 'ip6': {
        const ok = rest.startsWith(':') && ipPrefixOk(arg, name === 'ip4' ? 32 : 128);
        if (!ok) rec.issues.push(err(`"${term}" is not a valid ${name === 'ip4' ? 'IPv4' : 'IPv6'} address or range.`));
        else if (name === 'ip4' && arg.endsWith('/0')) rec.issues.push(warn(`"${term}" authorises every IPv4 address.`));
        add(`${qName}: the ${name === 'ip4' ? 'IPv4' : 'IPv6'} ${arg.includes('/') ? 'range' : 'address'} ${arg}. No DNS lookup.`);
        break;
      }
      case 'ptr':
        lookup();
        rec.issues.push(warn('"ptr" is deprecated (RFC 7208): it is slow and unreliable. Replace it with ip4/ip6 or include.'));
        add(`${qName}: hosts whose reverse DNS matches ${arg || 'this domain'}. Deprecated. Counts as a DNS lookup.`);
        break;
      case 'exists':
        lookup();
        if (!rest.startsWith(':') || !arg) rec.issues.push(err(`"exists" needs a domain ("exists:example.com"), got "${term}".`));
        add(`${qName}: matches if ${arg || '(missing)'} resolves to any A record (usually used with macros). Counts as a DNS lookup.`);
        break;
      default:
        rec.issues.push(err(`Unknown mechanism "${name}".`));
        add('Unknown mechanism: the whole record is invalid (permerror).');
    }
  });

  const total = terms.length;
  if (allIndex > 0 && allIndex < total - 1) {
    const trailing = terms.slice(allIndex + 1).filter((t) => !/^(redirect|exp)=/i.test(t));
    if (trailing.length) rec.issues.push(warn('Terms after "all" are never evaluated. Move "all" to the end.'));
  }
  if (allIndex > 0 && hasRedirect) rec.issues.push(warn('"redirect" is ignored when the record contains "all".'));
  if (allIndex < 0 && !hasRedirect) rec.issues.push(warn('The record has no "all" or "redirect", so unlisted senders get a Neutral result. End it with "~all" or "-all".'));
  if (allQualifier === '+') rec.issues.push(err('"+all" (or plain "all") authorises every server on the internet to send as your domain. Use "~all" or "-all".'));
  else if (allQualifier === '?') rec.issues.push(warn('"?all" is Neutral and gives no protection. Use "~all" or "-all".'));
  else if (allQualifier === '~') rec.issues.push(info('"~all" (SoftFail) is a common choice. "-all" is stricter once you are sure every sender is listed.'));

  rec.meta.lookups = lookups;
  if (lookups > SPF_LOOKUP_LIMIT) rec.issues.push(err(`This record alone needs ${lookups} DNS lookups; the limit is ${SPF_LOOKUP_LIMIT}. Receivers return a permanent error (permerror) and SPF fails.`));
  else if (lookups >= 8) rec.issues.push(warn(`${lookups} of ${SPF_LOOKUP_LIMIT} DNS lookups used by this record alone. Included records add more, so you may be at or over the limit.`));
  if (lookupTerms.some((t) => /^[+\-~?]?include:/i.test(t)) || hasRedirect) {
    rec.issues.push(info('Lookup count is static: the records behind include and redirect can\'t be resolved offline, and each adds its own lookups. Treat the number as a minimum and check the live total with a resolver.'));
  }
  rec.summary = `${lookups} DNS lookup${lookups === 1 ? '' : 's'} counted (limit ${SPF_LOOKUP_LIMIT}); ${allQualifier ? `ends with ${allQualifier === '+' ? '' : allQualifier}all` : hasRedirect ? 'delegates with redirect' : 'no "all" term'}.`;
  lengthChecks(rec);
  return rec;
}

function lengthChecks(rec: ParsedRecord) {
  const total = rec.raw.length;
  if (rec.chunks.some((c) => c > 255)) rec.issues.push(err('A quoted string in this TXT record is longer than 255 characters. Split it into several quoted strings of up to 255 characters each.'));
  else if (rec.chunks.length === 0 && total > 255) rec.issues.push(warn(`The record is ${total} characters; a single DNS string holds at most 255. Split it into several quoted strings (many DNS hosts do this for you).`));
  if (total > 450) rec.issues.push(warn(`The record is ${total} characters. Over about 450 risks exceeding the 512-byte UDP DNS response, which can break lookups.`));
}

// ---------- DER / DKIM key ----------

function b64Bytes(s: string): Uint8Array | null {
  const clean = s.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) return null;
  try {
    const bin = atob(clean + '='.repeat((4 - (clean.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

interface Der {
  tag: number;
  start: number; // content start
  end: number; // content end
}

function readDer(b: Uint8Array, pos: number): Der | null {
  if (pos + 2 > b.length) return null;
  const tag = b[pos];
  let len = b[pos + 1];
  let p = pos + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4 || p + n > b.length) return null;
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + b[p++];
  }
  if (p + len > b.length) return null;
  return { tag, start: p, end: p + len };
}

export interface KeyInfo {
  type: 'rsa' | 'ed25519' | 'unknown';
  bits: number | null;
}

/** Work out the key type and size from the DKIM p= bytes (SubjectPublicKeyInfo or bare PKCS#1 / raw Ed25519). */
export function inspectPublicKey(bytes: Uint8Array): KeyInfo {
  const top = readDer(bytes, 0);
  if (!top || top.tag !== 0x30 || top.end !== bytes.length) return bytes.length === 32 ? { type: 'ed25519', bits: 256 } : { type: 'unknown', bits: null };
  const first = readDer(bytes, top.start);
  if (!first) return { type: 'unknown', bits: null };
  const modulusBits = (b: Uint8Array, int: Der) => {
    let s = int.start;
    while (s < int.end - 1 && b[s] === 0) s++;
    const lead = b[s] ?? 0;
    return (int.end - s - 1) * 8 + (lead ? 32 - Math.clz32(lead) : 0);
  };
  if (first.tag === 0x02) return { type: 'rsa', bits: modulusBits(bytes, first) }; // bare RSAPublicKey
  if (first.tag === 0x30) {
    const oid = readDer(bytes, first.start);
    const bitString = readDer(bytes, first.end);
    if (!oid || oid.tag !== 0x06 || !bitString || bitString.tag !== 0x03) return { type: 'unknown', bits: null };
    const oidHex = [...bytes.slice(oid.start, oid.end)].map((x) => x.toString(16).padStart(2, '0')).join('');
    if (oidHex === '2b6570') return { type: 'ed25519', bits: (bitString.end - bitString.start - 1) * 8 };
    if (oidHex === '2a864886f70d010101') {
      const seq = readDer(bytes, bitString.start + 1);
      const n = seq && seq.tag === 0x30 ? readDer(bytes, seq.start) : null;
      if (n && n.tag === 0x02) return { type: 'rsa', bits: modulusBits(bytes, n) };
    }
  }
  return { type: 'unknown', bits: null };
}

// ---------- DKIM ----------

function parseDkim(r: RawRecord): ParsedRecord {
  const rec = base('dkim', r);
  const { tags, malformed } = parseTags(r.value);
  dupAndMalformed(tags, malformed, rec.issues);
  const known = ['v', 'k', 'p', 't', 'h', 's', 'n', 'g'];
  const meaning: Record<string, (v: string) => string> = {
    v: (v) => `DKIM record version${v === 'DKIM1' ? '' : ' (should be DKIM1)'}.`,
    k: (v) => `Key type: ${v === 'rsa' ? 'RSA' : v === 'ed25519' ? 'Ed25519' : v}.`,
    p: (v) => (v ? 'The base64 public key receivers use to verify signatures.' : 'Empty: this key has been revoked, so signatures using this selector fail.'),
    t: (v) => `Flags: ${v.split(':').map((f) => (f.trim() === 'y' ? 'y = testing mode, failures should not be treated as errors' : f.trim() === 's' ? 's = the domain may not sign for subdomains' : f.trim())).join('; ')}.`,
    h: (v) => `Allowed hash algorithms: ${v.split(':').map((a) => a.trim()).join(', ')}.`,
    s: (v) => `Service type: ${v === '*' ? 'any service' : v === 'email' ? 'email only' : v}.`,
    n: () => 'A human-readable note for administrators; ignored by receivers.',
    g: () => 'Obsolete granularity restriction from the original DKIM spec; modern receivers ignore it.',
  };
  for (const t of tags) {
    const shown = t.name === 'p' && t.value.length > 40 ? `${t.value.replace(/\s+/g, '').slice(0, 24)}…` : t.value;
    rec.items.push({ label: t.name, value: shown, meaning: known.includes(t.name) ? meaning[t.name](t.value) : 'Unknown tag; receivers ignore it.' });
    if (!known.includes(t.name)) rec.issues.push(warn(`Unknown DKIM tag "${t.name}" will be ignored.`));
  }
  if (has(tags, 'v')) {
    if (tags[0].name !== 'v') rec.issues.push(err('"v=" must be the first tag when it is present.'));
    if (get(tags, 'v') !== 'DKIM1') rec.issues.push(err('"v=" must be exactly "DKIM1".'));
  }
  const k = (get(tags, 'k') ?? 'rsa').toLowerCase();
  if (!['rsa', 'ed25519'].includes(k)) rec.issues.push(err(`Unknown key type k=${k}. Use rsa or ed25519.`));
  const t = get(tags, 't');
  if (t?.split(':').map((x) => x.trim()).includes('y')) rec.issues.push(warn('t=y marks this key as being in testing mode. Remove it once DKIM works so failures are enforced.'));
  const h = get(tags, 'h');
  if (h) {
    const algos = h.toLowerCase().split(':').map((x) => x.trim());
    if (algos.every((a) => a === 'sha1')) rec.issues.push(warn('h=sha1 only: SHA-1 is deprecated for DKIM (RFC 8301). Allow sha256.'));
    for (const a of algos) if (a !== 'sha1' && a !== 'sha256') rec.issues.push(warn(`Unknown hash algorithm "${a}" in h=.`));
  }
  const s = get(tags, 's');
  if (s && !['*', 'email'].includes(s.toLowerCase())) rec.issues.push(warn(`s=${s} is not a service type receivers recognise (use * or email).`));
  rec.meta.keyType = k;
  if (!has(tags, 'p')) rec.issues.push(err('The required "p=" tag (public key) is missing.'));
  else {
    const p = get(tags, 'p')!.replace(/\s+/g, '');
    if (p === '') {
      rec.meta.revoked = true;
      rec.issues.push(info('p= is empty: this key is revoked. Messages signed with this selector will fail DKIM.'));
      rec.summary = 'Revoked key (empty p=).';
    } else {
      const bytes = b64Bytes(p);
      if (!bytes) rec.issues.push(err('p= is not valid base64.'));
      else {
        const key = inspectPublicKey(bytes);
        if (key.type === 'unknown' || key.bits === null) {
          rec.issues.push(warn(`p= decodes to ${bytes.length} bytes but couldn't be read as an RSA or Ed25519 public key. Check for a truncated or corrupted key.`));
        } else {
          rec.meta.keyBits = key.bits;
          rec.meta.keyType = key.type;
          if (key.type === 'rsa' && k === 'ed25519') rec.issues.push(err('k=ed25519 but p= holds an RSA key.'));
          if (key.type === 'ed25519' && k === 'rsa' && has(tags, 'k')) rec.issues.push(err('k=rsa but p= holds an Ed25519 key.'));
          if (key.type === 'rsa') {
            if (key.bits < 1024) rec.issues.push(err(`The RSA key is about ${key.bits} bits, which is too weak and may be rejected. Use 2048 bits.`));
            else if (key.bits < 2048) rec.issues.push(warn(`The RSA key is about ${key.bits} bits. 1024 is the minimum receivers accept; 2048 is recommended.`));
            else if (key.bits > 2048) rec.issues.push(info(`A ${key.bits}-bit key is strong but long: split the p= value into quoted strings of up to 255 characters, and check your DNS host supports records this large.`));
          }
          rec.summary = `${key.type === 'rsa' ? 'RSA' : 'Ed25519'} key, about ${key.bits} bits.`;
        }
      }
    }
  }
  if (r.owner && !/(^|\.)_domainkey\./.test(r.owner)) rec.issues.push(warn('DKIM records live at "<selector>._domainkey.<domain>". This owner name doesn\'t contain "._domainkey.".'));
  lengthChecks(rec);
  return rec;
}

// ---------- DMARC ----------

const DMARC_TAGS = ['v', 'p', 'sp', 'np', 'pct', 'rua', 'ruf', 'adkim', 'aspf', 'fo', 'rf', 'ri', 'psd', 't'];
const POLICIES = ['none', 'quarantine', 'reject'];

function checkUris(rec: ParsedRecord, tag: string, value: string, owner: string) {
  const uris = value.split(',').map((u) => u.trim()).filter(Boolean);
  if (uris.length === 0) rec.issues.push(err(`${tag}= is empty. Provide one or more mailto: addresses.`));
  for (const u of uris) {
    const m = /^mailto:([^!,\s@]+@([^!,\s@]+))(?:!(\d+[kmgt]?))?$/i.exec(u);
    if (!m) {
      rec.issues.push(err(`${tag}=${u} is not a valid report URI. Use "mailto:name@example.com".`));
      continue;
    }
    const dom = m[2].toLowerCase();
    const zone = owner.replace(/^_dmarc\./, '');
    if (owner && zone && dom !== zone && !zone.endsWith('.' + dom) && !dom.endsWith('.' + zone)) {
      rec.issues.push(info(`${dom} is a different domain from ${zone}: it must publish "${zone}._report._dmarc.${dom}" with "v=DMARC1" to accept your reports. This can't be checked offline.`));
    }
  }
}

function parseDmarc(r: RawRecord): ParsedRecord {
  const rec = base('dmarc', r);
  const { tags, malformed } = parseTags(r.value);
  dupAndMalformed(tags, malformed, rec.issues);
  const meaning: Record<string, (v: string) => string> = {
    v: () => 'DMARC record version.',
    p: (v) => ({ none: 'Policy for failing mail: none. Monitor only; nothing is blocked.', quarantine: 'Policy for failing mail: quarantine. Treat it as suspicious (usually spam folder).', reject: 'Policy for failing mail: reject. Receivers should refuse it.' })[v.toLowerCase()] ?? `Policy: ${v} (not valid).`,
    sp: (v) => `Policy for subdomains: ${v}. Overrides p= for them.`,
    np: (v) => `Policy for non-existent subdomains: ${v}.`,
    pct: (v) => `Apply the policy to ${v}% of failing mail; the rest is treated one level softer.`,
    rua: (v) => `Send daily aggregate reports to ${v}.`,
    ruf: (v) => `Send individual failure (forensic) reports to ${v}. Few providers send these.`,
    adkim: (v) => `DKIM alignment: ${v === 's' ? 'strict, the DKIM signing domain must equal the From domain' : 'relaxed, subdomains of the From domain are allowed'}.`,
    aspf: (v) => `SPF alignment: ${v === 's' ? 'strict, the envelope sender domain must equal the From domain' : 'relaxed, subdomains of the From domain are allowed'}.`,
    fo: (v) => `Failure report options: ${v.split(':').map((o) => ({ '0': '0 = report if all checks fail', '1': '1 = report if any check fails', d: 'd = report DKIM failures', s: 's = report SPF failures' })[o.trim()] ?? o).join('; ')}.`,
    rf: (v) => `Failure report format: ${v}.`,
    ri: (v) => `Aggregate report interval requested: ${Number.isFinite(+v) ? `${(+v / 3600).toFixed(+v % 3600 === 0 ? 0 : 1)} hour(s)` : v}.`,
    psd: (v) => `Public suffix domain flag: ${v}.`,
    t: (v) => `Testing flag (DMARCbis): ${v}.`,
  };
  for (const t of tags) {
    rec.items.push({ label: t.name, value: t.value, meaning: DMARC_TAGS.includes(t.name) ? meaning[t.name](t.value) : 'Unknown tag; receivers ignore it.' });
    if (!DMARC_TAGS.includes(t.name)) rec.issues.push(warn(`Unknown DMARC tag "${t.name}" will be ignored.`));
  }
  if (tags.length === 0 || tags[0].name !== 'v') rec.issues.push(err('"v=DMARC1" must be the first tag, or the record is ignored.'));
  else if (tags[0].value !== 'DMARC1') rec.issues.push(tags[0].value.toUpperCase() === 'DMARC1' ? warn('Write the version as "DMARC1" in capitals; the value is case-sensitive.') : err(`"v=" must be "DMARC1", got "${tags[0].value}".`));
  const p = get(tags, 'p');
  if (p === undefined) rec.issues.push(err('The required "p=" policy tag is missing (none, quarantine or reject).'));
  else if (!POLICIES.includes(p.toLowerCase())) rec.issues.push(err(`p=${p} is not valid. Use none, quarantine or reject.`));
  else {
    rec.meta.policy = p.toLowerCase();
    if (tags.length > 1 && tags[0].name === 'v' && tags[1].name !== 'p' && has(tags, 'p')) rec.issues.push(warn('"p=" should come directly after "v=". Some receivers are strict about the order.'));
  }
  const sp = get(tags, 'sp');
  if (sp !== undefined && !POLICIES.includes(sp.toLowerCase())) rec.issues.push(err(`sp=${sp} is not valid. Use none, quarantine or reject.`));
  const np = get(tags, 'np');
  if (np !== undefined && !POLICIES.includes(np.toLowerCase())) rec.issues.push(err(`np=${np} is not valid. Use none, quarantine or reject.`));
  const pct = get(tags, 'pct');
  if (pct !== undefined) {
    if (!/^\d+$/.test(pct) || +pct > 100) rec.issues.push(err(`pct=${pct} must be a whole number from 0 to 100.`));
    else if (+pct < 100 && p && p.toLowerCase() !== 'none') rec.issues.push(warn(`pct=${pct}: the policy applies to only ${pct}% of failing mail. Raise it to 100 when you're confident.`));
  }
  for (const [tag, allowed] of [['adkim', ['r', 's']], ['aspf', ['r', 's']]] as const) {
    const v = get(tags, tag);
    if (v !== undefined && !allowed.includes(v.toLowerCase() as 'r' | 's')) rec.issues.push(err(`${tag}=${v} is not valid. Use r (relaxed) or s (strict).`));
  }
  const fo = get(tags, 'fo');
  if (fo !== undefined && !fo.split(':').every((o) => ['0', '1', 'd', 's'].includes(o.trim()))) rec.issues.push(err(`fo=${fo} is not valid. Use 0, 1, d or s, separated by colons.`));
  const rf = get(tags, 'rf');
  if (rf !== undefined && rf.toLowerCase() !== 'afrf') rec.issues.push(warn(`rf=${rf}: only "afrf" is defined.`));
  const ri = get(tags, 'ri');
  if (ri !== undefined && !/^\d+$/.test(ri)) rec.issues.push(err(`ri=${ri} must be a number of seconds.`));
  const rua = get(tags, 'rua');
  const ruf = get(tags, 'ruf');
  if (rua !== undefined) checkUris(rec, 'rua', rua, r.owner);
  if (ruf !== undefined) checkUris(rec, 'ruf', ruf, r.owner);
  if (rua === undefined) rec.issues.push(warn('No "rua=": you won\'t receive aggregate reports, so you can\'t see who is sending as your domain.'));
  if (p?.toLowerCase() === 'none') rec.issues.push(warn('p=none is monitoring only: spoofed mail is still delivered. Move to quarantine, then reject, once reports show your legitimate mail passes.'));
  if (p && sp && ['quarantine', 'reject'].includes(p.toLowerCase()) && sp.toLowerCase() === 'none') rec.issues.push(warn('sp=none leaves subdomains unprotected even though the main domain is enforced.'));
  if (r.owner && !/^_dmarc(\.|$)/.test(r.owner)) rec.issues.push(warn('DMARC records must be published at "_dmarc.<domain>". This owner name doesn\'t start with "_dmarc.".'));
  rec.summary = rec.meta.policy ? `Policy ${rec.meta.policy}${sp ? `, subdomains ${sp}` : ''}${pct && pct !== '100' ? `, ${pct}% of mail` : ''}.` : 'No valid policy.';
  lengthChecks(rec);
  return rec;
}

// ---------- MTA-STS, TLS-RPT, BIMI ----------

function parseMtaSts(r: RawRecord): ParsedRecord {
  const rec = base('mta-sts', r);
  const { tags, malformed } = parseTags(r.value);
  dupAndMalformed(tags, malformed, rec.issues);
  for (const t of tags) {
    const m = t.name === 'v' ? 'MTA-STS record version.' : t.name === 'id' ? 'Policy ID. Change it whenever the policy file changes so senders re-fetch it.' : 'Unknown tag; ignored.';
    rec.items.push({ label: t.name, value: t.value, meaning: m });
    if (t.name !== 'v' && t.name !== 'id') rec.issues.push(warn(`Unknown MTA-STS tag "${t.name}" will be ignored.`));
  }
  if (tags[0]?.name !== 'v' || tags[0].value !== 'STSv1') rec.issues.push(err('The record must start with "v=STSv1".'));
  const id = get(tags, 'id');
  if (id === undefined) rec.issues.push(err('The required "id=" tag is missing.'));
  else if (!/^[A-Za-z0-9]{1,32}$/.test(id)) rec.issues.push(err('id= must be 1 to 32 letters and digits (for example a timestamp like 20240101T000000).'));
  if (r.owner && !/^_mta-sts\./.test(r.owner)) rec.issues.push(warn('MTA-STS records are published at "_mta-sts.<domain>".'));
  rec.issues.push(info('The policy itself is served at https://mta-sts.<domain>/.well-known/mta-sts.txt; it can\'t be checked here.'));
  rec.summary = id ? `Policy id ${id}.` : 'No policy id.';
  return rec;
}

function parseTlsRpt(r: RawRecord): ParsedRecord {
  const rec = base('tls-rpt', r);
  const { tags, malformed } = parseTags(r.value);
  dupAndMalformed(tags, malformed, rec.issues);
  for (const t of tags) {
    rec.items.push({ label: t.name, value: t.value, meaning: t.name === 'v' ? 'TLS reporting record version.' : t.name === 'rua' ? `Send daily SMTP TLS reports to ${t.value}.` : 'Unknown tag; ignored.' });
    if (t.name !== 'v' && t.name !== 'rua') rec.issues.push(warn(`Unknown TLS-RPT tag "${t.name}" will be ignored.`));
  }
  if (tags[0]?.name !== 'v' || tags[0].value !== 'TLSRPTv1') rec.issues.push(err('The record must start with "v=TLSRPTv1".'));
  const rua = get(tags, 'rua');
  if (rua === undefined) rec.issues.push(err('The required "rua=" tag is missing.'));
  else {
    const uris = rua.split(',').map((u) => u.trim()).filter(Boolean);
    if (uris.length === 0) rec.issues.push(err('rua= is empty.'));
    for (const u of uris) if (!/^mailto:[^@\s]+@[^@\s]+$/i.test(u) && !/^https:\/\/[^\s]+$/i.test(u)) rec.issues.push(err(`rua=${u} must be "mailto:name@example.com" or an https:// URL.`));
  }
  if (r.owner && !/^_smtp\._tls\./.test(r.owner)) rec.issues.push(warn('TLS-RPT records are published at "_smtp._tls.<domain>".'));
  rec.summary = rua ? `Reports to ${rua}.` : 'No report destination.';
  return rec;
}

function parseBimi(r: RawRecord): ParsedRecord {
  const rec = base('bimi', r);
  const { tags, malformed } = parseTags(r.value);
  dupAndMalformed(tags, malformed, rec.issues);
  for (const t of tags) {
    const m = t.name === 'v' ? 'BIMI record version.' : t.name === 'l' ? (t.value ? `Location of the brand logo (SVG Tiny PS): ${t.value}.` : 'Empty: the domain declines to publish a BIMI logo.') : t.name === 'a' ? (t.value ? `Location of the Verified Mark Certificate (VMC/CMC, PEM): ${t.value}.` : 'No authority evidence supplied.') : 'Unknown tag; ignored.';
    rec.items.push({ label: t.name, value: t.value, meaning: m });
    if (!['v', 'l', 'a'].includes(t.name)) rec.issues.push(warn(`Unknown BIMI tag "${t.name}" will be ignored.`));
  }
  if (tags[0]?.name !== 'v' || tags[0].value !== 'BIMI1') rec.issues.push(err('The record must start with "v=BIMI1".'));
  const l = get(tags, 'l');
  const a = get(tags, 'a');
  if (l === undefined) rec.issues.push(err('The "l=" tag (logo URL) is required, even if empty to decline.'));
  else if (l === '') rec.issues.push(info('l= is empty: this record declines BIMI.'));
  else {
    if (!/^https:\/\//i.test(l)) rec.issues.push(err('l= must be an https:// URL.'));
    else if (!/\.svg(\?.*)?$/i.test(l)) rec.issues.push(warn('l= should point to an SVG file (SVG Tiny PS profile).'));
  }
  if (a !== undefined && a !== '' && !/^https:\/\//i.test(a)) rec.issues.push(err('a= must be an https:// URL to a PEM certificate.'));
  if (a === undefined || a === '') rec.issues.push(info('Without a=, most mailbox providers (Gmail, Apple Mail) won\'t show the logo: they require a VMC or CMC.'));
  rec.issues.push(info('BIMI only works when the domain\'s DMARC policy is quarantine or reject at 100%.'));
  if (r.owner && !/(^|\.)_bimi\./.test(r.owner)) rec.issues.push(warn('BIMI records are published at "<selector>._bimi.<domain>", usually "default._bimi.<domain>".'));
  rec.summary = l ? `Logo at ${l}.` : 'No logo URL.';
  return rec;
}

// ---------- dispatch ----------

function base(kind: RecordKind, r: RawRecord): ParsedRecord {
  return { kind, owner: r.owner, raw: r.value, chunks: r.chunks, items: [], issues: [], summary: '', meta: {} };
}

export function detectKind(value: string, owner = ''): RecordKind {
  const v = value.trim();
  if (/^v=spf1(\s|$)/i.test(v)) return 'spf';
  if (/^v=dkim1\b/i.test(v)) return 'dkim';
  if (/^v=dmarc1\b/i.test(v)) return 'dmarc';
  if (/^v=stsv1\b/i.test(v)) return 'mta-sts';
  if (/^v=tlsrptv1\b/i.test(v)) return 'tls-rpt';
  if (/^v=bimi1\b/i.test(v)) return 'bimi';
  if (/(^|\.)_domainkey\./.test(owner) || /^\s*(k=[a-z0-9]+\s*;\s*)?p=[A-Za-z0-9+/=\s]*$/.test(v)) return 'dkim';
  if (/(^|;)\s*v=dmarc1\b/i.test(v) || (/^_dmarc(\.|$)/.test(owner) && /^\s*v\s*=/i.test(v))) return 'dmarc';
  return 'unknown';
}

export const KIND_LABEL: Record<RecordKind, string> = {
  spf: 'SPF',
  dkim: 'DKIM',
  dmarc: 'DMARC',
  'mta-sts': 'MTA-STS',
  'tls-rpt': 'TLS-RPT',
  bimi: 'BIMI',
  unknown: 'Other',
};

export function analyseRecord(r: RawRecord): ParsedRecord {
  switch (detectKind(r.value, r.owner)) {
    case 'spf':
      return parseSpf(r);
    case 'dkim':
      return parseDkim(r);
    case 'dmarc':
      return parseDmarc(r);
    case 'mta-sts':
      return parseMtaSts(r);
    case 'tls-rpt':
      return parseTlsRpt(r);
    case 'bimi':
      return parseBimi(r);
    default: {
      const rec = base('unknown', r);
      rec.issues.push(info('Not recognised as an SPF, DKIM, DMARC, MTA-STS, TLS-RPT or BIMI record, so it was skipped.'));
      rec.summary = 'Not an email authentication record.';
      return rec;
    }
  }
}

export function analyse(input: string): Analysis {
  const records = extractRecords(input.slice(0, MAX_INPUT_CHARS)).map(analyseRecord);
  const issues: Issue[] = [];
  for (const kind of ['spf', 'dmarc', 'mta-sts', 'tls-rpt'] as const) {
    const byOwner = new Map<string, number>();
    for (const r of records) if (r.kind === kind) byOwner.set(r.owner, (byOwner.get(r.owner) ?? 0) + 1);
    for (const [owner, n] of byOwner) {
      if (n > 1) issues.push(err(`${n} ${KIND_LABEL[kind]} records${owner ? ` at ${owner}` : ''}. A domain must publish exactly one: with more than one, receivers return a permanent error (permerror) and ${KIND_LABEL[kind]} fails. Merge them into one record.`));
    }
  }
  const bimi = records.find((r) => r.kind === 'bimi');
  const dmarc = records.find((r) => r.kind === 'dmarc');
  if (bimi && dmarc && !['quarantine', 'reject'].includes(dmarc.meta.policy ?? '')) issues.push(warn('A BIMI record is present but the DMARC policy is not quarantine or reject, so mailbox providers won\'t show the logo.'));
  if (records.length === 0 && input.trim()) issues.push(warn('No TXT records found. Paste the record value (v=spf1 …), or zone lines like: example.com. IN TXT "v=spf1 …".'));
  if (input.length > MAX_INPUT_CHARS) issues.push(warn(`Only the first ${MAX_INPUT_CHARS.toLocaleString('en')} characters were read.`));
  return { records, issues };
}

export function recordStatus(r: ParsedRecord): 'error' | 'warning' | 'ok' {
  if (r.issues.some((i) => i.level === 'error')) return 'error';
  if (r.issues.some((i) => i.level === 'warning')) return 'warning';
  return 'ok';
}

// ---------- builders ----------

export interface DmarcOptions {
  policy: 'none' | 'quarantine' | 'reject';
  subdomainPolicy: '' | 'none' | 'quarantine' | 'reject';
  pct: number;
  rua: string;
  ruf: string;
  adkim: 'r' | 's';
  aspf: 'r' | 's';
  fo: '0' | '1' | 'd' | 's';
  ri: number;
}

export const DMARC_DEFAULTS: DmarcOptions = { policy: 'none', subdomainPolicy: '', pct: 100, rua: '', ruf: '', adkim: 'r', aspf: 'r', fo: '0', ri: 86400 };

function toMailto(list: string): string[] {
  return list
    .split(/[\s,;]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => (/^mailto:/i.test(x) ? x : /^[^@\s:]+@[^@\s]+$/.test(x) ? `mailto:${x}` : x));
}

export function buildDmarc(o: DmarcOptions): string {
  const parts = ['v=DMARC1', `p=${o.policy}`];
  if (o.subdomainPolicy && o.subdomainPolicy !== o.policy) parts.push(`sp=${o.subdomainPolicy}`);
  const pct = Math.min(100, Math.max(0, Math.round(Number.isFinite(o.pct) ? o.pct : 100)));
  if (pct !== 100) parts.push(`pct=${pct}`);
  const rua = toMailto(o.rua);
  if (rua.length) parts.push(`rua=${rua.join(',')}`);
  const ruf = toMailto(o.ruf);
  if (ruf.length) parts.push(`ruf=${ruf.join(',')}`);
  if (o.adkim !== 'r') parts.push(`adkim=${o.adkim}`);
  if (o.aspf !== 'r') parts.push(`aspf=${o.aspf}`);
  if (o.fo !== '0') parts.push(`fo=${o.fo}`);
  if (Number.isFinite(o.ri) && o.ri !== 86400 && o.ri > 0) parts.push(`ri=${Math.round(o.ri)}`);
  return parts.join('; ');
}

export interface SpfOptions {
  mx: boolean;
  a: boolean;
  includes: string;
  ip4: string;
  ip6: string;
  all: '-all' | '~all' | '?all';
  redirect: string;
}

export const SPF_DEFAULTS: SpfOptions = { mx: false, a: false, includes: '', ip4: '', ip6: '', all: '~all', redirect: '' };

const list = (s: string) => s.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);

export function buildSpf(o: SpfOptions): string {
  const parts = ['v=spf1'];
  if (o.a) parts.push('a');
  if (o.mx) parts.push('mx');
  for (const ip of list(o.ip4)) parts.push(`ip4:${ip.replace(/^ip4:/i, '')}`);
  for (const ip of list(o.ip6)) parts.push(`ip6:${ip.replace(/^ip6:/i, '')}`);
  for (const inc of list(o.includes)) parts.push(`include:${inc.replace(/^include:/i, '')}`);
  const redirect = o.redirect.trim();
  if (redirect) parts.push(`redirect=${redirect}`);
  else parts.push(o.all);
  return parts.join(' ');
}

/** Split a long TXT value into quoted 255-character strings, as zone files need. */
export function toZoneTxt(value: string): string {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += 255) chunks.push(value.slice(i, i + 255));
  return chunks.map((c) => `"${c.replace(/(["\\])/g, '\\$1')}"`).join(' ');
}
