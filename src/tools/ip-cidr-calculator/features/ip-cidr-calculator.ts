// Pure IPv4/IPv6 maths on BigInt: parsing, CIDR details, range classification, containment,
// splitting and summarising. No DOM, so it's unit-testable in Node.

export type Version = 4 | 6;

export interface Address {
  version: Version;
  value: bigint;
}

export interface Cidr {
  version: Version;
  /** The address as typed (host bits may be set). */
  address: bigint;
  prefix: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const bitsOf = (v: Version) => (v === 4 ? 32 : 128);
const allOnes = (v: Version) => (1n << BigInt(bitsOf(v))) - 1n;

// --- parsing ------------------------------------------------------------------------------------

export function parseIPv4(s: string): bigint | null {
  const parts = s.split('.');
  if (parts.length !== 4) return null;
  let v = 0n;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    v = (v << 8n) | BigInt(n);
  }
  return v;
}

export function parseIPv6(input: string): bigint | null {
  let s = input.toLowerCase();
  const zone = s.indexOf('%');
  if (zone >= 0) s = s.slice(0, zone);
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);
  if (!s || /[^0-9a-f:.]/.test(s)) return null;
  // Embedded IPv4 in the last 32 bits.
  let tail: bigint[] = [];
  const lastColon = s.lastIndexOf(':');
  if (s.includes('.')) {
    const v4 = parseIPv4(s.slice(lastColon + 1));
    if (v4 === null) return null;
    tail = [v4 >> 16n, v4 & 0xffffn];
    s = s.slice(0, lastColon + 1);
    if (!s.endsWith('::')) s = s.slice(0, -1);
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const toGroups = (h: string) => (h === '' ? [] : h.split(':'));
  const head = toGroups(halves[0]);
  const rest = halves.length === 2 ? toGroups(halves[1]) : [];
  const groups = [...head, ...rest];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  const total = groups.length + tail.length;
  if (halves.length === 1 && total !== 8) return null;
  if (halves.length === 2 && total > 7) return null;
  const nums = [...head.map((g) => BigInt(parseInt(g, 16)))];
  const back = [...rest.map((g) => BigInt(parseInt(g, 16))), ...tail];
  const all = [...nums, ...Array(8 - nums.length - back.length).fill(0n), ...back];
  return all.reduce((acc, g) => (acc << 16n) | g, 0n);
}

export function parseAddress(s: string): Address | null {
  const t = s.trim();
  if (t.includes(':')) {
    const v = parseIPv6(t);
    return v === null ? null : { version: 6, value: v };
  }
  const v = parseIPv4(t);
  return v === null ? null : { version: 4, value: v };
}

/** Prefix length for a contiguous netmask, or null if the mask has holes. */
export function maskToPrefix(mask: bigint, version: Version): number | null {
  const bits = bitsOf(version);
  const s = mask.toString(2).padStart(bits, '0');
  if (!/^1*0*$/.test(s)) return null;
  return s.indexOf('0') < 0 ? bits : s.indexOf('0');
}

export const prefixToMask = (prefix: number, version: Version) => (allOnes(version) >> BigInt(bitsOf(version) - prefix)) << BigInt(bitsOf(version) - prefix);

/** Parses "10.0.0.1/24", "10.0.0.1 255.255.255.0", "10.0.0.1/255.255.255.0", "2001:db8::/32" or a bare IP. */
export function parseCidr(input: string): Result<Cidr> {
  const s = input.trim();
  if (!s) return { ok: false, error: 'Enter an IP address or CIDR.' };
  const [addrPart, maskPart, extra] = s.split(/\s*\/\s*|\s+/);
  if (extra !== undefined) return { ok: false, error: 'Use “address/prefix” or “address mask”.' };
  const addr = parseAddress(addrPart);
  if (!addr) return { ok: false, error: `“${addrPart}” isn't a valid IPv4 or IPv6 address.` };
  const bits = bitsOf(addr.version);
  let prefix = bits;
  if (maskPart !== undefined) {
    if (/^\d{1,3}$/.test(maskPart)) {
      prefix = Number(maskPart);
      if (prefix > bits) return { ok: false, error: `An IPv${addr.version} prefix is 0–${bits}.` };
    } else {
      const mask = addr.version === 4 ? parseIPv4(maskPart) : null;
      if (mask === null) return { ok: false, error: `“${maskPart}” isn't a prefix length${addr.version === 4 ? ' or netmask' : ''}.` };
      const p = maskToPrefix(mask, 4);
      if (p === null) {
        const wild = maskToPrefix(~mask & allOnes(4), 4);
        return { ok: false, error: wild !== null ? `${maskPart} looks like a wildcard mask; the netmask is ${formatAddress({ version: 4, value: ~mask & allOnes(4) })} (/${wild}).` : `${maskPart} isn't a contiguous netmask.` };
      }
      prefix = p;
    }
  }
  return { ok: true, value: { version: addr.version, address: addr.value, prefix } };
}

