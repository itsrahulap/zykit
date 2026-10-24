// Pure logic for Code Complexity Analyzer: no DOM, so it's unit-testable in Node. The TypeScript
// compiler module is passed in (the page lazy-loads it inside a worker; tests import it directly),
// so this file only imports its types and never pulls the 9 MB compiler into the main bundle.
import type * as TS from 'typescript';

export type Language = 'ts' | 'tsx' | 'js' | 'jsx';

/** Characters; larger input is refused before it reaches the parser. */
export const MAX_INPUT = 500_000;
/** Analysis budget once the compiler has loaded; the worker is terminated after this. */
export const ANALYZE_TIMEOUT_MS = 5_000;
/** Budget for downloading and evaluating the compiler chunk on first use. */
export const LOAD_TIMEOUT_MS = 30_000;
export const MAX_SYNTAX_ERRORS = 50;

export interface Thresholds {
  complexity: number;
  nesting: number;
  lines: number;
}
export const DEFAULT_THRESHOLDS: Thresholds = { complexity: 10, nesting: 4, lines: 50 };

export type DecisionKind = 'if' | '?:' | 'case' | 'for' | 'while' | 'do' | 'catch' | '&&' | '||' | '??' | '&&=' | '||=' | '??=';

/** One +1 to cyclomatic complexity; `start`/`end` cover the keyword or operator (UTF-16 offsets). */
export interface DecisionPoint {
  kind: DecisionKind;
  start: number;
  end: number;
  line: number;
}

export interface FunctionMetrics {
  name: string;
  kind: 'function' | 'arrow' | 'method' | 'getter' | 'setter' | 'constructor';
  start: number;
  end: number;
  startLine: number;
  endLine: number;
  lines: number;
  complexity: number;
  maxNesting: number;
  decisions: DecisionPoint[];
}

export interface SyntaxIssue {
  line: number;
  column: number;
  message: string;
}

export interface Analysis {
  functions: FunctionMetrics[];
  syntaxErrors: SyntaxIssue[];
  /** Diagnostics beyond MAX_SYNTAX_ERRORS that were dropped. */
  moreSyntaxErrors: number;
}

const SCRIPT_KIND = { ts: 'TS', tsx: 'TSX', js: 'JS', jsx: 'JSX' } as const;

/**
 * Cyclomatic complexity = 1 + one per decision point: `if`, `?:`, `case` (not `default`),
 * `for`/`for…in`/`for…of`/`while`/`do`, `catch`, `&&`, `||`, `??` and `&&=`/`||=`/`??=`.
 * `else`, `default`, `try`, `finally` and optional chaining `?.` don't count. Nesting follows
 * ESLint's max-depth: `if` (an `else if` stays at its parent's depth), loops, `switch`, `try`.
 * Nested functions are measured on their own and add nothing to the enclosing function.
 */
