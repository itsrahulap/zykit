// Unix permission maths: octal ↔ symbolic ↔ bits, chmod(1) symbolic expressions, umask.
// Pure logic, no DOM, so it's unit-testable in Node.

export const SETUID = 0o4000;
export const SETGID = 0o2000;
export const STICKY = 0o1000;

export type Who = 'u' | 'g' | 'o';
export type Perm = 'r' | 'w' | 'x';
export const WHO: Who[] = ['u', 'g', 'o'];
export const PERMS: Perm[] = ['r', 'w', 'x'];
const SHIFT: Record<Who, number> = { u: 6, g: 3, o: 0 };
const PERM_BIT: Record<Perm, number> = { r: 4, w: 2, x: 1 };

export const bitFor = (who: Who, perm: Perm) => PERM_BIT[perm] << SHIFT[who];

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** 3- or 4-digit octal: "755", "0755", "4755". */
export function parseOctal(input: string): Result<number> {
  const s = input.trim().replace(/^0o/i, '');
  if (!/^[0-7]{1,4}$/.test(s)) return { ok: false, error: 'Octal modes are 1–4 digits from 0 to 7, e.g. 755 or 4755.' };
  return { ok: true, value: parseInt(s, 8) };
}

export function toOctal(mode: number, digits: 3 | 4 = mode & 0o7000 ? 4 : 3): string {
  return (mode & 0o7777).toString(8).padStart(digits, '0');
}

/** "rwxr-sr-t" style, 9 characters. */
export function toSymbolic(mode: number): string {
  let s = '';
  for (const who of WHO) {
    const p = (mode >> SHIFT[who]) & 7;
    s += p & 4 ? 'r' : '-';
    s += p & 2 ? 'w' : '-';
    const x = p & 1;
    const special = who === 'u' ? mode & SETUID : who === 'g' ? mode & SETGID : mode & STICKY;
    const ch = who === 'o' ? 't' : 's';
    s += special ? (x ? ch : ch.toUpperCase()) : x ? 'x' : '-';
  }
  return s;
}

/** Parses "rwxr-xr-x" or an ls -l string like "-rwsr-xr-x" / "drwxrwxrwt". */
export function parseSymbolic(input: string): Result<{ mode: number; type?: string }> {
  let s = input.trim();
  let type: string | undefined;
  if (s.length === 11 && /[.+@]$/.test(s)) s = s.slice(0, 10); // SELinux / ACL / xattr marker
  if (s.length === 10) {
    type = s[0];
    if (!'-dlcbps'.includes(type)) return { ok: false, error: `“${type}” isn't a file type character (- d l c b p s).` };
    s = s.slice(1);
  }
  if (s.length !== 9) return { ok: false, error: 'Symbolic permissions are 9 characters, like rwxr-xr-x.' };
  let mode = 0;
  for (let i = 0; i < 3; i++) {
    const who = WHO[i];
    const [r, w, x] = s.slice(i * 3, i * 3 + 3);
    if (r !== 'r' && r !== '-') return { ok: false, error: `Position ${i * 3 + 1} must be r or -.` };
    if (w !== 'w' && w !== '-') return { ok: false, error: `Position ${i * 3 + 2} must be w or -.` };
    const specials = who === 'o' ? 'tT' : 'sS';
    if (!['x', '-', ...specials].includes(x)) return { ok: false, error: `Position ${i * 3 + 3} must be x, -, ${specials[0]} or ${specials[1]}.` };
    if (r === 'r') mode |= bitFor(who, 'r');
    if (w === 'w') mode |= bitFor(who, 'w');
    if (x === 'x' || x === specials[0]) mode |= bitFor(who, 'x');
    if (specials.includes(x)) mode |= who === 'u' ? SETUID : who === 'g' ? SETGID : STICKY;
  }
  return { ok: true, value: { mode, type } };
}

/** "-rwxr-xr-x" (or "d…" for a directory). */
export const lsString = (mode: number, dir = false) => (dir ? 'd' : '-') + toSymbolic(mode);

export interface ApplyOptions {
  /** X adds execute for directories. */
  isDir?: boolean;
  /** Clauses without u/g/o/a are masked by the umask, as chmod(1) does. */
  umask?: number;
}

/**
 * Applies a chmod(1) symbolic expression ("u+x,g-w,o=r", "a+rX", "u=rwx,go=u-w", "+t") or an
 * octal mode to `start`. Follows POSIX / GNU chmod semantics.
 */
