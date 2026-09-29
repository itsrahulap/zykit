// Decides how (and whether) a lesson's code example can run, and builds the code that runs.
//
// Examples with no `language` are meant to be JavaScript, but the content also uses that for
// HTML, CSS, JSON, SQL tables, shell commands and folder trees. Those are display-only, like
// Python/SQL/YAML. Runnable code goes to the JS Runner's worker, unless it needs a browser
// page (document, window, alert…), in which case it runs in the sandboxed DOM iframe.

import type { CodeExample } from '../types/content';
import type { ProblemExample } from '../types/problem';
import { findModuleSyntax } from '../../tools/js-runner/features/source';
import { buildAutoRunHarness } from './autoRunHarness';
import { withImplicitLog } from './implicitLog';

export type RunTarget = 'worker' | 'dom';
export interface PlaygroundPlan {
  target: RunTarget;
  language: 'js' | 'ts';
}

const DOM_GLOBALS =
  /(?<![.$\w])(document|window|alert|confirm|prompt|localStorage|sessionStorage|navigator|addEventListener|HTMLElement|DOMContentLoaded|location|history)\b/;

/** Removes // and /* *\/ comments (string-aware) so words in comments don't count. */
export function stripComments(code: string): string {
  let out = '';
  let quote: string | null = null;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (quote) {
      out += c;
      if (c === '\\') out += code[++i] ?? '';
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
    } else if (c === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      out += '\n';
    } else if (c === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') out += '\n';
        i++;
      }
      i++;
    } else out += c;
  }
  return out;
}

/** True when the code uses browser-page globals a worker doesn't have. */
export function needsDomSandbox(code: string): boolean {
  return DOM_GLOBALS.test(stripComments(code));
}

const TS_SYNTAX = [
  /^\s*(export\s+)?(interface|type)\s+[A-Za-z_$][\w$]*\s*(<[^>]*>)?\s*(=|\{|extends)/m,
  /^\s*(export\s+)?(declare|enum|abstract\s+class|namespace)\s/m,
  /[\w$)\]]\s*\??:\s*(string|number|boolean|void|any|unknown|never|bigint|symbol|object|null|undefined|Record|Array|Promise|readonly|[A-Z][\w$]*)\b/,
  /\bas\s+(const|string|number|boolean|unknown|any|[A-Z][\w$]*)\b/,
  /\b(private|public|protected|readonly)\s+[A-Za-z_$]/,
  /\bimplements\s+[A-Z]/,
  /\b[A-Za-z_$][\w$]*<[A-Z][\w$,\s[\]<>|]*>\s*\(/, // generic call: useState<string>(
  /\bfunction\s*[\w$]*\s*<[A-Za-z]/, // generic function
  /\bsatisfies\s+[A-Z{]/,
];

/** Heuristic: does this snippet use TypeScript syntax (so it needs types stripped first)? */
export function looksLikeTypeScript(code: string): boolean {
  const c = stripComments(code);
  // Object literals like `{ name: "Ada" }` look like annotations; only count annotations
  // outside strings, and ignore `case X:` / ternaries by requiring a type-ish word after the colon.
  const noStrings = c.replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');
  return TS_SYNTAX.some((re) => re.test(noStrings));
}

/** The first line that isn't blank or a comment. */
function firstCodeLine(code: string): string {
  return stripComments(code).split('\n').map((l) => l.trim()).find((l) => l !== '') ?? '';
}

export type SnippetKind = 'script' | 'module' | 'html' | 'css' | 'json' | 'text';

/** Heuristic: what a language-less snippet actually is (JavaScript/TypeScript, HTML, CSS, JSON…). */
export function snippetKind(code: string): SnippetKind {
  const first = firstCodeLine(code);
  const lines = code.split('\n');
  if (!first) return 'text'; // only comments
  if (first.startsWith('<')) return 'html';
  if (/^[{[]\s*("|$)/.test(first)) return 'json';
  if (first.startsWith('#') || first.startsWith('--')) return 'text'; // Markdown, SQL comments
  if (/^[A-Z][A-Z0-9_]*=/.test(first)) return 'text'; // .env
  if (/^(npm|npx|yarn|pnpm|node|git|curl|pip|python3?|docker|cd|mkdir|ls|brew)\s/.test(first)) return 'text'; // shell
  if (/^[\w.@-]+\/$/.test(first)) return 'text'; // folder listing
  if (/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\//m.test(code)) return 'text'; // HTTP messages
  if (lines.some((l) => /[├└]──/.test(l))) return 'text'; // folder tree
  if (/^[^|=]*\w[^|=]*\|[^|=]+\|[^=]*$/.test(first) && !first.includes('||')) return 'text'; // text table
  // CSS rule: `selector {` followed by `property: value;`, and no JS/TS declaration keyword.
  if (
    /^[.#:*[]?[\w-]*[^=(){};]*\{\s*$|^[.#:*[]?[\w-]+[^=(){};]*\{\s*[\w-]+\s*:[^;]+;/.test(first) &&
    !/^(interface|type|class|enum|function|const|let|var|if|for|while|switch|else|try|do|namespace|declare|export|import|async|return)\b/.test(first) &&
    /^\s*[a-z-]+\s*:\s*[^;=]+;/m.test(code)
  ) {
    return 'css';
  }
  return findModuleSyntax(code) ? 'module' : 'script'; // modules can't run in a plain script
}

export const isScriptSnippet = (code: string) => snippetKind(code) === 'script';

const LANGUAGE_LABELS: Record<string, string> = { javascript: 'JavaScript', python: 'Python', sql: 'SQL', yaml: 'YAML' };
const KIND_LABELS: Record<SnippetKind, string> = { script: 'JavaScript', module: 'JavaScript', html: 'HTML', css: 'CSS', json: 'JSON', text: 'Text' };

/** Label shown on the code block. */
export function languageLabel(example: Pick<CodeExample, 'code' | 'language'>): string {
  if (example.language && example.language !== 'javascript') return LANGUAGE_LABELS[example.language] ?? example.language.toUpperCase();
  const kind = snippetKind(example.code);
  if ((kind === 'script' || kind === 'module') && looksLikeTypeScript(example.code)) return 'TypeScript';
  return KIND_LABELS[kind];
}

/** How the example runs, or null when it's display-only. */
export function playgroundPlan(example: Pick<CodeExample, 'code' | 'language'>): PlaygroundPlan | null {
  if (example.language && example.language !== 'javascript') return null;
  if (!isScriptSnippet(example.code)) return null;
  return {
    target: needsDomSandbox(example.code) ? 'dom' : 'worker',
    language: looksLikeTypeScript(example.code) ? 'ts' : 'js',
  };
}

/** The code that actually runs: the source plus a test harness, or with its last expression logged. */
export function codeToRun(source: string, testCases?: ProblemExample[]): string {
  const harness = buildAutoRunHarness(source, testCases);
  return harness ? source + harness : withImplicitLog(source);
}
