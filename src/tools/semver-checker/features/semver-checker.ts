// SemVer 2.0.0 parser and npm-style range matcher (the grammar node-semver documents).
// Pure TypeScript: no DOM, unit-tested in Node.

export type Identifier = string | number;

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: Identifier[];
  build: string[];
}

export interface RangeOptions {
  /** Let prerelease versions match any range, not only ranges that mention the same [major, minor, patch]. */
  includePrerelease?: boolean;
}

const NUM = '0|[1-9]\\d*';
const PRE_ID = `(?:${NUM}|\\d*[A-Za-z-][0-9A-Za-z-]*)`;
const PRE = `(?:-(${PRE_ID}(?:\\.${PRE_ID})*))`;
const BUILD = `(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))`;
const FULL = new RegExp(`^[v=]?\\s*(${NUM})\\.(${NUM})\\.(${NUM})${PRE}?${BUILD}?$`);

const toNum = (s: string): number | null => {
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
};

/** Parses a full version ("1.2.3-beta.1+build.5"); a leading "v" or "=" is accepted. */
export function parseVersion(input: string): SemVer | null {
  const m = FULL.exec(input.trim());
  if (!m) return null;
  const [major, minor, patch] = [toNum(m[1]), toNum(m[2]), toNum(m[3])];
  if (major === null || minor === null || patch === null) return null;
  const prerelease: Identifier[] = [];
  if (m[4]) {
    for (const id of m[4].split('.')) {
      if (/^\d+$/.test(id)) {
        const n = toNum(id);
        if (n === null) return null;
        prerelease.push(n);
      } else prerelease.push(id);
    }
  }
  return { major, minor, patch, prerelease, build: m[5] ? m[5].split('.') : [] };
}

export function formatVersion(v: SemVer, withBuild = false): string {
  let s = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease.length) s += `-${v.prerelease.join('.')}`;
  if (withBuild && v.build.length) s += `+${v.build.join('.')}`;
  return s;
}

function compareIds(a: Identifier, b: Identifier): number {
  const an = typeof a === 'number';
  const bn = typeof b === 'number';
  if (an && bn) return a === b ? 0 : a < b ? -1 : 1;
  if (an) return -1; // numeric identifiers have lower precedence than alphanumeric ones
  if (bn) return 1;
  return a === b ? 0 : a < b ? -1 : 1; // ASCII order
}

export function compareMain(a: SemVer, b: SemVer): number {
  return Math.sign(a.major - b.major) || Math.sign(a.minor - b.minor) || Math.sign(a.patch - b.patch);
}

/** SemVer precedence (build metadata ignored): -1, 0 or 1. */
export function compare(a: SemVer, b: SemVer): number {
  const main = compareMain(a, b);
  if (main) return main;
  const pa = a.prerelease;
  const pb = b.prerelease;
  if (!pa.length && !pb.length) return 0;
  if (!pa.length) return 1; // a release is greater than its prereleases
  if (!pb.length) return -1;
  for (let i = 0; ; i++) {
    if (i >= pa.length && i >= pb.length) return 0;
    if (i >= pa.length) return -1;
    if (i >= pb.length) return 1;
    const c = compareIds(pa[i], pb[i]);
    if (c) return c;
  }
}

// ---------------------------------------------------------------------------------------------
// Ranges

export type Operator = '' | '<' | '<=' | '>' | '>=';
export type Comparator = { any: true } | { any: false; op: Operator; version: SemVer };
export type ComparatorSet = Comparator[];

export class SemverRangeError extends Error {}

const ANY: Comparator = { any: true };
const NOTHING = (): Comparator => ({ any: false, op: '<', version: v(0, 0, 0, [0]) });

function v(major: number, minor: number, patch: number, prerelease: Identifier[] = []): SemVer {
  return { major, minor, patch, prerelease, build: [] };
}

const XR = `x|X|\\*|${NUM}`;
const PARTIAL = new RegExp(`^v?(${XR})(?:\\.(${XR})(?:\\.(${XR})${PRE}?${BUILD}?)?)?$`);

