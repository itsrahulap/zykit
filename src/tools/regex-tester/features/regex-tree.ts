// A recursive-descent parser for JavaScript regular expressions that builds a tree of plain-English
// descriptions. It mirrors ECMAScript's grammar (with the browser's Annex B leniency outside u/v
// mode) closely enough to explain a pattern; the browser's own RegExp remains the judge of validity.

import { quantifierInfo, readEscape } from './regex';

export interface RegexNode {
  /** Plain-English description. */
  label: string;
  /** The pattern text this node covers. */
  text: string;
  start: number;
  end: number;
  kind: 'pattern' | 'alternation' | 'alternative' | 'group' | 'quantifier' | 'literal' | 'escape' | 'class' | 'any' | 'anchor' | 'backref' | 'operator';
  children: RegexNode[];
}

export class RegexSyntaxError extends Error {
  /** 0-based index into the pattern. */
  index: number;
  constructor(message: string, index: number) {
    super(message);
    this.index = index;
  }
}

const GROUP_OPENERS: [string, string][] = [
  ['(?:', 'Group (not captured)'],
  ['(?=', 'Lookahead: only if followed by'],
  ['(?!', 'Negative lookahead: only if NOT followed by'],
  ['(?<=', 'Lookbehind: only if preceded by'],
  ['(?<!', 'Negative lookbehind: only if NOT preceded by'],
];

const MAX_DEPTH = 200;

const QUANT = /^(?:[*+?]|\{(\d+)(?:,(\d*))?\})\??/;

