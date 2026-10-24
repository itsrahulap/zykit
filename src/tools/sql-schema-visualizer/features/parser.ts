// Tokenizer-based parser for the PostgreSQL DDL subset the diagram needs: CREATE TABLE, CREATE INDEX
// and ALTER TABLE … ADD. Anything else is reported with its line number and skipped, never guessed.
// Pure (no DOM), iterative (no recursion), and the input is capped, so hostile text can't hang it.

import { textError, type TextError } from '../../../shared/lib/textpos';

export const MAX_INPUT_CHARS = 1_000_000;
export const MAX_TABLES = 500;

export interface SqlColumn {
  name: string;
  /** Type as written, whitespace collapsed (e.g. `character varying(255)`, `int[]`). */
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  unique: boolean;
  /** GENERATED … AS IDENTITY. */
  identity: boolean;
  default?: string;
  check?: string;
}

export interface SqlIndex {
  name?: string;
  /** Column names; an expression element is kept as its source text. */
  columns: string[];
  unique: boolean;
}

export interface SqlTable {
  id: string;
  schema?: string;
  name: string;
  columns: SqlColumn[];
  primaryKey: string[];
  uniques: string[][];
  checks: string[];
  indexes: SqlIndex[];
  line: number;
}

export interface ForeignKey {
  id: string;
  name?: string;
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
  onDelete?: string;
  line: number;
}

export interface ParsedSchema {
  tables: SqlTable[];
  foreignKeys: ForeignKey[];
  /** Skipped statements and other problems, each with a line and column. */
  issues: TextError[];
  /** Set when the text can't be tokenized at all (e.g. an unterminated string). */
  error?: TextError;
}

export const tableLabel = (t: Pick<SqlTable, 'schema' | 'name'>) => (t.schema ? `${t.schema}.${t.name}` : t.name);

// ---- Tokenizer ----

interface Token {
  kind: 'word' | 'quoted' | 'string' | 'number' | 'punct' | 'op';
  /** Identifier value: unquoted words are folded to lower case like PostgreSQL does; quoted ones are unescaped. */
  value: string;
  start: number;
  end: number;
}

class SqlSyntaxError extends Error {
  readonly offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

const WORD_START = /[A-Za-z_\u0080-￿]/;
const WORD_PART = /[A-Za-z0-9_$\u0080-￿]/;

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const n = src.length;
  let i = 0;
  const push = (kind: Token['kind'], start: number, end: number, value = src.slice(start, end)) => tokens.push({ kind, value, start, end });
  while (i < n) {
    const ch = src[i];
    const start = i;
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v') {
      i++;
    } else if (ch === '-' && src[i + 1] === '-') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? n : nl + 1;
    } else if (ch === '/' && src[i + 1] === '*') {
      // PostgreSQL block comments nest.
      let depth = 1;
      i += 2;
      while (i < n && depth) {
        if (src.startsWith('/*', i)) {
          depth++;
          i += 2;
        } else if (src.startsWith('*/', i)) {
          depth--;
          i += 2;
        } else i++;
      }
      if (depth) throw new SqlSyntaxError('This /* comment is never closed with */.', start);
    } else if (ch === "'" || ((ch === 'E' || ch === 'e') && src[i + 1] === "'")) {
      const backslashEscapes = ch !== "'";
      i += backslashEscapes ? 2 : 1;
      for (;;) {
        if (i >= n) throw new SqlSyntaxError('This string literal is never closed with a quote.', start);
        if (backslashEscapes && src[i] === '\\') i += 2;
        else if (src[i] === "'" && src[i + 1] === "'") i += 2;
        else if (src[i++] === "'") break;
      }
      push('string', start, i);
    } else if (ch === '"') {
      let value = '';
      i++;
      for (;;) {
        if (i >= n) throw new SqlSyntaxError('This quoted identifier is never closed with ".', start);
        if (src[i] === '"' && src[i + 1] === '"') {
          value += '"';
          i += 2;
        } else if (src[i] === '"') break;
        else value += src[i++];
      }
      i++;
      if (!value) throw new SqlSyntaxError('A quoted identifier can’t be empty.', start);
      push('quoted', start, i, value);
    } else if (ch === '$' && /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.test(src.slice(i, i + 66))) {
      const tag = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(src.slice(i, i + 66))![0];
      const close = src.indexOf(tag, i + tag.length);
      if (close === -1) throw new SqlSyntaxError(`This dollar-quoted string is never closed with ${tag}.`, start);
      i = close + tag.length;
      push('string', start, i);
    } else if (WORD_START.test(ch)) {
      while (i < n && WORD_PART.test(src[i])) i++;
      push('word', start, i, src.slice(start, i).toLowerCase());
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      i += /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i, i + 400))![0].length;
      push('number', start, i);
    } else if ('(),;.[]'.includes(ch)) {
      push('punct', start, ++i);
    } else if (ch === ':' && src[i + 1] === ':') {
      push('op', start, (i += 2));
    } else {
      push('op', start, ++i);
    }
  }
  return tokens;
}

