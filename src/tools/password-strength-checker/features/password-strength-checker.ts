// A zxcvbn-style password estimator, written from scratch. It finds the cheapest explanation of the
// password as a sequence of "patterns" (dictionary words, l33t, keyboard walks, repeats, sequences,
// dates) plus brute-forced leftovers, and turns the number of guesses that explanation implies into
// crack-time estimates. Pure and synchronous; dictionaries are passed in so they can be lazy-loaded.

export const MAX_ANALYSED = 100;
const BRUTE_FORCE_CARDINALITY = 10;
const MIN_GUESSES_BEFORE_GROWING_SEQUENCE = 10000;
const MIN_SUBMATCH_GUESSES_SINGLE_CHAR = 10;
const MIN_SUBMATCH_GUESSES_MULTI_CHAR = 50;
const REFERENCE_YEAR = 2026;
const MIN_YEAR_SPACE = 20;

export type Pattern = 'dictionary' | 'spatial' | 'repeat' | 'sequence' | 'date' | 'year' | 'bruteforce';

export interface Match {
  pattern: Pattern;
  i: number;
  j: number;
  token: string;
  guesses: number;
  // dictionary
  dictionary?: string;
  rank?: number;
  reversed?: boolean;
  l33t?: boolean;
  subs?: Record<string, string>;
  // spatial
  graph?: string;
  turns?: number;
  shifted?: number;
  // repeat
  base?: string;
  count?: number;
  // sequence
  sequenceName?: string;
  ascending?: boolean;
  // date
  separator?: string;
}

export type Dicts = Record<string, Map<string, number>>;

/** Build rank maps (word to 1-based rank). Earlier in a list is more common. */
export function buildDicts(lists: Record<string, readonly string[]>): Dicts {
  const out: Dicts = {};
  for (const [name, list] of Object.entries(lists)) {
    const m = new Map<string, number>();
    list.forEach((w, idx) => {
      const k = w.toLowerCase();
      if (k && !m.has(k)) m.set(k, idx + 1);
    });
    out[name] = m;
  }
  return out;
}

// ---------- helpers ----------

function nCk(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0) return 1;
  let r = 1;
  for (let d = 1; d <= k; d++) {
    r *= n;
    r /= d;
    n -= 1;
  }
  return r;
}

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

const isUpper = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase();
const isLower = (c: string) => c !== c.toUpperCase() && c === c.toLowerCase();

// ---------- keyboards ----------

interface Graph {
  name: string;
  adj: Map<string, string[][]>; // char to its neighbouring keys (each key's plain and shifted char)
  shiftedChars: Set<string>;
  starts: number;
  degree: number;
}

function buildKeyboard(name: string, rows: [string, string, number][], diagonalRule: 'stagger' | 'grid'): Graph {
  // rows: [unshifted keys, shifted keys, x offset]
  type Key = { chars: [string, string]; x: number; y: number };
  const keys: Key[] = [];
  rows.forEach(([plain, shifted, off], y) => {
    for (let c = 0; c < plain.length; c++) keys.push({ chars: [plain[c], shifted[c] ?? plain[c]], x: c + off, y });
  });
  const adj = new Map<string, string[][]>();
  const shiftedChars = new Set<string>();
  const neighbours = (k: Key): Key[] =>
    keys.filter((o) => {
      if (o === k) return false;
      const dx = Math.abs(o.x - k.x);
      const dy = Math.abs(o.y - k.y);
      if (diagonalRule === 'grid') return dx <= 1 && dy <= 1;
      return (dy === 0 && dx === 1) || (dy === 1 && dx < 1);
    });
  for (const k of keys) {
    const ns = neighbours(k);
    for (const [idx, ch] of k.chars.entries()) {
      adj.set(ch, ns.map((n) => n.chars));
      if (idx === 1 && k.chars[1] !== k.chars[0]) shiftedChars.add(ch);
    }
  }
  let degree = 0;
  for (const k of keys) degree += neighbours(k).length;
  return { name, adj, shiftedChars, starts: keys.length, degree: degree / keys.length };
}

