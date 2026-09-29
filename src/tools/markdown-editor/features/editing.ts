// Toolbar edits for the Markdown textarea. Each returns the range to replace and the selection afterwards.

export interface Edit {
  from: number;
  to: number;
  insert: string;
  selStart: number;
  selEnd: number;
}

/** Wraps the selection in `before`/`after` (e.g. **bold**), or unwraps it if it is already wrapped. */
export function wrap(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  if (start >= before.length && text.slice(start - before.length, start) === before && text.slice(end, end + after.length) === after) {
    return { from: start - before.length, to: end + after.length, insert: text.slice(start, end), selStart: start - before.length, selEnd: end - before.length };
  }
  const inner = text.slice(start, end) || placeholder;
  return { from: start, to: end, insert: before + inner + after, selStart: start + before.length, selEnd: start + before.length + inner.length };
}

export function link(text: string, start: number, end: number): Edit {
  const label = text.slice(start, end) || 'link text';
  const insert = `[${label}](https://)`;
  const urlStart = start + label.length + 3;
  return { from: start, to: end, insert, selStart: urlStart, selEnd: urlStart + 'https://'.length };
}

/**
 * Adds `prefix` to every selected line, or removes it if all lines already have it.
 * `numbered` makes an ordered list (1. 2. 3.). Heading prefixes replace an existing heading level.
 */
export function linePrefix(text: string, start: number, end: number, prefix: string, numbered = false): Edit {
  const from = text.lastIndexOf('\n', start - 1) + 1;
  let to = text.indexOf('\n', end > start && text[end - 1] === '\n' ? end - 1 : end);
  if (to < 0) to = text.length;
  const lines = text.slice(from, to).split('\n');
  const heading = /^#{1,6} $/.test(prefix);
  const pattern = numbered ? /^\d+\. / : heading ? /^#{1,6} / : null;
  const has = (l: string) => (pattern ? pattern.test(l) && (!heading || l.startsWith(prefix)) : l.startsWith(prefix));
  const all = lines.every(has);
  const out = lines.map((l, i) => {
    if (all) return pattern ? l.replace(pattern, '') : l.slice(prefix.length);
    const bare = heading ? l.replace(/^#{1,6} /, '') : l;
    return (numbered ? `${i + 1}. ` : prefix) + bare;
  });
  const insert = out.join('\n');
  return { from, to, insert, selStart: from, selEnd: from + insert.length };
}

export const TABLE_TEMPLATE = '| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n';

export function insertTable(text: string, start: number, end: number): Edit {
  const before = text.slice(0, start);
  const lead = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const insert = lead + TABLE_TEMPLATE;
  const cell = start + lead.length + 2;
  return { from: start, to: end, insert, selStart: cell, selEnd: cell + 'Column 1'.length };
}

export function applyEdit(text: string, e: Edit): string {
  return text.slice(0, e.from) + e.insert + text.slice(e.to);
}
