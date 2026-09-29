// Builds a snippet that calls a DSA solution's function with each example's inputs and logs
// the result, so Run shows something straight away. Ported from EngineeringWiki.
//
// Best effort: example inputs are plain-language strings like `nums = [2, 2, 1]`, not argument
// lists, so parsing can fail (e.g. "design a class" problems whose input is a list of method
// calls). A failure just means that example is skipped; no harness at all returns "".

import type { ProblemExample } from '../types/problem';

/** Splits on `sep` only at bracket/paren/brace depth 0 and outside strings. */
export function splitTopLevel(str: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString: string | null = null;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      current += c;
      if (c === '\\') {
        current += str[++i] ?? '';
        continue;
      }
      if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inString = c;
      current += c;
      continue;
    }
    if (c === '[' || c === '{' || c === '(') depth++;
    if (c === ']' || c === '}' || c === ')') depth--;
    if (c === sep && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  parts.push(current);
  return parts;
}

/** Index of the first assignment `=` (not `==`, `===`, `=>`, `!=`, `<=`, `>=`), or -1. */
export function findAssignmentEquals(str: string): number {
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== '=') continue;
    const prev = str[i - 1];
    const next = str[i + 1];
    if (next === '=' || next === '>' || prev === '=' || prev === '!' || prev === '<' || prev === '>') continue;
    return i;
  }
  return -1;
}

/**
 * Reads the leading JS literal (array/object/string/number/identifier) from a string and ignores
 * any trailing annotation: `11 (binary: 1011)` gives `11`. Returns "" when nothing is recognised.
 */
export function parseLeadingLiteral(str: string): string {
  let i = 0;
  const n = str.length;
  while (i < n && /\s/.test(str[i])) i++;
  if (i >= n) return '';
  const start = i;
  const ch = str[i];

  if (ch === '[' || ch === '{' || ch === '(') {
    const close = ch === '[' ? ']' : ch === '{' ? '}' : ')';
    let depth = 0;
    let inString: string | null = null;
    for (; i < n; i++) {
      const c = str[i];
      if (inString) {
        if (c === '\\') {
          i++;
          continue;
        }
        if (c === inString) inString = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        inString = c;
        continue;
      }
      if (c === ch) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    return depth === 0 ? str.slice(start, i) : '';
  }

  if (ch === '"' || ch === "'" || ch === '`') {
    const quote = ch;
    i++;
    let closed = false;
    for (; i < n; i++) {
      if (str[i] === '\\') {
        i++;
        continue;
      }
      if (str[i] === quote) {
        i++;
        closed = true;
        break;
      }
    }
    return closed ? str.slice(start, i) : '';
  }

  // A bare token (number, identifier, boolean, null): read until whitespace, a paren or a comma.
  while (i < n && !/[\s(),]/.test(str[i])) i++;
  return str.slice(start, i);
}

/** Up to five `try { console.log(...) }` lines calling the first declared function, or "". */
export function buildAutoRunHarness(source: string, testCases?: ProblemExample[]): string {
  if (!testCases || testCases.length === 0) return '';
  try {
    const fnMatch = source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!fnMatch) return '';
    const fnName = fnMatch[1];

    const lines: string[] = [];
    testCases.slice(0, 5).forEach((testCase, i) => {
      const args = splitTopLevel(testCase.input, ',').map((part) => {
        const eq = findAssignmentEquals(part);
        return parseLeadingLiteral((eq === -1 ? part : part.slice(eq + 1)).trim());
      });
      if (args.length === 0 || args.some((arg) => arg === '')) return; // couldn't parse this one

      const call = `${fnName}(${args.join(', ')})`;
      const label = `Example ${i + 1}: ${fnName}(${testCase.input}) →`.replace(/\s+/g, ' ');
      const expected = `(expected ${testCase.output})`;
      lines.push(
        `try { console.log(${JSON.stringify(label)}, JSON.stringify(${call}), ${JSON.stringify(expected)}); } ` +
          `catch (e) { console.error(${JSON.stringify(`Example ${i + 1} threw:`)}, e && e.message ? e.message : String(e)); }`,
      );
    });
    return lines.length > 0 ? `\n\n${lines.join('\n')}` : '';
  } catch {
    return '';
  }
}