const GRAPHS: Graph[] = [
  buildKeyboard(
    'qwerty',
    [
      ['`1234567890-=', '~!@#$%^&*()_+', 0],
      ['qwertyuiop[]\\', 'QWERTYUIOP{}|', 0.5],
      ["asdfghjkl;'", 'ASDFGHJKL:"', 0.75],
      ['zxcvbnm,./', 'ZXCVBNM<>?', 1.25],
    ],
    'stagger',
  ),
  buildKeyboard(
    'azerty',
    [
      ['1234567890', '1234567890', 0],
      ['azertyuiop', 'AZERTYUIOP', 0.5],
      ['qsdfghjklm', 'QSDFGHJKLM', 0.75],
      ['wxcvbn,;:!', 'WXCVBN?./§', 1.25],
    ],
    'stagger',
  ),
  buildKeyboard(
    'keypad',
    [
      ['789', '789', 0],
      ['456', '456', 0],
      ['123', '123', 0],
      ['0', '0', 1], // "0" sits under 1 and 2
    ],
    'grid',
  ),
];

// ---------- matchers ----------

const L33T: Record<string, string[]> = {
  a: ['4', '@'],
  b: ['8'],
  c: ['(', '{', '[', '<'],
  e: ['3'],
  g: ['6', '9'],
  i: ['1', '!', '|'],
  l: ['1', '|', '7'],
  o: ['0'],
  s: ['$', '5'],
  t: ['+', '7'],
  x: ['%'],
  z: ['2'],
};

function dictionaryMatches(pw: string, dicts: Dicts): Match[] {
  const lower = pw.toLowerCase();
  const out: Match[] = [];
  const n = pw.length;
  for (const [dname, dict] of Object.entries(dicts)) {
    for (let i = 0; i < n; i++) {
      for (let j = i; j < Math.min(n, i + 40); j++) {
        const word = lower.slice(i, j + 1);
        const rank = dict.get(word);
        if (rank) out.push({ pattern: 'dictionary', i, j, token: pw.slice(i, j + 1), dictionary: dname, rank, guesses: 0 });
      }
    }
  }
  return out;
}

function reversedMatches(pw: string, dicts: Dicts): Match[] {
  const rev = [...pw].reverse().join('');
  const n = pw.length;
  return dictionaryMatches(rev, dicts)
    .map((m) => ({ ...m, i: n - 1 - m.j, j: n - 1 - m.i, token: [...m.token].reverse().join(''), reversed: true }))
    .filter((m) => m.token.length >= 3);
}

function l33tTables(pw: string): Record<string, string>[] {
  // Which l33t characters appear, and which letters they could stand for.
  const present: Record<string, string[]> = {};
  for (const [letter, subs] of Object.entries(L33T)) for (const s of subs) if (pw.includes(s)) (present[s] ??= []).push(letter);
  const chars = Object.keys(present);
  let tables: Record<string, string>[] = [{}];
  for (const ch of chars) {
    const next: Record<string, string>[] = [];
    for (const t of tables) {
      next.push(t); // the char is just itself
      for (const letter of present[ch]) next.push({ ...t, [ch]: letter });
    }
    tables = next.length > 64 ? next.slice(0, 64) : next;
  }
  return tables.filter((t) => Object.keys(t).length > 0);
}

function l33tMatches(pw: string, dicts: Dicts): Match[] {
  const out: Match[] = [];
  for (const table of l33tTables(pw)) {
    const translated = [...pw].map((c) => table[c] ?? c).join('');
    for (const m of dictionaryMatches(translated, dicts)) {
      const token = pw.slice(m.i, m.j + 1);
      const subs: Record<string, string> = {};
      for (const c of token) if (table[c]) subs[c] = table[c];
      if (Object.keys(subs).length === 0 || token.length < 3) continue;
      out.push({ ...m, token, l33t: true, subs });
    }
  }
  return out;
}

