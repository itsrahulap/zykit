// Builds the worker script around the user's code and maps worker line numbers back to it.

import { createFormatter } from './formatter';
import { DEFAULT_RUNTIME_OPTIONS, type RuntimeOptions } from './protocol';
import { workerRuntime } from './runtime';

export interface WorkerSource {
  /** Full classic-worker script: runtime, then the user's code inside an async function. */
  source: string;
  /** Lines before the user's first line; worker line N is user line N - lineOffset. */
  lineOffset: number;
  /** Number of lines in the user's code. */
  userLines: number;
}

function countLines(s: string): number {
  let n = 1;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}

/**
 * The user's code becomes the body of an async arrow function so top-level `await` works,
 * and it starts on a fresh line so columns are unchanged.
 */
export function buildWorkerSource(code: string, options: RuntimeOptions = DEFAULT_RUNTIME_OPTIONS): WorkerSource {
  const prefix =
    '(' + workerRuntime.toString() + ')(self, ' + JSON.stringify(options) + ', ' + createFormatter.toString() + ')(async () => {\n';
  const suffix = '\n});\n';
  return { source: prefix + code + suffix, lineOffset: countLines(prefix) - 1, userLines: countLines(code) };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrites `<scriptUrl>:LINE:COL` locations in stack traces to `line L:COL` in the user's code.
 * Frames that point into the runtime (before or after the user's code) are dropped.
 */
export function mapLocations(text: string, scriptUrl: string, lineOffset: number, userLines: number): string {
  if (!scriptUrl || text.indexOf(scriptUrl) === -1) return text;
  const re = new RegExp(escapeRegExp(scriptUrl) + ':(\\d+)(?::(\\d+))?', 'g');
  const out: string[] = [];
  for (const line of text.split('\n')) {
    let internal = false;
    const mapped = line.replace(re, (_m, l: string, c?: string) => {
      const user = Number(l) - lineOffset;
      if (user < 1 || user > userLines) {
        internal = true;
        return 'runtime';
      }
      return 'line ' + user + (c ? ':' + c : '');
    });
    const isFrame = /^\s*at\s/.test(line) || /@/.test(line);
    if (internal && isFrame) continue;
    out.push(mapped);
  }
  return out.join('\n');
}

/** Converts a worker line number to the user's line, clamped to the code's range. */
export function toUserLine(workerLine: number, lineOffset: number, userLines: number): number | null {
  if (!workerLine || workerLine < 1) return null;
  const l = workerLine - lineOffset;
  if (l < 1) return 1;
  return l > userLines ? userLines : l;
}

/** Formats the ErrorEvent the page receives when the worker script fails to parse. */
export function formatScriptError(
  message: string | undefined,
  lineno: number | undefined,
  colno: number | undefined,
  lineOffset: number,
  userLines: number,
): string {
  const msg = (message || '').replace(/^Uncaught\s+/, '').trim() || 'The code could not be started (unknown error).';
  const line = toUserLine(lineno || 0, lineOffset, userLines);
  if (line === null) return msg;
  const exact = lineno && lineno - lineOffset === line;
  return msg + ' (line ' + line + (exact && colno ? ':' + colno : '') + ')';
}

/** Blanks out comments and string/template contents so keyword scans don't match inside them. */
function stripCommentsAndStrings(code: string): string {
  let out = '';
  let i = 0;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === '/' && next === '/') {
      while (i < n && code[i] !== '\n') i++;
    } else if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch;
      out += q;
      i++;
      while (i < n && code[i] !== q) {
        if (code[i] === '\\') i++;
        else if (code[i] === '\n') out += '\n';
        i++;
      }
      out += q;
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/**
 * Detects static `import` / `export` statements, which classic workers can't run.
 * Returns the 1-based line of the first one, or null. Dynamic `import()` is not matched.
 */
export function findModuleSyntax(code: string): { line: number; keyword: 'import' | 'export' } | null {
  const lines = stripCommentsAndStrings(code).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(import)\s*(?:[\w$*{'"`]|type\s)|^\s*(export)\s+(?:default\b|const\b|let\b|var\b|function\b|class\b|async\b|type\b|interface\b|enum\b|\{|\*)/.exec(
      lines[i],
    );
    if (m) return { line: i + 1, keyword: m[1] ? 'import' : 'export' };
  }
  return null;
}