// --- formatting ---------------------------------------------------------------------------------

export function formatIPv4(v: bigint): string {
  return [24n, 16n, 8n, 0n].map((s) => ((v >> s) & 255n).toString()).join('.');
}

const groupsOf = (v: bigint) => Array.from({ length: 8 }, (_, i) => Number((v >> BigInt(112 - 16 * i)) & 0xffffn));

/** Full form: 2001:0db8:0000:…:0001. */
export function expandIPv6(v: bigint): string {
  return groupsOf(v)
    .map((g) => g.toString(16).padStart(4, '0'))
    .join(':');
}

/** RFC 5952 canonical form: lowercase, no leading zeros, longest zero run (≥ 2 groups) as "::". IPv4-mapped uses dotted quad. */
export function compressIPv6(v: bigint): string {
  if (v >> 32n === 0xffffn) return `::ffff:${formatIPv4(v & 0xffffffffn)}`;
  const g = groupsOf(v);
  let best = -1;
  let bestLen = 1;
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && g[j] === 0) j++;
    if (j - i > bestLen) {
      best = i;
      bestLen = j - i;
    }
    i = j;
  }
  const hex = g.map((x) => x.toString(16));
  if (best < 0) return hex.join(':');
  return `${hex.slice(0, best).join(':')}::${hex.slice(best + bestLen).join(':')}`;
}

export const formatAddress = (a: Address) => (a.version === 4 ? formatIPv4(a.value) : compressIPv6(a.value));
export const formatCidr = (version: Version, network: bigint, prefix: number) => `${formatAddress({ version, value: network })}/${prefix}`;

export function toBinary(v: bigint, version: Version): string {
  const size = version === 4 ? 8 : 16;
  return v
    .toString(2)
    .padStart(bitsOf(version), '0')
    .match(new RegExp(`.{${size}}`, 'g'))!
    .join(version === 4 ? '.' : ':');
}

/** Binary form split into [network bits, host bits] (separators included). */
export function binarySplit(v: bigint, version: Version, prefix: number): [string, string] {
  const s = toBinary(v, version);
  const size = version === 4 ? 8 : 16;
  const pos = prefix === 0 ? 0 : prefix + Math.floor((prefix - 1) / size);
  return [s.slice(0, pos), s.slice(pos)];
}

// --- classification ----------------------------------------------------------------------------

interface RangeDef {
  cidr: string;
  name: string;
  rfc: string;
  global: boolean;
}