function spatialMatches(pw: string): Match[] {
  const out: Match[] = [];
  for (const g of GRAPHS) {
    let i = 0;
    while (i < pw.length - 1) {
      let j = i + 1;
      let lastDir = -2;
      let turns = 0;
      let shifted = g.shiftedChars.has(pw[i]) ? 1 : 0;
      for (;;) {
        const prev = pw[j - 1];
        const ns = g.adj.get(prev) ?? [];
        let found = false;
        if (j < pw.length) {
          const cur = pw[j];
          const d = ns.findIndex((chars) => chars.includes(cur));
          if (d >= 0) {
            found = true;
            if (g.shiftedChars.has(cur)) shifted++;
            if (lastDir !== d) {
              turns++;
              lastDir = d;
            }
          }
        }
        if (found) {
          j++;
          continue;
        }
        if (j - i > 2) out.push({ pattern: 'spatial', i, j: j - 1, token: pw.slice(i, j), graph: g.name, turns, shifted, guesses: 0 });
        i = j;
        break;
      }
    }
  }
  return out;
}

function repeatMatches(pw: string, dicts: Dicts): Match[] {
  const out: Match[] = [];
  const n = pw.length;
  let i = 0;
  while (i < n - 1) {
    let best: { len: number; count: number } | null = null;
    for (let len = 1; len <= (n - i) >> 1; len++) {
      const base = pw.slice(i, i + len);
      let count = 1;
      while (pw.startsWith(base, i + count * len)) count++;
      if (count >= 2 && (!best || len * count > best.len * best.count)) best = { len, count };
    }
    if (best) {
      const token = pw.slice(i, i + best.len * best.count);
      const base = pw.slice(i, i + best.len);
      const inner = mostGuessable(base, omnimatch(base, dicts), false);
      out.push({ pattern: 'repeat', i, j: i + token.length - 1, token, base, count: best.count, guesses: inner.guesses });
      i += token.length;
    } else i++;
  }
  return out;
}

const SEQUENCES: [string, string][] = [
  ['lower', 'abcdefghijklmnopqrstuvwxyz'],
  ['upper', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  ['digits', '0123456789'],
];

function sequenceMatches(pw: string): Match[] {
  const out: Match[] = [];
  const n = pw.length;
  let i = 0;
  while (i < n - 1) {
    let delta = 0;
    let j = i + 1;
    const d0 = pw.charCodeAt(j) - pw.charCodeAt(i);
    if (Math.abs(d0) >= 1 && Math.abs(d0) <= 5) {
      delta = d0;
      while (j + 1 < n && pw.charCodeAt(j + 1) - pw.charCodeAt(j) === delta) j++;
    }
    if (delta && j - i >= 2) {
      const token = pw.slice(i, j + 1);
      const seq = SEQUENCES.find(([, chars]) => chars.includes(pw[i]) && [...token].every((c) => chars.includes(c)));
      const name = seq ? seq[0] : 'unicode';
      out.push({ pattern: 'sequence', i, j, token, sequenceName: name, ascending: delta > 0, guesses: 0 });
      i = j;
    } else i++;
  }
  return out;
}

interface DMY {
  day: number;
  month: number;
  year: number;
}

function validDMY(a: number, b: number, c: number): DMY | null {
  // Candidates for (day, month, year) from three numbers in some order.
  if (b > 31 || b <= 0) return null;
  let over12 = 0;
  let over31 = 0;
  let under1 = 0;
  for (const x of [a, b, c]) {
    if ((x > 99 && x < 1000) || x > 2099) return null;
    if (x > 31) over31++;
    if (x > 12) over12++;
    if (x <= 0) under1++;
  }
  if (over31 >= 2 || over12 === 3 || under1 >= 2) return null;
  const splits: [number, [number, number]][] = [
    [c, [a, b]],
    [a, [b, c]],
  ];
  for (const [y, [p, q]] of splits) {
    if (y >= 1000 && y <= 2099) {
      for (const [d, m] of [
        [p, q],
        [q, p],
      ]) {
        if (d >= 1 && d <= 31 && m >= 1 && m <= 12) return { day: d, month: m, year: y };
      }
    }
  }
  for (const [y, [p, q]] of splits) {
    if (y >= 0 && y <= 99) {
      for (const [d, m] of [
        [p, q],
        [q, p],
      ]) {
        if (d >= 1 && d <= 31 && m >= 1 && m <= 12) return { day: d, month: m, year: y < 50 ? 2000 + y : 1900 + y };
      }
    }
  }
  return null;
}

function dateMatches(pw: string): Match[] {
  const out: Match[] = [];
  const n = pw.length;
  for (let i = 0; i + 4 <= n; i++) {
    for (let j = i + 3; j < Math.min(n, i + 8 + 2); j++) {
      const token = pw.slice(i, j + 1);
      const sep = /^(\d{1,4})([\s/\\_.-])(\d{1,2})\2(\d{1,4})$/.exec(token);
      let dmy: DMY | null = null;
      let separator = '';
      if (sep) {
        dmy = validDMY(+sep[1], +sep[3], +sep[4]);
        separator = sep[2];
      } else if (/^\d{4,8}$/.test(token)) {
        const L = token.length;
        const cuts: [number, number][] = [];
        for (let a = 1; a <= 4; a++) for (let b = a + 1; b < L && b - a <= 4 && L - b <= 4; b++) cuts.push([a, b]);
        let bestDist = Infinity;
        for (const [a, b] of cuts) {
          const c = validDMY(+token.slice(0, a), +token.slice(a, b), +token.slice(b));
          if (c) {
            const dist = Math.abs(c.year - REFERENCE_YEAR);
            if (dist < bestDist) {
              bestDist = dist;
              dmy = c;
            }
          }
        }
      }
      if (dmy) out.push({ pattern: 'date', i, j, token, separator, guesses: dateGuesses(dmy.year, separator) });
    }
  }
  // Drop dates fully inside a longer date.
  return out.filter((m) => !out.some((o) => o !== m && o.i <= m.i && o.j >= m.j && o.j - o.i > m.j - m.i));
}

function dateGuesses(year: number, separator: string): number {
  const space = Math.max(Math.abs(year - REFERENCE_YEAR), MIN_YEAR_SPACE);
  return space * 365 * (separator ? 4 : 1);
}

function yearMatches(pw: string): Match[] {
  const out: Match[] = [];
  const re = /(?=((?:19|20)\d\d))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pw))) {
    out.push({ pattern: 'year', i: m.index, j: m.index + 3, token: m[1], guesses: 0 });
    re.lastIndex = m.index + 1;
  }
  return out;
}

