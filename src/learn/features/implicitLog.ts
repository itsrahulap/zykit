// If a snippet ends in a bare expression (`sum(2, 3)`), wrap it in console.log so Run shows
// its value, like a REPL. Ported from EngineeringWiki. Declarations, blocks, assignments,
// console calls and continuation lines are left alone. Beyond the wiki's version, `//` inside a
// string (a URL) no longer counts as a comment, and a line that continues the previous one
// (`.map(...)`, after a trailing comma/operator, or inside a template literal) is left alone.

import { findAssignmentEquals } from './autoRunHarness';

const BLOCK_KEYWORDS =
  /^(const|let|var|function|async\s+function|class|if|else|for|while|switch|try|catch|finally|return|import|export|do|throw|case|default)\b/;

/** Index of a `//` comment outside string literals, or -1. */
function lineCommentIndex(line: string): number {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '/' && line[i + 1] === '/') return i;
  }
  return -1;
}

export function withImplicitLog(source: string): string {
  const lines = source.split('\n');

  let i = lines.length - 1;
  for (; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
    break;
  }
  if (i < 0) return source;

  const rawLine = lines[i];
  const indent = rawLine.match(/^\s*/)?.[0] ?? '';
  const commentIndex = lineCommentIndex(rawLine);
  let codePart = (commentIndex === -1 ? rawLine : rawLine.slice(0, commentIndex)).trim();
  if (codePart.endsWith(';')) codePart = codePart.slice(0, -1).trim();

  const continuationOrBlock = /^[)}\]{.?:+\-*/%&|,=<>`]/.test(codePart);
  let p = i - 1;
  while (p >= 0 && lines[p].trim() === '') p--;
  const prevLine = p >= 0 ? lines[p] : '';
  const prevComment = lineCommentIndex(prevLine);
  const prev = (prevComment === -1 ? prevLine : prevLine.slice(0, prevComment)).trim();
  const prevContinues = /[,([{+\-*/%&|?:=.<>!]$/.test(prev);
  const insideTemplate = (lines.slice(0, i).join('\n').match(/`/g)?.length ?? 0) % 2 === 1;
  if (
    codePart === '' ||
    BLOCK_KEYWORDS.test(codePart) ||
    continuationOrBlock ||
    prevContinues ||
    insideTemplate ||
    codePart.includes(';') || // several statements on one line
    codePart.startsWith('console.') ||
    findAssignmentEquals(codePart) !== -1
  ) {
    return source;
  }

  lines[i] = `${indent}console.log(${codePart});`;
  return lines.join('\n');
}