const RANGES: RangeDef[] = [
  { cidr: '0.0.0.0/8', name: '“This network”', rfc: 'RFC 1122', global: false },
  { cidr: '0.0.0.0/32', name: 'Unspecified address', rfc: 'RFC 1122', global: false },
  { cidr: '10.0.0.0/8', name: 'Private network', rfc: 'RFC 1918', global: false },
  { cidr: '100.64.0.0/10', name: 'Carrier-grade NAT (shared address space)', rfc: 'RFC 6598', global: false },
  { cidr: '127.0.0.0/8', name: 'Loopback', rfc: 'RFC 1122', global: false },
  { cidr: '169.254.0.0/16', name: 'Link-local', rfc: 'RFC 3927', global: false },
  { cidr: '172.16.0.0/12', name: 'Private network', rfc: 'RFC 1918', global: false },
  { cidr: '192.0.0.0/24', name: 'IETF protocol assignments', rfc: 'RFC 6890', global: false },
  { cidr: '192.0.2.0/24', name: 'Documentation (TEST-NET-1)', rfc: 'RFC 5737', global: false },
  { cidr: '192.88.99.0/24', name: '6to4 relay anycast (deprecated)', rfc: 'RFC 7526', global: false },
  { cidr: '192.168.0.0/16', name: 'Private network', rfc: 'RFC 1918', global: false },
  { cidr: '198.18.0.0/15', name: 'Benchmarking', rfc: 'RFC 2544', global: false },
  { cidr: '198.51.100.0/24', name: 'Documentation (TEST-NET-2)', rfc: 'RFC 5737', global: false },
  { cidr: '203.0.113.0/24', name: 'Documentation (TEST-NET-3)', rfc: 'RFC 5737', global: false },
  { cidr: '224.0.0.0/4', name: 'Multicast', rfc: 'RFC 5771', global: false },
  { cidr: '240.0.0.0/4', name: 'Reserved for future use', rfc: 'RFC 1112', global: false },
  { cidr: '255.255.255.255/32', name: 'Limited broadcast', rfc: 'RFC 919', global: false },
  { cidr: '::/128', name: 'Unspecified address', rfc: 'RFC 4291', global: false },
  { cidr: '::1/128', name: 'Loopback', rfc: 'RFC 4291', global: false },
  { cidr: '::ffff:0:0/96', name: 'IPv4-mapped address', rfc: 'RFC 4291', global: false },
  { cidr: '64:ff9b::/96', name: 'NAT64 well-known prefix', rfc: 'RFC 6052', global: true },
  { cidr: '64:ff9b:1::/48', name: 'Local-use NAT64', rfc: 'RFC 8215', global: false },
  { cidr: '100::/64', name: 'Discard-only', rfc: 'RFC 6666', global: false },
  { cidr: '2000::/3', name: 'Global unicast', rfc: 'RFC 4291', global: true },
  { cidr: '2001::/32', name: 'Teredo', rfc: 'RFC 4380', global: true },
  { cidr: '2001:db8::/32', name: 'Documentation', rfc: 'RFC 3849', global: false },
  { cidr: '2002::/16', name: '6to4', rfc: 'RFC 3056', global: true },
  { cidr: '3fff::/20', name: 'Documentation', rfc: 'RFC 9637', global: false },
  { cidr: 'fc00::/7', name: 'Unique local address (ULA)', rfc: 'RFC 4193', global: false },
  { cidr: 'fe80::/10', name: 'Link-local', rfc: 'RFC 4291', global: false },
  { cidr: 'ff00::/8', name: 'Multicast', rfc: 'RFC 4291', global: false },
];

const PARSED_RANGES = RANGES.map((r) => {
  const c = parseCidr(r.cidr);
  if (!c.ok) throw new Error(r.cidr);
  return { ...r, ...c.value };
});

export interface Classification {
  name: string;
  rfc?: string;
  global: boolean;
  range?: string;
}

/** The most specific special-purpose range containing `a` (a whole block if a prefix is given). */
export function classify(a: Address, prefix = bitsOf(a.version)): Classification {
  let best: (typeof PARSED_RANGES)[number] | undefined;
  for (const r of PARSED_RANGES) {
    if (r.version !== a.version || r.prefix > prefix) continue;
    if (networkOf(a.value, r.prefix, a.version) !== r.address) continue;
    if (!best || r.prefix > best.prefix) best = r;
  }
  if (best) return { name: best.name, rfc: best.rfc, global: best.global, range: best.cidr };
  const inside = PARSED_RANGES.filter((r) => r.version === a.version && r.prefix > prefix && networkOf(r.address, prefix, a.version) === a.value);
  if (inside.length) {
    const more = inside.length > 3 ? ` and ${inside.length - 3} more` : '';
    return { name: `Mixed: contains ${inside.slice(0, 3).map((r) => r.cidr).join(', ')}${more}`, global: false };
  }
  return a.version === 4 ? { name: 'Public (global unicast)', global: true } : { name: 'Unassigned / reserved IPv6 space', global: false };
}

export function ipv4Class(v: bigint): string {
  const first = Number(v >> 24n);
  return first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D (multicast)' : 'E (reserved)';
}

// --- calculations -------------------------------------------------------------------------------

export const networkOf = (v: bigint, prefix: number, version: Version) => v & prefixToMask(prefix, version);

export interface CidrInfo {
  version: Version;
  prefix: number;
  address: bigint;
  network: bigint;
  broadcast: bigint;
  firstHost: bigint;
  lastHost: bigint;
  total: bigint;
  usable: bigint;
  netmask: bigint;
  wildcard: bigint;
  hostBitsSet: boolean;
  classification: Classification;
}

export function cidrInfo(c: Cidr): CidrInfo {
  const bits = bitsOf(c.version);
  const netmask = prefixToMask(c.prefix, c.version);
  const wildcard = ~netmask & allOnes(c.version);
  const network = c.address & netmask;
  const broadcast = network | wildcard;
  const total = 1n << BigInt(bits - c.prefix);
  let firstHost = network;
  let lastHost = broadcast;
  let usable = total;
  // IPv4: network and broadcast aren't hosts, except /31 (RFC 3021) and /32. IPv6 has no broadcast.
  if (c.version === 4 && c.prefix < 31) {
    firstHost = network + 1n;
    lastHost = broadcast - 1n;
    usable = total - 2n;
  }
  return {
    version: c.version,
    prefix: c.prefix,
    address: c.address,
    network,
    broadcast,
    firstHost,
    lastHost,
    total,
    usable,
    netmask,
    wildcard,
    hostBitsSet: c.address !== network,
    classification: classify({ version: c.version, value: network }, c.prefix),
  };
}