export function omnimatch(pw: string, dicts: Dicts): Match[] {
  const all = [
    ...dictionaryMatches(pw, dicts),
    ...reversedMatches(pw, dicts),
    ...l33tMatches(pw, dicts),
    ...spatialMatches(pw),
    ...repeatMatches(pw, dicts),
    ...sequenceMatches(pw),
    ...yearMatches(pw),
    ...dateMatches(pw),
  ];
  return all.sort((a, b) => a.i - b.i || a.j - b.j);
}

// ---------- guess estimation ----------

function uppercaseVariations(token: string): number {
  if (/^[^A-Z]+$/.test(token) || token === token.toLowerCase()) return 1;
  const startUpper = /^[A-Z][^A-Z]+$/;
  const endUpper = /^[^A-Z]+[A-Z]$/;
  const allUpper = /^[^a-z]+$/;
  if (startUpper.test(token) || endUpper.test(token) || allUpper.test(token)) return 2;
  let U = 0;
  let L = 0;
  for (const c of token) {
    if (isUpper(c)) U++;
    else if (isLower(c)) L++;
  }
  let v = 0;
  for (let i = 1; i <= Math.min(U, L); i++) v += nCk(U + L, i);
  return Math.max(v, 2);
}

function l33tVariations(m: Match): number {
  if (!m.l33t || !m.subs) return 1;
  let v = 1;
  const lower = m.token.toLowerCase();
  for (const [subbed, letter] of Object.entries(m.subs)) {
    const S = [...lower].filter((c) => c === subbed).length;
    const U = [...lower].filter((c) => c === letter).length;
    if (S === 0 || U === 0) v *= 2;
    else {
      let p = 0;
      for (let i = 1; i <= Math.min(U, S); i++) p += nCk(U + S, i);
      v *= p;
    }
  }
  return v;
}