interface Partial {
  M: number | null;
  m: number | null;
  p: number | null;
  pre: Identifier[];
}

function parsePartial(s: string, whole: string): Partial {
  const m = PARTIAL.exec(s);
  if (!m) throw new SemverRangeError(`“${whole}” isn’t a valid version or comparator.`);
  const x = (g: string | undefined) => (g === undefined || g === 'x' || g === 'X' || g === '*' ? null : toNum(g) ?? NaN);
  const M = x(m[1]);
  const mi = M === null ? null : x(m[2]);
  const p = mi === null ? null : x(m[3]);
  if (Number.isNaN(M) || Number.isNaN(mi) || Number.isNaN(p)) throw new SemverRangeError(`“${whole}” has a number that is too large.`);
  const pre = p !== null && m[4] ? m[4].split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id)) : [];
  return { M, m: mi, p, pre };
}

const cmp = (op: Operator, version: SemVer): Comparator => ({ any: false, op, version });

function caret(pt: Partial, z: Identifier[]): Comparator[] {
  const { M, m, p, pre } = pt;
  if (M === null) return [ANY];
  if (m === null) return [cmp('>=', v(M, 0, 0, z)), cmp('<', v(M + 1, 0, 0, [0]))];
  if (p === null) {
    return M === 0
      ? [cmp('>=', v(M, m, 0, z)), cmp('<', v(M, m + 1, 0, [0]))]
      : [cmp('>=', v(M, m, 0, z)), cmp('<', v(M + 1, 0, 0, [0]))];
  }
  const lo = cmp('>=', v(M, m, p, pre));
  if (M === 0) return m === 0 ? [lo, cmp('<', v(0, 0, p + 1, [0]))] : [lo, cmp('<', v(0, m + 1, 0, [0]))];
  return [lo, cmp('<', v(M + 1, 0, 0, [0]))];
}

function tilde(pt: Partial, z: Identifier[]): Comparator[] {
  const { M, m, p, pre } = pt;
  if (M === null) return [ANY];
  if (m === null) return [cmp('>=', v(M, 0, 0, z)), cmp('<', v(M + 1, 0, 0, [0]))];
  if (p === null) return [cmp('>=', v(M, m, 0, z)), cmp('<', v(M, m + 1, 0, [0]))];
  return [cmp('>=', v(M, m, p, pre)), cmp('<', v(M, m + 1, 0, [0]))];
}

function primitive(op: string, pt: Partial, z: Identifier[]): Comparator[] {
  const { M, m, p, pre } = pt;
  const anyX = M === null || m === null || p === null;
  if (!anyX) {
    const ver = v(M, m, p, pre);
    return [cmp(op === '=' ? '' : (op as Operator), ver)];
  }
  if (M === null) return op === '<' || op === '>' ? [NOTHING()] : [ANY];
  if (op === '' || op === '=') {
    return m === null ? [cmp('>=', v(M, 0, 0, z)), cmp('<', v(M + 1, 0, 0, [0]))] : [cmp('>=', v(M, m, 0, z)), cmp('<', v(M, m + 1, 0, [0]))];
  }
  let [a, b] = [M, m ?? 0];
  switch (op) {
    case '>':
      return m === null ? [cmp('>=', v(a + 1, 0, 0, z))] : [cmp('>=', v(a, b + 1, 0, z))];
    case '>=':
      return [cmp('>=', v(a, b, 0, z))];
    case '<':
      return [cmp('<', v(a, b, 0, [0]))];
    case '<=':
      if (m === null) a++;
      else b++;
      return [cmp('<', v(a, m === null ? 0 : b, 0, [0]))];
  }
  return [ANY];
}