export function applyChmod(start: number, expr: string, { isDir = false, umask = 0 }: ApplyOptions = {}): Result<number> {
  const s = expr.trim();
  if (!s) return { ok: false, error: 'Enter a mode like u+x,g-w or 755.' };
  if (/^[0-7]+$/.test(s)) return parseOctal(s);
  let mode = start & 0o7777;
  for (const clause of s.split(',')) {
    const m = /^([ugoa]*)((?:[+=-][rwxXstugo]*)+)$/.exec(clause.trim());
    if (!m) return { ok: false, error: `“${clause}” isn't a valid clause. Use [ugoa][+-=][rwxXst], e.g. u+x or go-w.` };
    const whoPart = m[1];
    const whos = new Set<Who>(whoPart.includes('a') || !whoPart ? WHO : ([...whoPart] as Who[]));
    const masked = !whoPart;
    const ops = m[2].match(/[+=-][rwxXstugo]*/g)!;
    for (const op of ops) {
      const kind = op[0];
      const perms = op.slice(1);
      if (/[ugo]/.test(perms) && /[rwxXst]/.test(perms)) return { ok: false, error: `“${op}” mixes copied permissions (u/g/o) with r/w/x.` };
      if (/[ugo]/.test(perms) && perms.length > 1) return { ok: false, error: `Copy from one class at a time (“${op}”).` };
      // Permission bits for one class (rwx in the low 3 bits) and the special bits requested.
      let rwx = 0;
      let special = 0;
      if (/^[ugo]$/.test(perms)) rwx = (mode >> SHIFT[perms as Who]) & 7;
      for (const p of perms) {
        if (p === 'r') rwx |= 4;
        else if (p === 'w') rwx |= 2;
        else if (p === 'x') rwx |= 1;
        else if (p === 'X' && (isDir || mode & 0o111)) rwx |= 1;
        else if (p === 's') special |= (whos.has('u') ? SETUID : 0) | (whos.has('g') ? SETGID : 0);
        else if (p === 't') special |= whos.has('o') ? STICKY : 0;
      }
      let bits = 0;
      for (const w of whos) bits |= rwx << SHIFT[w];
      if (masked) bits &= ~umask & 0o777;
      bits |= special;
      if (kind === '+') mode |= bits;
      else if (kind === '-') mode &= ~bits;
      else {
        let clear = 0;
        for (const w of whos) clear |= 7 << SHIFT[w];
        if (whos.has('u')) clear |= SETUID;
        if (whos.has('g') && !isDir) clear |= SETGID; // GNU keeps a directory's setgid on "="
        mode = (mode & ~clear) | bits;
      }
    }
  }
  return { ok: true, value: mode & 0o7777 };
}

/** Shortest symbolic form for the chmod command: "u=rwx,g=rx,o=rx", with "a=" when all match. */
export function toChmodSymbolic(mode: number): string {
  const part = (who: Who) => {
    let p = '';
    const bits = (mode >> SHIFT[who]) & 7;
    if (bits & 4) p += 'r';
    if (bits & 2) p += 'w';
    if (bits & 1) p += 'x';
    if (who === 'u' && mode & SETUID) p += 's';
    if (who === 'g' && mode & SETGID) p += 's';
    if (who === 'o' && mode & STICKY) p += 't';
    return p;
  };
  const [u, g, o] = WHO.map(part);
  if (u === g && g === o) return `a=${u}`;
  if (g === o) return `u=${u},go=${g}`;
  return `u=${u},g=${g},o=${o}`;
}

export interface UmaskResult {
  file: number;
  dir: number;
}

/** New files start from 666, directories from 777, minus the umask. */
export function applyUmask(umask: number): UmaskResult {
  return { file: 0o666 & ~umask, dir: 0o777 & ~umask };
}

export interface Preset {
  mode: number;
  label: string;
  use: string;
}

export const PRESETS: Preset[] = [
  { mode: 0o644, label: '644', use: 'Regular files: owner writes, everyone reads' },
  { mode: 0o755, label: '755', use: 'Programs and directories: owner writes, everyone runs/enters' },
  { mode: 0o600, label: '600', use: 'Private files (SSH keys, secrets)' },
  { mode: 0o700, label: '700', use: 'Private directories and scripts' },
  { mode: 0o640, label: '640', use: 'Owner writes, group reads, others nothing' },
  { mode: 0o775, label: '775', use: 'Shared group directories' },
  { mode: 0o1777, label: '1777', use: 'Shared temp directory (/tmp): sticky' },
  { mode: 0o777, label: '777', use: 'Everyone can do everything (avoid)' },
];

/** Plain-English warnings about risky modes. */
export function warnings(mode: number): string[] {
  const out: string[] = [];
  if ((mode & 0o777) === 0o777) out.push('777 lets every user on the system change or replace this file. Use 755 (or 775 for a shared group) instead.');
  else if (mode & 0o002) out.push('Others can write to this file. That is rarely what you want outside of shared directories with the sticky bit.');
  if (mode & SETUID) out.push('setuid: the program runs with the owner’s privileges. Only use it on trusted, audited binaries.');
  if (mode & SETGID) out.push('setgid: runs with the group’s privileges (on a directory, new files inherit its group).');
  if (mode & SETUID && !(mode & 0o100)) out.push('setuid is set but the owner can’t execute (shown as a capital S), so it has no effect.');
  return out;
}

export function describeMode(mode: number): string[] {
  const names: Record<Who, string> = { u: 'Owner', g: 'Group', o: 'Others' };
  return WHO.map((w) => {
    const bits = (mode >> SHIFT[w]) & 7;
    const can = [bits & 4 && 'read', bits & 2 && 'write', bits & 1 && 'execute'].filter(Boolean);
    return `${names[w]}: ${can.length ? can.join(', ') : 'no access'}`;
  });
}