function estimateGuesses(m: Match, password: string): number {
  if (m.guesses > 0 && m.pattern !== 'dictionary') return finish(m, m.guesses, password);
  let g: number;
  switch (m.pattern) {
    case 'dictionary':
      g = (m.rank ?? 1) * uppercaseVariations(m.token) * l33tVariations(m) * (m.reversed ? 2 : 1);
      break;
    case 'spatial': {
      const graph = GRAPHS.find((x) => x.name === m.graph)!;
      const L = m.token.length;
      const t = m.turns ?? 1;
      let total = 0;
      for (let i = 2; i <= L; i++) {
        const possible = Math.min(t, i - 1);
        for (let j = 1; j <= possible; j++) total += nCk(i - 1, j - 1) * graph.starts * Math.pow(graph.degree, j);
      }
      const S = m.shifted ?? 0;
      if (S > 0) {
        const U = L - S;
        if (U === 0) total *= 2;
        else {
          let v = 0;
          for (let i = 1; i <= Math.min(S, U); i++) v += nCk(S + U, i);
          total *= v;
        }
      }
      g = total;
      break;
    }
    case 'sequence': {
      const first = m.token[0];
      let base: number;
      if (['a', 'A', 'z', 'Z', '0', '1', '9'].includes(first)) base = 4;
      else if (/\d/.test(first)) base = 10;
      else base = 26;
      if (!m.ascending) base *= 2;
      g = base * m.token.length;
      break;
    }
    case 'year':
      g = Math.max(Math.abs(+m.token - REFERENCE_YEAR), MIN_YEAR_SPACE);
      break;
    case 'bruteforce':
      g = Math.pow(BRUTE_FORCE_CARDINALITY, m.token.length);
      break;
    default:
      g = m.guesses;
  }
  return finish(m, g, password);
}

function finish(m: Match, g: number, password: string): number {
  const min = m.token.length < password.length ? (m.token.length === 1 ? MIN_SUBMATCH_GUESSES_SINGLE_CHAR : MIN_SUBMATCH_GUESSES_MULTI_CHAR) : 1;
  const out = Math.max(g, min);
  m.guesses = out;
  return out;
}

/** Minimum-guesses decomposition (Viterbi-style DP over match sequences). */
export function mostGuessable(password: string, matches: Match[], excludeAdditive: boolean): { guesses: number; sequence: Match[] } {
  const n = password.length;
  if (n === 0) return { guesses: 1, sequence: [] };
  const byEnd: Match[][] = Array.from({ length: n }, () => []);
  for (const m of matches) byEnd[m.j]?.push(m);
  for (const list of byEnd) list.sort((a, b) => a.i - b.i);
  const best: { m: Map<number, Match>; pi: Map<number, number>; g: Map<number, number> }[] = Array.from({ length: n }, () => ({
    m: new Map(),
    pi: new Map(),
    g: new Map(),
  }));
  const update = (m: Match, l: number) => {
    const k = m.j;
    let pi = estimateGuesses(m, password);
    if (l > 1) pi *= best[m.i - 1].pi.get(l - 1)!;
    let g = factorial(l) * pi;
    if (!excludeAdditive) g += Math.pow(MIN_GUESSES_BEFORE_GROWING_SEQUENCE, l - 1);
    for (const [competing, cg] of best[k].g) if (competing <= l && cg <= g) return;
    best[k].g.set(l, g);
    best[k].m.set(l, m);
    best[k].pi.set(l, pi);
  };
  const bf = (i: number, j: number): Match => ({ pattern: 'bruteforce', i, j, token: password.slice(i, j + 1), guesses: 0 });
  for (let k = 0; k < n; k++) {
    for (const m of byEnd[k]) {
      if (m.i > 0) for (const l of [...best[m.i - 1].m.keys()]) update(m, l + 1);
      else update(m, 1);
    }
    update(bf(0, k), 1);
    for (let i = 1; i <= k; i++) {
      for (const [l, last] of [...best[i - 1].m.entries()]) {
        if (last.pattern === 'bruteforce') continue;
        update(bf(i, k), l + 1);
      }
    }
  }
  let bestL = 0;
  let bestG = Infinity;
  for (const [l, g] of best[n - 1].g) {
    if (g < bestG) {
      bestG = g;
      bestL = l;
    }
  }
  const sequence: Match[] = [];
  let k = n - 1;
  let l = bestL;
  while (k >= 0 && l > 0) {
    const m = best[k].m.get(l)!;
    sequence.unshift(m);
    k = m.i - 1;
    l--;
  }
  return { guesses: bestG, sequence };
}