/** Whether `ip` (an address or CIDR) lies entirely inside `range`. */
export function contains(range: Cidr, ip: Cidr): boolean {
  if (range.version !== ip.version || ip.prefix < range.prefix) return false;
  return networkOf(ip.address, range.prefix, range.version) === networkOf(range.address, range.prefix, range.version);
}

export const MAX_SUBNETS = 4096;

export interface SplitResult {
  prefix: number;
  count: bigint;
  subnets: bigint[];
  truncated: boolean;
}

/** Splits a network into subnets of `newPrefix` (listing at most MAX_SUBNETS). */
export function splitByPrefix(c: Cidr, newPrefix: number): Result<SplitResult> {
  const bits = bitsOf(c.version);
  if (!Number.isInteger(newPrefix) || newPrefix < c.prefix || newPrefix > bits)
    return { ok: false, error: `The new prefix must be between /${c.prefix} and /${bits}.` };
  const count = 1n << BigInt(newPrefix - c.prefix);
  const step = 1n << BigInt(bits - newPrefix);
  const start = networkOf(c.address, c.prefix, c.version);
  const n = count > BigInt(MAX_SUBNETS) ? MAX_SUBNETS : Number(count);
  const subnets = Array.from({ length: n }, (_, i) => start + BigInt(i) * step);
  return { ok: true, value: { prefix: newPrefix, count, subnets, truncated: count > BigInt(n) } };
}

/** Splits into at least `n` equal subnets (rounded up to a power of two). */
export function splitInto(c: Cidr, n: number): Result<SplitResult> {
  if (!Number.isInteger(n) || n < 1) return { ok: false, error: 'Enter how many subnets you need (1 or more).' };
  const extra = Math.ceil(Math.log2(n) - 1e-9);
  const bits = bitsOf(c.version);
  if (c.prefix + extra > bits) return { ok: false, error: `/${c.prefix} can't be split into ${n} subnets.` };
  return splitByPrefix(c, c.prefix + extra);
}

/** Largest CIDR blocks exactly covering [start, end]. */
export function rangeToCidrs(start: bigint, end: bigint, version: Version): { network: bigint; prefix: number }[] {
  const bits = bitsOf(version);
  const out: { network: bigint; prefix: number }[] = [];
  let cur = start;
  while (cur <= end) {
    let size = bits;
    // Largest aligned block starting at cur that fits.
    while (size > 0) {
      const block = 1n << BigInt(bits - size + 1);
      if ((cur & (block - 1n)) !== 0n || cur + block - 1n > end) break;
      size--;
    }
    out.push({ network: cur, prefix: size });
    cur += 1n << BigInt(bits - size);
  }
  return out;
}

export interface Summary {
  cidrs: string[];
  errors: string[];
}

/** Merges a list of CIDRs/IPs (one per line or comma-separated) into the fewest covering blocks. */
export function summarise(input: string): Summary {
  const errors: string[] = [];
  const ranges: Record<Version, [bigint, bigint][]> = { 4: [], 6: [] };
  for (const raw of input.split(/[\n,;]+/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const c = parseCidr(line);
    if (!c.ok) {
      errors.push(`${line}: ${c.error}`);
      continue;
    }
    const info = cidrInfo(c.value);
    ranges[c.value.version].push([info.network, info.broadcast]);
  }
  const cidrs: string[] = [];
  for (const version of [4, 6] as const) {
    const sorted = ranges[version].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const merged: [bigint, bigint][] = [];
    for (const r of sorted) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1] + 1n) {
        if (r[1] > last[1]) last[1] = r[1];
      } else merged.push([r[0], r[1]]);
    }
    for (const [s, e] of merged) for (const b of rangeToCidrs(s, e, version)) cidrs.push(formatCidr(version, b.network, b.prefix));
  }
  return { cidrs, errors };
}

/** Reverse-DNS name for an address. */
export function reverseDns(a: Address): string {
  if (a.version === 4) return `${formatIPv4(a.value).split('.').reverse().join('.')}.in-addr.arpa`;
  return `${[...expandIPv6(a.value).replace(/:/g, '')].reverse().join('.')}.ip6.arpa`;
}
