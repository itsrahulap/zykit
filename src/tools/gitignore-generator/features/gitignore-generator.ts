// .gitignore generation (merge and dedupe templates) and a matcher that follows git's rules:
// negation, anchoring, directory-only patterns, **, *, ?, [ ], escapes, last match wins, and a
// file inside an excluded directory can never be re-included.

import { TEMPLATES, type Template } from './templates';

export { GROUPS, TEMPLATES } from './templates';
export type { Template } from './templates';

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));
export const templateById = (id: string): Template | undefined => byId.get(id);

export const MAX_RULE_LINES = 20_000;
export const MAX_PATHS = 2_000;

/** Templates whose name, id or group contains every word of `query`. */
export function searchTemplates(query: string, list: Template[] = TEMPLATES): Template[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  return list.filter((t) => {
    const hay = `${t.name} ${t.id} ${t.group}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export interface MergeResult {
  text: string;
  /** Number of pattern lines dropped because an earlier section already had them. */
  duplicates: number;
}

/**
 * Joins the chosen templates (in the order given) under `# === Name ===` headers. A pattern
 * that appeared in an earlier section (or custom) is omitted; comments and blank lines are kept.
 */
export function merge(ids: string[], custom = ''): MergeResult {
  const seen = new Set<string>();
  const sections: string[] = [];
  let duplicates = 0;
  const section = (title: string, body: string) => {
    const lines: string[] = [];
    for (const raw of body.split(/\r?\n/)) {
      const line = raw.replace(/[ \t]+$/, '');
      if (!line.trim()) continue;
      if (line.startsWith('#')) {
        lines.push(line);
        continue;
      }
      if (seen.has(line)) {
        duplicates++;
        continue;
      }
      seen.add(line);
      lines.push(line);
    }
    if (lines.some((l) => !l.startsWith('#'))) sections.push(`# === ${title} ===\n${lines.join('\n')}`);
  };
  const used = new Set<string>();
  for (const id of ids) {
    const t = byId.get(id);
    if (!t || used.has(id)) continue;
    used.add(id);
    section(t.name, t.body);
  }
  if (custom.trim()) section('Custom', custom);
  return { text: sections.length ? sections.join('\n\n') + '\n' : '', duplicates };
}

// ---- matcher ----

export interface Rule {
  /** 1-based line in the source text. */
  line: number;
  text: string;
  negated: boolean;
  dirOnly: boolean;
  /** Matches the full path (has a slash before its end); otherwise matches the name at any depth. */
  anchored: boolean;
  re: RegExp;
}

const POSIX: Record<string, string> = {
  alpha: 'a-zA-Z',
  digit: '0-9',
  alnum: 'a-zA-Z0-9',
  upper: 'A-Z',
  lower: 'a-z',
  space: ' \\t\\n\\r\\f\\v',
  punct: '!-\\/:-@\\[-`{-~',
  xdigit: '0-9A-Fa-f',
};
const escRe = (c: string) => c.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');

/** Glob → regex source (no anchors). `**` handling follows gitignore: only between slashes. */
export function globToRegex(glob: string): string {
  let out = '';
  let i = 0;
  const n = glob.length;
  while (i < n) {
    const c = glob[i];
    if (c === '\\') {
      if (i + 1 < n) out += escRe(glob[i + 1]);
      i += 2;
    } else if (c === '*') {
      let j = i;
      while (glob[j] === '*') j++;
      const atStart = i === 0 || glob[i - 1] === '/';
      const double = j - i >= 2 && atStart;
      if (double && j === n) out += '.*';
      else if (double && glob[j] === '/') {
        out += '(?:.*/)?';
        j++;
      } else out += '[^/]*';
      i = j;
    } else if (c === '?') {
      out += '[^/]';
      i++;
    } else if (c === '[') {
      let j = i + 1;
      if (glob[j] === '!' || glob[j] === '^') j++;
      if (glob[j] === ']') j++;
      while (j < n && glob[j] !== ']') {
        if (glob[j] === '[' && glob[j + 1] === ':') {
          const end = glob.indexOf(':]', j + 2);
          if (end !== -1) j = end + 2;
          else j++;
        } else j += glob[j] === '\\' ? 2 : 1;
      }
      if (j >= n) {
        out += '\\[';
        i++;
        continue;
      }
      let body = glob.slice(i + 1, j);
      let neg = '';
      if (body[0] === '!' || body[0] === '^') {
        neg = '^';
        body = body.slice(1);
      }
      let cls = '';
      for (let k = 0; k < body.length; k++) {
        const ch = body[k];
        if (ch === '[' && body[k + 1] === ':') {
          const end = body.indexOf(':]', k + 2);
          const name = end === -1 ? '' : body.slice(k + 2, end);
          if (POSIX[name]) {
            cls += POSIX[name];
            k = end + 1;
            continue;
          }
        }
        if (ch === '\\' && k + 1 < body.length) cls += escRe(body[++k]);
        else if (ch === '-' ) cls += '-';
        else cls += escRe(ch);
      }
      out += cls ? `[${neg}${cls}${neg ? '/' : ''}]` : neg ? '[^/]' : '(?!)';
      i = j + 1;
    } else {
      out += escRe(c);
      i++;
    }
  }
  return out;
}

/** Parses .gitignore text into rules. Blank lines and comments are skipped. */
export function parseRules(text: string, ignoreCase = false): Rule[] {
  const rules: Rule[] = [];
  const lines = text.split(/\r?\n/);
  for (let idx = 0; idx < lines.length && idx < MAX_RULE_LINES; idx++) {
    let p = lines[idx];
    // Trailing spaces are dropped unless escaped with a backslash.
    p = p.replace(/(?<!\\)[ ]+$/, '');
    if (!p || p.startsWith('#')) continue;
    const original = lines[idx];
    let negated = false;
    if (p.startsWith('!')) {
      negated = true;
      p = p.slice(1);
    }
    let dirOnly = false;
    if (p.endsWith('/') && !p.endsWith('\\/')) {
      dirOnly = true;
      p = p.replace(/\/+$/, '');
    }
    if (!p) continue;
    const anchored = p.includes('/');
    if (p.startsWith('/')) p = p.slice(1);
    if (!p) continue;
    try {
      rules.push({ line: idx + 1, text: original.trim(), negated, dirOnly, anchored, re: new RegExp(`^${globToRegex(p)}$`, ignoreCase ? 'i' : '') });
    } catch {
      // an unparsable pattern is ignored, as git ignores patterns it cannot use
    }
  }
  return rules;
}

function ruleMatches(rule: Rule, path: string, isDir: boolean): boolean {
  if (rule.dirOnly && !isDir) return false;
  const subject = rule.anchored ? path : path.slice(path.lastIndexOf('/') + 1);
  return rule.re.test(subject);
}

/** Last matching rule wins; returns it, or null when none matches. */
function lastMatch(rules: Rule[], path: string, isDir: boolean): Rule | null {
  for (let i = rules.length - 1; i >= 0; i--) if (ruleMatches(rules[i], path, isDir)) return rules[i];
  return null;
}

export interface PathResult {
  path: string;
  isDir: boolean;
  ignored: boolean;
  /** The deciding rule: the ignoring rule, or the `!` rule that re-included it. */
  rule: Rule | null;
  /** When an excluded parent directory decided the result, that directory. */
  parent: string | null;
}

export function normalizePath(raw: string): { path: string; isDir: boolean } | null {
  let p = raw.trim().replace(/\\/g, '/');
  if (!p) return null;
  const isDir = p.endsWith('/');
  p = p.replace(/^(\.\/)+/, '').replace(/^\/+/, '').replace(/\/+/g, '/').replace(/\/$/, '');
  return p ? { path: p, isDir } : null;
}

/**
 * Tests one path against parsed rules. A path ending in "/" is a directory. Parent directories
 * are checked first, outermost first: once one is excluded, nothing below it can be re-included.
 */
export function testPath(rules: Rule[], raw: string): PathResult | null {
  const n = normalizePath(raw);
  if (!n) return null;
  const parts = n.path.split('/');
  for (let i = 1; i < parts.length; i++) {
    const dir = parts.slice(0, i).join('/');
    const r = lastMatch(rules, dir, true);
    if (r && !r.negated) return { path: n.path, isDir: n.isDir, ignored: true, rule: r, parent: dir };
  }
  const r = lastMatch(rules, n.path, n.isDir);
  return { path: n.path, isDir: n.isDir, ignored: !!r && !r.negated, rule: r, parent: null };
}

export function testPaths(gitignore: string, pathsText: string, ignoreCase = false): PathResult[] {
  const rules = parseRules(gitignore, ignoreCase);
  const out: PathResult[] = [];
  for (const line of pathsText.split(/\r?\n/).slice(0, MAX_PATHS)) {
    const r = testPath(rules, line);
    if (r) out.push(r);
  }
  return out;
}

export const SAMPLE_PATHS = `node_modules/react/index.js
src/index.ts
dist/app.js
.env
.env.example
.vscode/settings.json
.vscode/launch.json
.DS_Store
docs/notes.log`;