// ---------- crack times ----------

export interface Scenario {
  id: 'online-throttled' | 'online' | 'offline-slow' | 'offline-fast';
  label: string;
  rate: number; // guesses per second
  note: string;
}

export const SCENARIOS: Scenario[] = [
  { id: 'online-throttled', label: 'Online, throttled', rate: 100 / 3600, note: '100 guesses per hour: a login form with rate limiting.' },
  { id: 'online', label: 'Online, unthrottled', rate: 10, note: '10 guesses per second: a login form with no limit.' },
  { id: 'offline-slow', label: 'Offline, slow hash', rate: 1e4, note: '10,000 guesses per second per hash: bcrypt, scrypt or Argon2.' },
  { id: 'offline-fast', label: 'Offline, fast hash', rate: 1e10, note: '10 billion guesses per second: MD5 or SHA-1 on GPUs.' },
];

export function humanTime(seconds: number): string {
  if (!isFinite(seconds)) return 'centuries';
  if (seconds < 1) return 'less than a second';
  const units: [string, number][] = [
    ['second', 1],
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['month', 86400 * 31],
    ['year', 86400 * 365],
  ];
  if (seconds >= 86400 * 365 * 100) return 'centuries';
  let unit = units[0];
  for (const u of units) if (seconds >= u[1]) unit = u;
  const v = Math.round(seconds / unit[1]);
  return `${v} ${unit[0]}${v === 1 ? '' : 's'}`;
}

export function scoreFromGuesses(guesses: number): 0 | 1 | 2 | 3 | 4 {
  if (guesses < 1e3 + 5) return 0;
  if (guesses < 1e6 + 5) return 1;
  if (guesses < 1e8 + 5) return 2;
  if (guesses < 1e10 + 5) return 3;
  return 4;
}

export const SCORE_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const;

// ---------- feedback ----------

export interface Feedback {
  warning: string;
  suggestions: string[];
}

function matchFeedback(m: Match, isSole: boolean): Feedback | null {
  switch (m.pattern) {
    case 'dictionary': {
      let warning = '';
      const rank = m.rank ?? 0;
      if (m.dictionary === 'passwords') {
        if (isSole && !m.l33t && !m.reversed) warning = rank <= 10 ? 'This is a top-10 common password.' : rank <= 100 ? 'This is a top-100 common password.' : 'This is a very common password.';
        else if (isSole) warning = 'This is similar to a commonly used password.';
      } else if (m.dictionary === 'custom') warning = 'This contains one of your own words, which an attacker who knows you would try first.';
      else if (m.dictionary === 'names') warning = isSole ? 'Names and surnames by themselves are easy to guess.' : 'Common names and surnames are easy to guess.';
      else if (isSole) warning = 'A single word is easy to guess.';
      const suggestions: string[] = [];
      if (/^[A-Z][^A-Z]+$/.test(m.token)) suggestions.push("Capitalising the first letter doesn't help much.");
      else if (m.token === m.token.toUpperCase() && /[A-Z]/.test(m.token)) suggestions.push('All-uppercase is almost as easy to guess as all-lowercase.');
      if (m.reversed && m.token.length >= 4) suggestions.push("Reversed words aren't much harder to guess.");
      if (m.l33t) suggestions.push("Predictable substitutions like '@' for 'a' don't help much.");
      return { warning, suggestions };
    }
    case 'spatial':
      return {
        warning: (m.turns ?? 1) === 1 ? 'Straight rows of keys are easy to guess.' : 'Short keyboard patterns are easy to guess.',
        suggestions: ['Use a longer keyboard pattern with more turns.'],
      };
    case 'repeat':
      return {
        warning: (m.base ?? '').length === 1 ? 'Repeats like "aaa" are easy to guess.' : 'Repeats like "abcabcabc" are only slightly harder to guess than "abc".',
        suggestions: ['Avoid repeated words and characters.'],
      };
    case 'sequence':
      return { warning: 'Sequences like "abc" or "6543" are easy to guess.', suggestions: ['Avoid sequences.'] };
    case 'year':
      return { warning: 'Recent years are easy to guess.', suggestions: ['Avoid recent years and years associated with you.'] };
    case 'date':
      return { warning: 'Dates are often easy to guess.', suggestions: ['Avoid dates and years that are associated with you.'] };
    default:
      return null;
  }
}