export function parseRegex(pattern: string, flags = ''): RegexNode {
  const unicodeSets = flags.includes('v');
  const strict = unicodeSets || flags.includes('u');
  let i = 0;
  let groupNo = 0;
  let depth = 0;
  const fail = (message: string, at = i): never => {
    throw new RegexSyntaxError(message, at);
  };
  const node = (kind: RegexNode['kind'], label: string, start: number, children: RegexNode[] = []): RegexNode => ({
    kind,
    label,
    start,
    end: i,
    text: pattern.slice(start, i),
    children,
  });

  function disjunction(): RegexNode[] {
    const start = i;
    const alts: RegexNode[] = [alternative()];
    while (pattern[i] === '|') {
      i++;
      alts.push(alternative());
    }
    if (alts.length === 1) return alts[0].children;
    alts.forEach((a, k) => (a.label = `Option ${k + 1}${a.children.length ? '' : ' (empty: matches nothing, so it always succeeds)'}`));
    return [node('alternation', `Either of ${alts.length} options (the first that matches wins)`, start, alts)];
  }

  function alternative(): RegexNode {
    const start = i;
    const terms: RegexNode[] = [];
    while (i < pattern.length && pattern[i] !== '|' && pattern[i] !== ')') {
      const t = term();
      const last = terms.at(-1);
      // Runs of plain characters read better as one piece of text.
      if (t.kind === 'literal' && last?.kind === 'literal' && last.end === t.start) {
        last.text += t.text;
        last.end = t.end;
        last.label = `The text “${last.text}”`;
      } else terms.push(t);
    }
    return node('alternative', 'Sequence', start, terms);
  }

  function term(): RegexNode {
    const start = i;
    const atom = parseAtom();
    const q = QUANT.exec(pattern.slice(i));
    if (!q) return atom;
    if (atom.kind === 'anchor' || (strict && atom.kind === 'group' && atom.label.startsWith('Look'))) fail('Nothing to repeat: this quantifier follows an assertion.', i);
    if (q[1] !== undefined && q[2] && Number(q[2]) < Number(q[1])) fail(`The range {${q[1]},${q[2]}} is backwards.`, i);
    i += q[0].length;
    const lazy = q[0].length > 1 && q[0].endsWith('?');
    const unbounded = /^[*+]|,\}/.test(q[0]);
    const hint = lazy ? '' : unbounded ? ' (greedy: as many as possible, then gives back if needed)' : '';
    // Quantifiers bind to one character, so split a merged literal back off.
    return node('quantifier', `${quantifierInfo(q[0])}${hint}`, start, [atom]);
  }

  function parseAtom(): RegexNode {
    const start = i;
    const c = pattern[i];
    if (QUANT.test(pattern.slice(i)) && c !== '{') fail('Nothing to repeat: a quantifier needs something before it.');
    if (c === '{' && QUANT.test(pattern.slice(i))) fail('Nothing to repeat: a quantifier needs something before it.');
    const simple: Record<string, [RegexNode['kind'], string]> = {
      '^': ['anchor', flags.includes('m') ? 'Start of a line' : 'Start of the input'],
      $: ['anchor', flags.includes('m') ? 'End of a line' : 'End of the input'],
      '.': ['any', flags.includes('s') ? 'Any character' : 'Any character except a line break'],
    };
    if (c in simple) {
      i++;
      return node(simple[c][0], simple[c][1], start);
    }
    if (c === '(') return group();
    if (c === '[') return charClass();
    if (c === '\\') {
      const t = readEscape(pattern, i);
      if (t.text === '\\') fail('The pattern ends with a lone backslash.');
      if (t.kind === 'backref' && /^\\\d/.test(t.text) && strict && Number(t.text.slice(1)) > countGroups(pattern)) fail(`There is no group ${t.text.slice(1)} to refer back to.`);
      i += t.text.length;
      const kind = t.kind === 'anchor' ? 'anchor' : t.kind === 'backref' ? 'backref' : t.kind === 'literal' ? 'literal' : 'escape';
      return node(kind, kind === 'literal' ? `The text “${t.text.slice(1)}”` : t.info, start);
    }
    if (strict && (c === ']' || c === '{' || c === '}')) fail(`“${c}” must be escaped as \\${c} with the ${unicodeSets ? 'v' : 'u'} flag.`);
    const ch = String.fromCodePoint(pattern.codePointAt(i)!);
    i += ch.length;
    return node('literal', `The text “${ch}”`, start);
  }

  function group(): RegexNode {
    const start = i;
    if (++depth > MAX_DEPTH) fail(`Groups nested more than ${MAX_DEPTH} deep can’t be explained.`);
    const rest = pattern.slice(i);
    const opener = GROUP_OPENERS.find(([o]) => rest.startsWith(o));
    const named = /^\(\?<([A-Za-z_$][\w$]*)>/.exec(rest);
    const mods = /^\(\?([ims]*)(?:-([ims]*))?:/.exec(rest);
    let label: string;
    let len: number;
    const capture = !opener && !(mods && (mods[1] || mods[2])) && (named || !rest.startsWith('(?'));
    if (capture) groupNo += 1;
    if (opener) [len, label] = [opener[0].length, opener[1]];
    else if (named) [len, label] = [named[0].length, `Capture group ${groupNo} named “${named[1]}”`];
    else if (mods && (mods[1] || mods[2])) {
      const on = mods[1] ? `turns on ${[...mods[1]].join(', ')}` : '';
      const off = mods[2] ? `turns off ${[...mods[2]].join(', ')}` : '';
      [len, label] = [mods[0].length, `Group that ${[on, off].filter(Boolean).join(' and ')} for its contents`];
    } else if (rest.startsWith('(?')) return fail('Unknown group type after “(?”.');
    else [len, label] = [1, `Capture group ${groupNo}`];
    i += len;
    const body = disjunction();
    if (pattern[i] !== ')') fail('This group is never closed with “)”.', start);
    i++;
    depth--;
    return node('group', label, start, body);
  }

  function charClass(): RegexNode {
    const start = i;
    i++;
    const negated = pattern[i] === '^';
    if (negated) i++;
    const items: RegexNode[] = [];
    while (pattern[i] !== ']') {
      if (i >= pattern.length) fail('This character class is never closed with “]”.', start);
      const s = i;
      if (unicodeSets && (pattern.startsWith('&&', i) || pattern.startsWith('--', i))) {
        i += 2;
        items.push(node('operator', pattern.startsWith('&&', s) ? 'Intersected with (must be in both)' : 'Minus (removes these)', s));
        continue;
      }
      if (unicodeSets && pattern[i] === '[') {
        items.push(charClass());
        continue;
      }
      if (unicodeSets && pattern.startsWith('\\q{', i)) {
        const close = pattern.indexOf('}', i);
        if (close < 0) fail('\\q{…} is never closed.');
        i = close + 1;
        items.push(node('literal', `One of the strings ${pattern.slice(s + 3, close).split('|').map((x) => `“${x}”`).join(', ')}`, s));
        continue;
      }
      const a = classAtom();
      if (pattern[i] === '-' && pattern[i + 1] !== ']' && i + 1 < pattern.length) {
        const dash = i;
        i++;
        const b = classAtom();
        if (a.kind !== 'literal' || b.kind !== 'literal') {
          // Annex B: outside u/v, "\d-z" is three items; with u/v it's an error.
          if (strict) fail('A range needs a single character on both sides of “-”.', s);
          items.push(a, { kind: 'literal', label: 'The character “-”', text: '-', start: dash, end: dash + 1, children: [] }, b);
          continue;
        }
        if (b.cp! < a.cp!) fail(`The range ${pattern.slice(s, i)} is out of order.`, s);
        items.push(node('literal', `Any character from “${String.fromCodePoint(a.cp!)}” to “${String.fromCodePoint(b.cp!)}”`, s));
        continue;
      }
      items.push(a);
    }
    i++;
    const label = negated ? 'Any one character EXCEPT these' : 'Any one character from this set';
    return node('class', items.length ? label : negated ? 'Any character at all' : 'An empty set (never matches)', start, items);
  }

  function classAtom(): RegexNode & { cp?: number } {
    const s = i;
    if (pattern[i] === '\\') {
      const c = pattern[i + 1];
      if (c === 'b') {
        i += 2;
        return { ...node('literal', 'A backspace character', s), cp: 8 };
      }
      const t = readEscape(pattern, i);
      if (t.text === '\\') fail('The pattern ends with a lone backslash.');
      i += t.text.length;
      if (t.kind === 'literal') return { ...node('literal', `The character “${t.text.slice(1)}”`, s), cp: t.text.codePointAt(1) };
      const single = /^\\(u|x|c|[nrtvf0])/.test(t.text);
      const cp = single ? decodeEscape(t.text) : undefined;
      return { ...node(single ? 'literal' : 'escape', t.info, s), cp };
    }
    const ch = String.fromCodePoint(pattern.codePointAt(i)!);
    i += ch.length;
    return { ...node('literal', `The character “${ch}”`, s), cp: ch.codePointAt(0) };
  }

  const children = disjunction();
  if (i < pattern.length) fail('This “)” has no matching “(”.');
  return { kind: 'pattern', label: 'Pattern', text: pattern, start: 0, end: pattern.length, children };
}

function decodeEscape(t: string): number {
  const c = t[1];
  if (c === 'u') return parseInt(t.slice(2).replace(/[{}]/g, ''), 16);
  if (c === 'x') return parseInt(t.slice(2), 16);
  if (c === 'c') return t.toUpperCase().charCodeAt(2) % 32;
  return { n: 10, r: 13, t: 9, v: 11, f: 12, '0': 0 }[c as 'n'] ?? 0;
}

/** Capturing groups in a pattern: unescaped "(" not followed by "?", plus named groups, outside classes. */
function countGroups(p: string): number {
  let n = 0;
  let inClass = false;
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '\\') i++;
    else if (inClass) inClass = p[i] !== ']';
    else if (p[i] === '[') inClass = true;
    else if (p[i] === '(' && (p[i + 1] !== '?' || /^\?<[^=!]/.test(p.slice(i + 1, i + 4)))) n++;
  }
  return n;
}