function hyphen(from: Partial, to: Partial, z: Identifier[]): Comparator[] {
  const out: Comparator[] = [];
  if (from.M !== null) {
    if (from.m === null) out.push(cmp('>=', v(from.M, 0, 0, z)));
    else if (from.p === null) out.push(cmp('>=', v(from.M, from.m, 0, z)));
    else out.push(cmp('>=', v(from.M, from.m, from.p, from.pre.length ? from.pre : z)));
  }
  if (to.M !== null) {
    if (to.m === null) out.push(cmp('<', v(to.M + 1, 0, 0, [0])));
    else if (to.p === null) out.push(cmp('<', v(to.M, to.m + 1, 0, [0])));
    else if (to.pre.length) out.push(cmp('<=', v(to.M, to.m, to.p, to.pre)));
    else if (z.length) out.push(cmp('<', v(to.M, to.m, to.p + 1, [0])));
    else out.push(cmp('<=', v(to.M, to.m, to.p)));
  }
  return out.length ? out : [ANY];
}

const HYPHEN = /^\s*(\S+)\s+-\s+(\S+)\s*$/;
const TOKEN = /^(~>|~|\^|<=|>=|<|>|=)?(.*)$/;

/** Parses "^1.2.0 || >=3 <4" into comparator sets (one per `||` alternative). */
export function parseRange(range: string, opts: RangeOptions = {}): ComparatorSet[] {
  const z: Identifier[] = opts.includePrerelease ? [0] : [];
  const sets: ComparatorSet[] = [];
  for (const part of range.split('||')) {
    const text = part.trim();
    const h = HYPHEN.exec(text);
    if (h) {
      sets.push(hyphen(parsePartial(h[1], h[1]), parsePartial(h[2], h[2]), z));
      continue;
    }
    if (!text) {
      sets.push([ANY]);
      continue;
    }
    const tokens = text.replace(/(~>|~|\^|<=|>=|<|>|=)\s+/g, '$1').split(/\s+/);
    const set: Comparator[] = [];
    for (const tok of tokens) {
      const [, op = '', rest] = TOKEN.exec(tok)!;
      if (!rest) throw new SemverRangeError(`“${tok}” is missing a version after the operator.`);
      const pt = parsePartial(rest, tok);
      if (op === '^') set.push(...caret(pt, z));
      else if (op === '~' || op === '~>') set.push(...tilde(pt, z));
      else set.push(...primitive(op, pt, z));
    }
    const real = set.filter((c) => !c.any);
    sets.push(real.length ? real : [ANY]);
  }
  return sets;
}

export function formatComparator(c: Comparator): string {
  return c.any ? '*' : `${c.op}${formatVersion(c.version)}`;
}

/** The range as plain bounds, e.g. "^1.2" → ">=1.2.0 <2.0.0-0". */
export function explainRange(range: string, opts: RangeOptions = {}): string {
  return parseRange(range, opts)
    .map((set) => set.map(formatComparator).join(' '))
    .join(' || ');
}

function testComparator(c: Comparator, ver: SemVer): boolean {
  if (c.any) return true;
  const r = compare(ver, c.version);
  switch (c.op) {
    case '':
      return r === 0;
    case '<':
      return r < 0;
    case '<=':
      return r <= 0;
    case '>':
      return r > 0;
    case '>=':
      return r >= 0;
  }
}

export type SetResult = { ok: true } | { ok: false; reason: string };

function testSet(set: ComparatorSet, ver: SemVer, opts: RangeOptions): SetResult {
  for (const c of set) {
    if (!testComparator(c, ver)) return { ok: false, reason: `${formatVersion(ver)} is not ${formatComparator(c)}` };
  }
  if (ver.prerelease.length && !opts.includePrerelease) {
    const allowed = set.some((c) => !c.any && c.version.prerelease.length > 0 && compareMain(c.version, ver) === 0);
    if (!allowed) {
      return {
        ok: false,
        reason: `${formatVersion(ver)} is a prerelease, and prereleases only match when a comparator has a prerelease on ${ver.major}.${ver.minor}.${ver.patch} (or with “include prereleases”)`,
      };
    }
  }
  return { ok: true };
}