export function buildFeedback(password: string, sequence: Match[], score: number): Feedback {
  if (!password) return { warning: '', suggestions: [] };
  const suggestions: string[] = [];
  let warning = '';
  if (sequence.length > 0 && score <= 3) {
    const real = sequence.filter((m) => m.pattern !== 'bruteforce');
    const longest = (real.length ? real : sequence).reduce((a, b) => (b.token.length > a.token.length ? b : a));
    const fb = matchFeedback(longest, sequence.length === 1);
    if (fb) {
      warning = fb.warning;
      suggestions.push(...fb.suggestions);
    }
    for (const m of real) {
      if (m === longest) continue;
      const other = matchFeedback(m, false);
      if (other) for (const s of other.suggestions) if (!suggestions.includes(s)) suggestions.push(s);
    }
  }
  if (score <= 2) {
    suggestions.unshift(password.length < 12 ? 'Make it longer: add another word or two. Uncommon words are better.' : 'Add another word or two. Uncommon words are better.');
  }
  if (score <= 3 && sequence.every((m) => m.pattern === 'bruteforce') && password.length < 12) suggestions.push('Four or more random words, or a 14+ character random string, is much harder to crack.');
  return { warning, suggestions: [...new Set(suggestions)] };
}

// ---------- public API ----------

export interface Analysis {
  password: string;
  truncated: boolean;
  guesses: number;
  log10: number;
  bits: number;
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  sequence: Match[];
  crackTimes: { scenario: Scenario; seconds: number; display: string }[];
  feedback: Feedback;
}

export function analyse(password: string, dicts: Dicts, custom: readonly string[] = []): Analysis {
  const truncated = password.length > MAX_ANALYSED;
  const pw = truncated ? password.slice(0, MAX_ANALYSED) : password;
  if (!pw) {
    return { password, truncated: false, guesses: 1, log10: 0, bits: 0, score: 0, label: SCORE_LABELS[0], sequence: [], crackTimes: [], feedback: { warning: '', suggestions: [] } };
  }
  const all = custom.length ? { ...dicts, custom: buildDicts({ custom: custom.map((w) => w.toLowerCase()) }).custom } : dicts;
  const { guesses, sequence } = mostGuessable(pw, omnimatch(pw, all), false);
  const score = scoreFromGuesses(guesses);
  const crackTimes = SCENARIOS.map((scenario) => {
    const seconds = guesses / scenario.rate;
    return { scenario, seconds, display: humanTime(seconds) };
  });
  return {
    password,
    truncated,
    guesses,
    log10: Math.log10(guesses),
    bits: Math.log2(guesses),
    score,
    label: SCORE_LABELS[score],
    sequence,
    crackTimes,
    feedback: buildFeedback(pw, sequence, score),
  };
}

export function describeMatch(m: Match): string {
  switch (m.pattern) {
    case 'dictionary': {
      const kind = m.dictionary === 'passwords' ? 'common password' : m.dictionary === 'names' ? 'common name' : m.dictionary === 'custom' ? 'your own word' : 'common word';
      return `${kind}, rank ${m.rank?.toLocaleString('en')}${m.l33t ? ', l33t substitutions' : ''}${m.reversed ? ', reversed' : ''}`;
    }
    case 'spatial':
      return `keyboard pattern (${m.graph}, ${m.turns} turn${m.turns === 1 ? '' : 's'})`;
    case 'repeat':
      return `"${m.base}" repeated ${m.count} times`;
    case 'sequence':
      return `${m.ascending ? 'ascending' : 'descending'} ${m.sequenceName} sequence`;
    case 'year':
      return 'recent year';
    case 'date':
      return 'date';
    default:
      return 'no pattern found (brute force)';
  }
}

export function parseCustomWords(text: string): string[] {
  return [...new Set(text.split(/[\s,;]+/).map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 2))].slice(0, 200);
}
