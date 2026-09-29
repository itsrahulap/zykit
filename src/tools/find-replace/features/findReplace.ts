// Find & replace with plain text or regular expressions, as a sequence of rules. Pure logic.
// Regex matching can backtrack catastrophically, so the page runs this in a worker with a timeout.

import { compile, findMatches, MAX_MATCHES } from '../../regex-tester/features/regex';

export { MAX_MATCHES };
export { TIMEOUT_MS } from '../../regex-tester/features/regex';

export interface Rule {
  id: number;
  find: string;
  replace: string;
  enabled: boolean;
}

export interface FindOptions {
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  multiline: boolean;
  replaceAll: boolean;
}

export interface Span {
  index: number;
  end: number;
}

export interface RuleOutcome {
  /** Matches found in the text this rule sees (the output of the rules before it). */
  count: number;
  /** How many were replaced (1 at most with "replace first"). */
  replaced: number;
  error?: string;
}

export interface FindReplaceResult {
  output: string;
  rules: (RuleOutcome | null)[];
  /** Highlight data for the selected rule: the text it sees and its matches. */
  active: { text: string; matches: Span[]; truncated: boolean } | null;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * Builds the regex source and flags for one rule. Whole word uses lookarounds so it works for any pattern:
 * Unicode letters/digits for plain text (needs the `u` flag), `\w` for user regexes (which may not be valid with `u`).
 */
export function buildRegex(find: string, o: FindOptions): { ok: true; source: string; flags: string } | { ok: false; error: string } {
  let source = o.regex ? find : escapeRegex(find);
  const unicode = o.wholeWord && !o.regex;
  if (o.wholeWord) source = unicode ? `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])` : `(?<!\\w)(?:${source})(?!\\w)`;
  const flags = `g${o.caseSensitive ? '' : 'i'}${o.multiline ? 'm' : ''}${unicode ? 'u' : ''}`;
  const c = compile(source, flags);
  return c.ok ? { ok: true, source, flags } : c;
}

/** In plain-text mode the replacement is literal: `$` has no special meaning. */
export const literalReplacement = (s: string) => s.replace(/\$/g, '$$$$');

export function runRules(text: string, rules: Rule[], o: FindOptions, activeIndex: number, maxMatches = MAX_MATCHES): FindReplaceResult {
  let current = text;
  let active: FindReplaceResult['active'] = null;
  const outcomes = rules.map((rule, i): RuleOutcome | null => {
    if (!rule.enabled || !rule.find) {
      if (i === activeIndex) active = { text: current, matches: [], truncated: false };
      return null;
    }
    const built = buildRegex(rule.find, o);
    if (!built.ok) {
      if (i === activeIndex) active = { text: current, matches: [], truncated: false };
      return { count: 0, replaced: 0, error: built.error };
    }
    const found = findMatches(built.source, built.flags, current, maxMatches);
    if (!found.ok) return { count: 0, replaced: 0, error: found.error };
    if (i === activeIndex) active = { text: current, matches: found.matches.map((m) => ({ index: m.index, end: m.end })), truncated: found.truncated };
    const re = new RegExp(built.source, o.replaceAll ? built.flags : built.flags.replace('g', ''));
    const replacement = o.regex ? rule.replace : literalReplacement(rule.replace);
    current = current.replace(re, replacement);
    return { count: found.matches.length, replaced: found.matches.length ? (o.replaceAll ? found.matches.length : 1) : 0 };
  });
  return { output: current, rules: outcomes, active };
}

export interface Segment {
  text: string;
  /** Index into the matches, or -1 for text between matches. */
  match: number;
}

/** Splits text into plain and matched runs for highlighting (rendered as text, never HTML). */
export function toSegments(text: string, matches: Span[]): Segment[] {
  const out: Segment[] = [];
  let pos = 0;
  matches.forEach((m, i) => {
    if (m.index < pos || m.end === m.index) return;
    if (m.index > pos) out.push({ text: text.slice(pos, m.index), match: -1 });
    out.push({ text: text.slice(m.index, m.end), match: i });
    pos = m.end;
  });
  if (pos < text.length) out.push({ text: text.slice(pos), match: -1 });
  return out;
}