// ---- Parser ----

/** Words that end a column's type or DEFAULT expression and start the next column option. */
const COLUMN_OPTIONS = new Set(['constraint', 'not', 'null', 'default', 'primary', 'unique', 'references', 'check', 'collate', 'generated', 'deferrable', 'initially']);

interface Name {
  schema?: string;
  name: string;
}

interface PendingForeignKey {
  name?: string;
  from: SqlTable;
  fromColumns: string[];
  to: Name;
  toColumns: string[];
  onDelete?: string;
  offset: number;
}

class Cursor {
  i = 0;
  readonly tokens: Token[];
  readonly src: string;
  readonly end: number;
  constructor(tokens: Token[], src: string, end: number) {
    this.tokens = tokens;
    this.src = src;
    this.end = end;
  }
  peek(k = 0): Token | undefined {
    return this.tokens[this.i + k];
  }
  get offset() {
    return this.peek()?.start ?? this.end;
  }
  fail(message: string): never {
    throw new SqlSyntaxError(message, this.offset);
  }
  isWord(w: string, k = 0) {
    const t = this.peek(k);
    return t?.kind === 'word' && t.value === w;
  }
  isPunct(p: string) {
    const t = this.peek();
    return t?.kind === 'punct' && t.value === p;
  }
  /** Accepts the whole word sequence or nothing. */
  acceptWords(...words: string[]) {
    if (!words.every((w, k) => this.isWord(w, k))) return false;
    this.i += words.length;
    return true;
  }
  expectWords(...words: string[]) {
    if (!this.acceptWords(...words)) this.fail(`Expected ${words.join(' ').toUpperCase()} ${this.describe()}.`);
  }
  acceptPunct(p: string) {
    if (!this.isPunct(p)) return false;
    this.i++;
    return true;
  }
  expectPunct(p: string) {
    if (!this.acceptPunct(p)) this.fail(`Expected "${p}" ${this.describe()}.`);
  }
  describe() {
    const t = this.peek();
    return t ? `but found "${this.src.slice(t.start, Math.min(t.end, t.start + 40))}"` : 'but the statement ended';
  }
  ident(what = 'a name'): string {
    const t = this.peek();
    if (t?.kind !== 'word' && t?.kind !== 'quoted') this.fail(`Expected ${what} ${this.describe()}.`);
    this.i++;
    return t.value;
  }
  qualifiedName(what: string): Name {
    const parts = [this.ident(what)];
    while (parts.length < 3 && this.acceptPunct('.')) parts.push(this.ident(what));
    // database.schema.table: the database part doesn't matter for a diagram.
    return parts.length === 1 ? { name: parts[0] } : { schema: parts[parts.length - 2], name: parts[parts.length - 1] };
  }
  identList(): string[] {
    this.expectPunct('(');
    const names = [this.ident('a column name')];
    while (this.acceptPunct(',')) names.push(this.ident('a column name'));
    this.expectPunct(')');
    return names;
  }
  /** Consumes tokens until `stop` matches at paren depth 0; returns the consumed source text. */
  skipUntil(stop: (t: Token) => boolean): string {
    const first = this.i;
    let depth = 0;
    for (let t = this.peek(); t; t = this.peek()) {
      if (depth === 0 && stop(t)) break;
      if (t.kind === 'punct' && (t.value === '(' || t.value === '[')) depth++;
      else if (t.kind === 'punct' && (t.value === ')' || t.value === ']')) {
        if (depth === 0) break;
        depth--;
      }
      this.i++;
    }
    return this.textFrom(first);
  }
  textFrom(first: number) {
    if (this.i <= first) return '';
    return this.src.slice(this.tokens[first].start, this.tokens[this.i - 1].end).replace(/\s+/g, ' ');
  }
  /** `(expression)`, returning the text inside the parentheses. */
  parenthesized(): string {
    this.expectPunct('(');
    const text = this.skipUntil(() => false);
    this.expectPunct(')');
    return text;
  }
}