export interface CheckResult {
  ok: boolean;
  /** Plain-English reason: which bound matched, or why each alternative failed. */
  reason: string;
}

export function check(version: string, range: string, opts: RangeOptions = {}): CheckResult {
  const ver = parseVersion(version);
  if (!ver) return { ok: false, reason: `“${version.trim()}” isn’t a valid semantic version` };
  const sets = parseRange(range, opts);
  const reasons: string[] = [];
  for (const set of sets) {
    const r = testSet(set, ver, opts);
    if (r.ok) return { ok: true, reason: `matches ${set.map(formatComparator).join(' ')}` };
    reasons.push(r.reason);
  }
  return { ok: false, reason: reasons.join('; ') };
}

export function satisfies(version: string, range: string, opts: RangeOptions = {}): boolean {
  try {
    return check(version, range, opts).ok;
  } catch {
    return false;
  }
}

/** Sorts valid versions ascending (invalid ones are dropped). */
export function sortVersions(versions: string[], descending = false): string[] {
  const parsed = versions.map((s) => ({ s: s.trim(), v: parseVersion(s) })).filter((x): x is { s: string; v: SemVer } => x.v !== null);
  parsed.sort((a, b) => compare(a.v, b.v) || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0));
  if (descending) parsed.reverse();
  return parsed.map((x) => x.s);
}

export function maxSatisfying(versions: string[], range: string, opts: RangeOptions = {}): string | null {
  const ok = sortVersions(versions).filter((s) => satisfies(s, range, opts));
  return ok.length ? ok[ok.length - 1] : null;
}

export function minSatisfying(versions: string[], range: string, opts: RangeOptions = {}): string | null {
  return sortVersions(versions).find((s) => satisfies(s, range, opts)) ?? null;
}

export type Bump = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';
export const BUMPS: Bump[] = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];

function incPre(ver: SemVer, id: string) {
  if (!ver.prerelease.length) ver.prerelease = [0];
  else {
    let i = ver.prerelease.length;
    while (--i >= 0) {
      const x = ver.prerelease[i];
      if (typeof x === 'number') {
        ver.prerelease[i] = x + 1;
        break;
      }
    }
    if (i === -1) ver.prerelease.push(0);
  }
  if (id) {
    if (ver.prerelease[0] === id) {
      if (typeof ver.prerelease[1] !== 'number') ver.prerelease = [id, 0];
    } else ver.prerelease = [id, 0];
  }
}

/** The version after a bump, following `npm version` / node-semver's inc(). */
export function bump(version: string, kind: Bump, preid = ''): string | null {
  const parsed = parseVersion(version);
  if (!parsed) return null;
  const ver: SemVer = { ...parsed, prerelease: [...parsed.prerelease], build: [] };
  const id = preid.trim();
  if (id && !new RegExp(`^${PRE_ID}$`).test(id)) return null;
  switch (kind) {
    case 'major':
      if (ver.minor !== 0 || ver.patch !== 0 || !ver.prerelease.length) ver.major++;
      ver.minor = 0;
      ver.patch = 0;
      ver.prerelease = [];
      break;
    case 'minor':
      if (ver.patch !== 0 || !ver.prerelease.length) ver.minor++;
      ver.patch = 0;
      ver.prerelease = [];
      break;
    case 'patch':
      if (!ver.prerelease.length) ver.patch++;
      ver.prerelease = [];
      break;
    case 'premajor':
      ver.major++;
      ver.minor = 0;
      ver.patch = 0;
      ver.prerelease = [];
      incPre(ver, id);
      break;
    case 'preminor':
      ver.minor++;
      ver.patch = 0;
      ver.prerelease = [];
      incPre(ver, id);
      break;
    case 'prepatch':
      ver.patch++;
      ver.prerelease = [];
      incPre(ver, id);
      break;
    case 'prerelease':
      if (!ver.prerelease.length) ver.patch++;
      incPre(ver, id);
      break;
  }
  return formatVersion(ver);
}