export function analyze(ts: typeof TS, code: string, language: Language): Analysis {
  const fileName = `input.${language}`;
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind[SCRIPT_KIND[language]]);
  const lineOf = (pos: number) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const functions: FunctionMetrics[] = [];

  const keywordPoint = (kind: DecisionKind, node: TS.Node, length = kind.length): DecisionPoint => {
    const start = node.getStart(sf);
    return { kind, start, end: start + length, line: lineOf(start) };
  };

  const decisionOf = (node: TS.Node): DecisionPoint | null => {
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
        return keywordPoint('if', node);
      case ts.SyntaxKind.CaseClause:
        return keywordPoint('case', node);
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
        return keywordPoint('for', node);
      case ts.SyntaxKind.WhileStatement:
        return keywordPoint('while', node);
      case ts.SyntaxKind.DoStatement:
        return keywordPoint('do', node);
      case ts.SyntaxKind.CatchClause:
        return keywordPoint('catch', node);
      case ts.SyntaxKind.ConditionalExpression: {
        const q = (node as TS.ConditionalExpression).questionToken;
        return { kind: '?:', start: q.getStart(sf), end: q.getEnd(), line: lineOf(q.getStart(sf)) };
      }
      case ts.SyntaxKind.BinaryExpression: {
        const op = (node as TS.BinaryExpression).operatorToken;
        const kind = LOGICAL[ts.tokenToString(op.kind) ?? ''];
        return kind ? { kind, start: op.getStart(sf), end: op.getEnd(), line: lineOf(op.getStart(sf)) } : null;
      }
      default:
        return null;
    }
  };

  const nests = (node: TS.Node) =>
    ts.isIterationStatement(node, false) ||
    ts.isSwitchStatement(node) ||
    ts.isTryStatement(node) ||
    (ts.isIfStatement(node) && !(ts.isIfStatement(node.parent) && node.parent.elseStatement === node));

  const measure = (fn: TS.FunctionLikeDeclaration & { body: TS.Node }) => {
    const decisions: DecisionPoint[] = [];
    let maxNesting = 0;
    const walk = (node: TS.Node, depth: number) => {
      if (isMeasured(node)) return measure(node);
      const point = decisionOf(node);
      if (point) decisions.push(point);
      const inner = nests(node) ? depth + 1 : depth;
      maxNesting = Math.max(maxNesting, inner);
      ts.forEachChild(node, (child) => walk(child, inner));
    };
    // Parameter defaults (`x = a ?? b`) belong to the function too.
    ts.forEachChild(fn, (child) => walk(child, 0));
    const start = fn.getStart(sf);
    const startLine = lineOf(start);
    const endLine = lineOf(fn.getEnd());
    functions.push({
      name: nameOf(fn),
      kind: kindOf(fn),
      start,
      end: fn.getEnd(),
      startLine,
      endLine,
      lines: endLine - startLine + 1,
      complexity: 1 + decisions.length,
      maxNesting,
      decisions: decisions.sort((a, b) => a.start - b.start),
    });
  };

  // Overload signatures, abstract and `declare` methods have no body and nothing to measure.
  const isMeasured = (node: TS.Node): node is TS.FunctionLikeDeclaration & { body: TS.Node } =>
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node) ||
      ts.isConstructorDeclaration(node)) &&
    node.body !== undefined;

  const kindOf = (fn: TS.FunctionLikeDeclaration): FunctionMetrics['kind'] =>
    ts.isArrowFunction(fn)
      ? 'arrow'
      : ts.isMethodDeclaration(fn)
        ? 'method'
        : ts.isGetAccessorDeclaration(fn)
          ? 'getter'
          : ts.isSetAccessorDeclaration(fn)
            ? 'setter'
            : ts.isConstructorDeclaration(fn)
              ? 'constructor'
              : 'function';

  const nameOf = (fn: TS.FunctionLikeDeclaration): string => {
    const owner = ts.isClassLike(fn.parent) ? `${fn.parent.name?.text ?? '(class)'}.` : '';
    if (ts.isConstructorDeclaration(fn)) return `${owner}constructor`;
    const prefix = ts.isGetAccessorDeclaration(fn) ? 'get ' : ts.isSetAccessorDeclaration(fn) ? 'set ' : '';
    if (fn.name) return `${owner}${prefix}${fn.name.getText(sf)}`;
    // Anonymous functions take the name they're bound to: `const f = () => …`, `{ f: () => … }`, `handler = () => …`.
    const parent = fn.parent;
    if (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) {
      const classOwner = ts.isPropertyDeclaration(parent) && ts.isClassLike(parent.parent) ? `${parent.parent.name?.text ?? '(class)'}.` : '';
      return `${classOwner}${parent.name.getText(sf)}`;
    }
    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) return parent.left.getText(sf);
    return `(anonymous, line ${lineOf(fn.getStart(sf))})`;
  };

  const visitTop = (node: TS.Node): void => {
    if (isMeasured(node)) measure(node);
    else ts.forEachChild(node, visitTop);
  };
  visitTop(sf);
  functions.sort((a, b) => a.start - b.start);

  // parseDiagnostics is internal but stable: it's what the compiler reports as syntax errors.
  const diagnostics = (sf as unknown as { parseDiagnostics?: readonly TS.DiagnosticWithLocation[] }).parseDiagnostics ?? [];
  const syntaxErrors = diagnostics.slice(0, MAX_SYNTAX_ERRORS).map((d) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
    return { line: line + 1, column: character + 1, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') };
  });
  return { functions, syntaxErrors, moreSyntaxErrors: Math.max(0, diagnostics.length - MAX_SYNTAX_ERRORS) };
}

const LOGICAL: Record<string, DecisionKind | undefined> = {
  '&&': '&&',
  '||': '||',
  '??': '??',
  '&&=': '&&=',
  '||=': '||=',
  '??=': '??=',
};

export const exceeds = (fn: FunctionMetrics, t: Thresholds) => ({
  complexity: fn.complexity > t.complexity,
  nesting: fn.maxNesting > t.nesting,
  lines: fn.lines > t.lines,
});

/** The ten functions to look at first: highest complexity, then deepest nesting, then longest. */
export const topFunctions = (functions: FunctionMetrics[], count = 10) =>
  [...functions].sort((a, b) => b.complexity - a.complexity || b.maxNesting - a.maxNesting || b.lines - a.lines || a.start - b.start).slice(0, count);

export interface SourceLine {
  number: number;
  parts: { text: string; decision?: DecisionKind }[];
}

/** The function's source split into lines, with each decision point as its own part (rendered as text). */
export function markedSource(code: string, fn: FunctionMetrics): SourceLine[] {
  const from = code.lastIndexOf('\n', fn.start - 1) + 1;
  const newlineAfter = code.indexOf('\n', fn.end);
  const to = newlineAfter < 0 ? code.length : newlineAfter;
  const lines: SourceLine[] = [];
  let current: SourceLine = { number: fn.startLine, parts: [] };
  const push = (text: string, decision?: DecisionKind) => {
    const pieces = text.split('\n');
    pieces.forEach((piece, i) => {
      if (i > 0) {
        lines.push(current);
        current = { number: current.number + 1, parts: [] };
      }
      if (piece) current.parts.push(decision ? { text: piece, decision } : { text: piece });
    });
  };
  let cursor = from;
  for (const d of fn.decisions) {
    // Nested functions' decisions aren't in this list, so ranges are sorted and never overlap.
    push(code.slice(cursor, d.start));
    push(code.slice(d.start, d.end), d.kind);
    cursor = d.end;
  }
  push(code.slice(cursor, to));
  lines.push(current);
  return lines;
}

/** Language for an opened file, or null to keep the current choice. */
export function languageFromFileName(name: string): Language | null {
  const ext = /\.([cm]?[jt]sx?)$/i.exec(name)?.[1].toLowerCase().replace(/^[cm]/, '');
  return ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx' ? ext : null;
}