const isElementEnd = (t: Token) => t.kind === 'punct' && (t.value === ',' || t.value === ')');

export function parseSchema(src: string): ParsedSchema {
  const result: ParsedSchema = { tables: [], foreignKeys: [], issues: [] };
  if (src.length > MAX_INPUT_CHARS) {
    result.error = textError(src, MAX_INPUT_CHARS, `The SQL is longer than ${MAX_INPUT_CHARS.toLocaleString('en-US')} characters. Paste a smaller part of the schema.`);
    return result;
  }
  let tokens: Token[];
  try {
    tokens = tokenize(src);
  } catch (e) {
    if (!(e instanceof SqlSyntaxError)) throw e;
    result.error = textError(src, e.offset, e.message);
    return result;
  }

  const issue = (offset: number, message: string) => result.issues.push(textError(src, offset, message));
  const pending: PendingForeignKey[] = [];
  const lookup = (n: Name): SqlTable | undefined => {
    const sameName = result.tables.filter((t) => t.name === n.name);
    if (n.schema) return sameName.find((t) => (t.schema ?? 'public') === n.schema);
    return sameName.find((t) => !t.schema || t.schema === 'public') ?? (sameName.length === 1 ? sameName[0] : undefined);
  };
  const findTable = (c: Cursor, n: Name, what: string) => lookup(n) ?? c.fail(`${what} uses table "${tableLabel(n)}", which isn't created above.`);

  /** ON DELETE / ON UPDATE / MATCH / DEFERRABLE clauses after REFERENCES. */
  const referenceActions = (c: Cursor) => {
    let onDelete: string | undefined;
    for (;;) {
      if (c.acceptWords('match')) c.ident('FULL, PARTIAL or SIMPLE');
      else if (c.isWord('on') && (c.isWord('delete', 1) || c.isWord('update', 1))) {
        const isDelete = c.isWord('delete', 1);
        c.i += 2;
        let action: string;
        if (c.acceptWords('no', 'action')) action = 'no action';
        else if (c.acceptWords('restrict')) action = 'restrict';
        else if (c.acceptWords('cascade')) action = 'cascade';
        else if (c.acceptWords('set', 'null')) action = 'set null';
        else if (c.acceptWords('set', 'default')) action = 'set default';
        else c.fail(`Expected a referential action ${c.describe()}.`);
        if (c.isPunct('(')) c.identList();
        if (isDelete) onDelete = action;
      } else if (!constraintTiming(c)) return onDelete;
    }
  };
  const constraintTiming = (c: Cursor) => {
    if (c.acceptWords('deferrable') || c.acceptWords('not', 'deferrable')) return true;
    if (!c.acceptWords('initially')) return false;
    c.ident('DEFERRED or IMMEDIATE');
    return true;
  };
  const references = (c: Cursor, from: SqlTable, fromColumns: string[], name: string | undefined, offset: number) => {
    c.expectWords('references');
    const to = c.qualifiedName('the referenced table');
    const toColumns = c.isPunct('(') ? c.identList() : [];
    const onDelete = referenceActions(c);
    pending.push({ name, from, fromColumns, to, toColumns, onDelete, offset });
  };

  const column = (c: Cursor, table: SqlTable) => {
    const offset = c.offset;
    const name = c.ident('a column name');
    if (table.columns.some((x) => x.name === name)) c.fail(`Column "${name}" is defined twice in "${tableLabel(table)}".`);
    const type = c.skipUntil((t) => isElementEnd(t) || (t.kind === 'word' && COLUMN_OPTIONS.has(t.value)));
    if (!type) c.fail(`Column "${name}" needs a type.`);
    const col: SqlColumn = { name, type, notNull: false, primaryKey: false, unique: false, identity: false };
    while (c.peek() && !isElementEnd(c.peek()!)) {
      const constraintName = c.acceptWords('constraint') ? c.ident('a constraint name') : undefined;
      if (c.acceptWords('not', 'null')) col.notNull = true;
      else if (c.acceptWords('null')) col.notNull = false;
      else if (c.acceptWords('default')) {
        const first = c.i;
        c.i++; // the expression has at least one token, so DEFAULT NULL keeps its NULL
        c.skipUntil((t) => isElementEnd(t) || (t.kind === 'word' && COLUMN_OPTIONS.has(t.value)));
        col.default = c.textFrom(first);
      } else if (c.acceptWords('primary', 'key')) {
        if (table.primaryKey.length) c.fail(`"${tableLabel(table)}" has more than one primary key.`);
        table.primaryKey = [name];
      } else if (c.acceptWords('unique')) {
        // NULLS [NOT] DISTINCT only changes how NULLs compare.
        if (!c.acceptWords('nulls', 'not', 'distinct')) c.acceptWords('nulls', 'distinct');
        table.uniques.push([name]);
      } else if (c.isWord('references')) references(c, table, [name], constraintName, offset);
      else if (c.isWord('check')) {
        c.i++;
        col.check = c.parenthesized();
        c.acceptWords('no', 'inherit');
      } else if (c.acceptWords('collate')) c.qualifiedName('a collation');
      else if (c.acceptWords('generated')) {
        if (c.acceptWords('always', 'as', 'identity') || c.acceptWords('by', 'default', 'as', 'identity')) {
          col.identity = true;
          if (c.isPunct('(')) c.parenthesized();
        } else if (c.acceptWords('always', 'as')) {
          col.default = `GENERATED ALWAYS AS (${c.parenthesized()})`;
          c.acceptWords('stored');
        } else c.fail(`Expected AS IDENTITY or AS (…) after GENERATED ${c.describe()}.`);
      } else if (!constraintTiming(c)) c.fail(`Column option "${c.src.slice(c.offset, c.peek()!.end)}" isn't supported.`);
    }
    table.columns.push(col);
  };

  /** A table constraint (PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK) or a column definition. */
  const tableElement = (c: Cursor, table: SqlTable) => {
    const offset = c.offset;
    const constraintName = c.acceptWords('constraint') ? c.ident('a constraint name') : undefined;
    if (c.acceptWords('primary', 'key')) {
      if (table.primaryKey.length) c.fail(`"${tableLabel(table)}" has more than one primary key.`);
      table.primaryKey = c.identList();
    } else if (c.acceptWords('unique')) {
      if (!c.acceptWords('nulls', 'not', 'distinct')) c.acceptWords('nulls', 'distinct');
      table.uniques.push(c.identList());
    } else if (c.acceptWords('foreign', 'key')) references(c, table, c.identList(), constraintName, offset);
    else if (c.acceptWords('check')) {
      table.checks.push(c.parenthesized());
      c.acceptWords('no', 'inherit');
    } else if (constraintName || c.isWord('exclude') || c.isWord('like')) c.fail(`${(c.peek() ? c.src.slice(c.offset, c.peek()!.end) : 'This').toUpperCase()} isn't supported here.`);
    else return column(c, table);
    // Index parameters on PRIMARY KEY / UNIQUE don't change the diagram.
    for (;;) {
      if (c.acceptWords('include') || c.acceptWords('with')) c.parenthesized();
      else if (c.acceptWords('using', 'index', 'tablespace')) c.ident('a tablespace');
      else if (!constraintTiming(c)) break;
    }
  };

  const createTable = (c: Cursor, line: number) => {
    const ifNotExists = c.acceptWords('if', 'not', 'exists');
    const name = c.qualifiedName('a table name');
    if (c.isWord('of') || c.isWord('partition') || c.isWord('as')) c.fail(`CREATE TABLE … ${c.peek()!.value.toUpperCase()} isn't supported; only a column list is.`);
    if (lookup(name) && (lookup(name)!.schema ?? 'public') === (name.schema ?? 'public')) {
      if (ifNotExists) return;
      c.fail(`Table "${tableLabel(name)}" is created twice.`);
    }
    if (result.tables.length >= MAX_TABLES) c.fail(`Only the first ${MAX_TABLES} tables are shown.`);
    c.expectPunct('(');
    const table: SqlTable = { id: `t${result.tables.length}`, ...name, columns: [], primaryKey: [], uniques: [], checks: [], indexes: [], line };
    if (!c.acceptPunct(')')) {
      for (;;) {
        const first = c.i;
        try {
          tableElement(c, table);
          if (c.peek() && !isElementEnd(c.peek()!)) c.fail(`Unexpected "${c.src.slice(c.offset, c.peek()!.end)}" in this column or constraint.`);
        } catch (e) {
          if (!(e instanceof SqlSyntaxError)) throw e;
          issue(e.offset, `${e.message} That part of "${tableLabel(table)}" was skipped.`);
          c.i = first;
          c.skipUntil(isElementEnd);
        }
        if (c.acceptPunct(',')) continue;
        c.expectPunct(')');
        break;
      }
    }
    if (c.peek()) issue(c.offset, `Table options after the column list of "${tableLabel(table)}" (INHERITS, PARTITION BY, WITH, …) were ignored.`);
    result.tables.push(table);
  };

  const createIndex = (c: Cursor, unique: boolean) => {
    c.acceptWords('concurrently');
    let name: string | undefined;
    if (!c.isWord('on')) {
      c.acceptWords('if', 'not', 'exists');
      name = c.ident('an index name');
    }
    c.expectWords('on');
    c.acceptWords('only');
    const table = findTable(c, c.qualifiedName('a table name'), 'CREATE INDEX');
    if (c.acceptWords('using')) c.ident('an index method');
    c.expectPunct('(');
    const columns: string[] = [];
    do {
      const first = c.i;
      const t = c.peek();
      const text = c.skipUntil(isElementEnd);
      if (!text) c.fail(`Expected an index column ${c.describe()}.`);
      const next = c.tokens[first + 1];
      // A bare column, maybe followed by ASC/DESC/NULLS/COLLATE/opclass words; anything else is an expression.
      const isColumn = (t?.kind === 'word' || t?.kind === 'quoted') && (c.i === first + 1 || next.kind === 'word' || next.kind === 'quoted');
      columns.push(isColumn ? t.value : text);
    } while (c.acceptPunct(','));
    c.expectPunct(')');
    table.indexes.push({ name, columns, unique });
  };

  const alterTable = (c: Cursor) => {
    c.acceptWords('if', 'exists');
    c.acceptWords('only');
    const table = findTable(c, c.qualifiedName('a table name'), 'ALTER TABLE');
    c.acceptPunct('*');
    do {
      if (!c.acceptWords('add')) c.fail(`ALTER TABLE … ${(c.peek()?.value ?? '').toUpperCase()} isn't supported; only ADD is.`);
      if (c.acceptWords('column')) {
        c.acceptWords('if', 'not', 'exists');
        column(c, table);
      } else tableElement(c, table);
      c.acceptWords('not', 'valid');
    } while (c.acceptPunct(','));
    if (c.peek()) c.fail(`Unexpected "${c.src.slice(c.offset, c.peek()!.end)}".`);
  };

  // Split into statements at top-level semicolons (strings and comments are already single tokens).
  let first = 0;
  for (let k = 0; k <= tokens.length; k++) {
    if (k < tokens.length && !(tokens[k].kind === 'punct' && tokens[k].value === ';')) continue;
    if (k > first) {
      const stmt = tokens.slice(first, k);
      const c = new Cursor(stmt, src, k < tokens.length ? tokens[k].start : src.length);
      const start = stmt[0].start;
      const line = textError(src, start, '').line;
      try {
        if (c.acceptWords('create')) {
          c.acceptWords('or', 'replace');
          if (!c.acceptWords('global')) c.acceptWords('local');
          if (!c.acceptWords('temporary') && !c.acceptWords('temp')) c.acceptWords('unlogged');
          const unique = c.acceptWords('unique');
          if (!unique && c.acceptWords('table')) createTable(c, line);
          else if (c.acceptWords('index')) createIndex(c, unique);
          else throw new SqlSyntaxError(`CREATE ${c.src.slice(c.offset, c.peek()?.end ?? c.offset).toUpperCase()} isn't supported, so this statement was skipped.`, start);
        } else if (c.acceptWords('alter', 'table')) alterTable(c);
        else throw new SqlSyntaxError(`${src.slice(start, stmt[0].end).toUpperCase()} statements aren't supported, so this one was skipped.`, start);
      } catch (e) {
        if (!(e instanceof SqlSyntaxError)) throw e;
        issue(e.offset, e.message.includes('skipped') ? e.message : `${e.message} The statement was skipped.`);
      }
    }
    first = k + 1;
  }

  // Foreign keys are resolved last, so a table may reference one created further down.
  for (const fk of pending) {
    const label = `${tableLabel(fk.from)}(${fk.fromColumns.join(', ')})`;
    const to = lookup(fk.to);
    if (!to) {
      issue(fk.offset, `${label} references "${tableLabel(fk.to)}", which isn't created here, so no line is drawn.`);
      continue;
    }
    const toColumns = fk.toColumns.length ? fk.toColumns : to.primaryKey;
    const missing = [
      ...fk.fromColumns.filter((n) => !fk.from.columns.some((x) => x.name === n)).map((n) => `${tableLabel(fk.from)}.${n}`),
      ...toColumns.filter((n) => !to.columns.some((x) => x.name === n)).map((n) => `${tableLabel(to)}.${n}`),
    ];
    if (!toColumns.length) issue(fk.offset, `${label} references "${tableLabel(to)}" without columns, and that table has no primary key.`);
    else if (toColumns.length !== fk.fromColumns.length) issue(fk.offset, `${label} has ${fk.fromColumns.length} column(s) but references ${toColumns.length}.`);
    else if (missing.length) issue(fk.offset, `Foreign key ${label} uses unknown column ${missing.join(', ')}.`);
    else
      result.foreignKeys.push({
        id: `fk${result.foreignKeys.length}`,
        name: fk.name,
        fromTable: fk.from.id,
        fromColumns: fk.fromColumns,
        toTable: to.id,
        toColumns,
        onDelete: fk.onDelete,
        line: textError(src, fk.offset, '').line,
      });
  }

  for (const t of result.tables) {
    for (const col of t.columns) {
      col.primaryKey = t.primaryKey.includes(col.name);
      col.unique ||= [...t.uniques, ...t.indexes.filter((x) => x.unique).map((x) => x.columns)].some((u) => u.length === 1 && u[0] === col.name);
      if (col.primaryKey) col.notNull = true;
    }
  }
  return result;
}

export interface Suggestion {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

/**
 * Name-based guesses like `orders.customer_id → customers.id`. These are not relationships:
 * the UI labels them as suggestions, and only columns without a real foreign key are considered.
 */
export function suggestRelationships(s: ParsedSchema): Suggestion[] {
  const out: Suggestion[] = [];
  for (const t of s.tables) {
    for (const col of t.columns) {
      const m = /^(.+?)_?id$/i.exec(col.name);
      if (!m || col.primaryKey) continue;
      if (s.foreignKeys.some((fk) => fk.fromTable === t.id && fk.fromColumns.includes(col.name))) continue;
      const base = m[1].toLowerCase();
      const names = new Set([base, `${base}s`, `${base}es`, base.replace(/y$/, 'ies')]);
      const target = s.tables.find((x) => x.id !== t.id && names.has(x.name.toLowerCase()) && x.primaryKey.length === 1);
      if (target) out.push({ fromTable: t.id, fromColumn: col.name, toTable: target.id, toColumn: target.primaryKey[0] });
    }
  }
  return out;
}
