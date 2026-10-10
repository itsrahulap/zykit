// GraphQL lexer, parser and printer for executable documents and SDL. Pure TypeScript.
// Shortcut: values, types and directives are parsed to normalized strings, not an AST; comments are
// kept before definitions, selections and members, and counted (`dropped`) elsewhere.

import { textError, type TextError } from '../../../shared/lib/textpos';

class GqlError extends Error {
  offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

type TokType = 'name' | 'int' | 'float' | 'string' | 'block' | 'punct' | 'eof';
export interface Token {
  t: TokType;
  v: string;
  start: number;
  comments: string[];
}

const NAME_START = /[_A-Za-z]/;
const NAME_PART = /[_0-9A-Za-z]/;
const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

/** Split source into tokens (whitespace, commas and BOM are insignificant; `#` comments ride on the next token). */
export function lex(src: string): { tokens: Token[]; comments: number } {
  const tokens: Token[] = [];
  let pending: string[] = [];
  let total = 0;
  let i = 0;
  const push = (t: TokType, v: string, start: number) => {
    tokens.push({ t, v, start, comments: pending });
    pending = [];
  };
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ',' || c === '﻿') i++;
    else if (c === '#') {
      let e = i;
      while (e < src.length && src[e] !== '\n' && src[e] !== '\r') e++;
      pending.push(src.slice(i, e).trimEnd());
      total++;
      i = e;
    } else if ('!$&():=@[]{|}'.includes(c)) push('punct', c, i++);
    else if (c === '.') {
      if (!src.startsWith('...', i)) throw new GqlError('Unexpected "." (did you mean "..."?)', i);
      push('punct', '...', i);
      i += 3;
    } else if (NAME_START.test(c)) {
      let e = i + 1;
      while (e < src.length && NAME_PART.test(src[e])) e++;
      push('name', src.slice(i, e), i);
      i = e;
    } else if (c === '-' || (c >= '0' && c <= '9')) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(src);
      if (!m) throw new GqlError(/^-?0\d/.test(src.slice(i, i + 3)) ? 'Invalid number, unexpected leading zero' : 'Invalid number', i);
      const e = i + m[0].length;
      if (e < src.length && (src[e] === '.' || NAME_START.test(src[e]) || (src[e] >= '0' && src[e] <= '9'))) throw new GqlError(/^-?0$/.test(m[0]) && src[e] >= '0' && src[e] <= '9' ? 'Invalid number, unexpected leading zero' : `Invalid number, unexpected "${src[e]}" after "${m[0]}"`, e);
      push(/[.eE]/.test(m[0]) ? 'float' : 'int', m[0], i);
      i = e;
    } else if (c === '"') {
      if (src.startsWith('"""', i)) {
        let e = i + 3;
        while (e < src.length && !(src.startsWith('"""', e))) e += src.startsWith('\\"""', e) ? 4 : 1;
        if (e >= src.length) throw new GqlError('Unterminated block string', i);
        push('block', src.slice(i, e + 3), i);
        i = e + 3;
      } else {
        let e = i + 1;
        for (; e < src.length && src[e] !== '"'; e++) {
          if (src[e] === '\n' || src[e] === '\r') break;
          if (src[e] === '\\') {
            const esc = src[e + 1];
            if (esc === 'u') {
              const m = /^(?:\{[0-9a-fA-F]+\}|[0-9a-fA-F]{4})/.exec(src.slice(e + 2));
              if (!m) throw new GqlError('Invalid Unicode escape sequence in string', e);
              e += 1 + m[0].length;
            } else if (!esc || !'"\\/bfnrt'.includes(esc)) throw new GqlError(`Invalid character escape sequence "\\${esc ?? ''}"`, e);
            else e++;
          }
        }
        if (src[e] !== '"') throw new GqlError('Unterminated string', i);
        push('string', src.slice(i, e + 1), i);
        i = e + 1;
      }
    } else throw new GqlError(`Unexpected character ${JSON.stringify(c)}`, i);
  }
  push('eof', '', src.length);
  return { tokens, comments: total };
}

/** One printable construct: `comments`, a description, `head(args) tail { body }`. */
export interface Node {
  comments: string[];
  desc?: string;
  head: string;
  args: string[];
  tail: string;
  alts?: string[];
  body?: Node[];
  /** Comments just before the closing brace. */
  end: string[];
}

const OPS = ['query', 'mutation', 'subscription'];
const TYPE_KW = ['schema', 'scalar', 'type', 'interface', 'union', 'enum', 'input'];

class Parser {
  toks: Token[];
  p = 0;
  constructor(toks: Token[]) {
    this.toks = toks;
  }
  get tok() {
    return this.toks[this.p];
  }
  fail(msg: string, t = this.tok): never {
    throw new GqlError(msg, t.start);
  }
  describe(t: Token) {
    return t.t === 'eof' ? '<EOF>' : t.t === 'name' ? `Name "${t.v}"` : t.t === 'punct' ? `"${t.v}"` : `${t.t === 'block' ? 'String' : t.t[0].toUpperCase() + t.t.slice(1)} ${t.v.length > 20 ? t.v.slice(0, 20) + '…' : t.v}`;
  }
  eof() {
    return this.tok.t === 'eof';
  }
  is(v: string) {
    return this.tok.t === 'punct' && this.tok.v === v;
  }
  isName(v?: string) {
    return this.tok.t === 'name' && (v === undefined || this.tok.v === v);
  }
  eat(v: string) {
    if (this.is(v)) return this.toks[this.p++];
    return null;
  }
  expect(v: string): Token {
    return this.eat(v) ?? this.fail(`Expected "${v}", found ${this.describe(this.tok)}`);
  }
  name(what = 'Name'): string {
    if (this.tok.t !== 'name') this.fail(`Expected ${what}, found ${this.describe(this.tok)}`);
    return this.toks[this.p++].v;
  }
  keyword(v: string) {
    if (!this.isName(v)) this.fail(`Expected "${v}", found ${this.describe(this.tok)}`);
    this.p++;
  }

  document(): { defs: Node[]; end: string[] } {
    if (this.eof()) this.fail('Unexpected <EOF>, expected a definition');
    const defs: Node[] = [];
    while (!this.eof()) defs.push(this.definition());
    return { defs, end: this.tok.comments };
  }

  node(comments: string[], head: string, extra: Partial<Node> = {}): Node {
    return { comments, head, args: [], tail: '', end: [], ...extra };
  }

  definition(): Node {
    const comments = this.tok.comments;
    if (this.is('{')) return this.node(comments, '', { ...this.selectionSet() });
    const desc = this.tok.t === 'string' || this.tok.t === 'block' ? this.toks[this.p++].v : undefined;
    const kw = this.tok.v;
    if (this.tok.t !== 'name') this.fail(`Unexpected ${this.describe(this.tok)}`);
    if (!desc && OPS.includes(kw)) return this.operation(comments);
    if (!desc && kw === 'fragment') return this.fragment(comments);
    if (kw === 'directive') return this.directiveDef(comments, desc);
    const ext = !desc && kw === 'extend';
    if (ext) this.p++;
    const k = ext ? this.tok.v : kw;
    if (this.tok.t !== 'name' || !TYPE_KW.includes(k)) this.fail(`Unexpected ${this.describe(this.tok)}`);
    this.p++;
    const n = this.typeDef(comments, desc, k, ext ? 'extend ' : '');
    if (ext && !n.body && !n.tail.trim() && !n.alts && !/implements/.test(n.head)) this.fail(`Unexpected ${this.describe(this.tok)}, an extension needs directives or members`);
    return n;
  }

  operation(comments: string[]): Node {
    let head = this.name();
    if (this.isName()) head += ' ' + this.name();
    const args: string[] = [];
    if (this.eat('(')) {
      do {
        const v = this.variable() + ': ' + (this.expect(':'), this.type());
        args.push(v + (this.eat('=') ? ' = ' + this.value() : '') + this.directives());
      } while (!this.eat(')'));
    }
    return this.node(comments, head, { args, tail: this.directives(), ...this.selectionSet() });
  }

  fragment(comments: string[]): Node {
    this.p++;
    const name = this.name();
    if (name === 'on') this.fail('Unexpected Name "on"', this.toks[this.p - 1]);
    this.keyword('on');
    return this.node(comments, `fragment ${name}`, { tail: ` on ${this.name()}${this.directives()}`, ...this.selectionSet() });
  }

  selectionSet(): { body: Node[]; end: string[] } {
    this.expect('{');
    const body: Node[] = [];
    do body.push(this.selection());
    while (!this.is('}'));
    return { body, end: this.expect('}').comments };
  }

  selection(): Node {
    const comments = this.tok.comments;
    const set = () => (this.is('{') ? this.selectionSet() : {});
    if (this.eat('...')) {
      if (this.isName() && !this.isName('on')) return this.node(comments, '...' + this.name(), { tail: this.directives() });
      const on = this.isName('on') ? (this.p++, ' on ' + this.name()) : '';
      return this.node(comments, '...' + on, { tail: this.directives(), ...(this.is('{') ? this.selectionSet() : this.fail(`Expected "{", found ${this.describe(this.tok)}`)) });
    }
    let head = this.name();
    if (this.eat(':')) head += ': ' + this.name();
    return this.node(comments, head, { args: this.arguments(), tail: this.directives(), ...set() });
  }

  arguments(): string[] {
    const out: string[] = [];
    if (this.eat('(')) {
      do {
        const n = this.name();
        this.expect(':');
        out.push(`${n}: ${this.value()}`);
      } while (!this.eat(')'));
    }
    return out;
  }

  directives(): string {
    let s = '';
    while (this.eat('@')) {
      const n = this.name();
      const a = this.arguments();
      s += ` @${n}${a.length ? `(${a.join(', ')})` : ''}`;
    }
    return s;
  }

  variable(): string {
    this.expect('$');
    return '$' + this.name();
  }

  value(): string {
    const t = this.tok;
    if (this.eat('$')) return '$' + this.name();
    if (this.eat('[')) {
      const items: string[] = [];
      while (!this.eat(']')) items.push(this.value());
      return `[${items.join(', ')}]`;
    }
    if (this.eat('{')) {
      const items: string[] = [];
      while (!this.eat('}')) {
        const n = this.name();
        this.expect(':');
        items.push(`${n}: ${this.value()}`);
      }
      return `{${items.join(', ')}}`;
    }
    if (t.t === 'eof' || t.t === 'punct') this.fail(`Unexpected ${this.describe(t)}, expected a value`);
    this.p++;
    return t.v;
  }

  type(): string {
    let s: string;
    if (this.eat('[')) {
      s = `[${this.type()}]`;
      this.expect(']');
    } else s = this.name('a type name');
    return this.eat('!') ? s + '!' : s;
  }

  descPrefix(): string {
    return this.tok.t === 'string' || this.tok.t === 'block' ? printDescInline(this.toks[this.p++].v) + ' ' : '';
  }

  argDefs(): string[] {
    const out: string[] = [];
    if (this.eat('(')) {
      do out.push(this.inputValue());
      while (!this.eat(')'));
    }
    return out;
  }

  inputValue(): string {
    const d = this.descPrefix();
    const n = this.name();
    this.expect(':');
    const t = this.type();
    return `${d}${n}: ${t}${this.eat('=') ? ' = ' + this.value() : ''}${this.directives()}`;
  }

  members(item: () => Node, optional: boolean): { body?: Node[]; end?: string[] } {
    if (!this.is('{')) {
      if (optional) return {};
      this.fail(`Expected "{", found ${this.describe(this.tok)}`);
    }
    this.p++;
    const body: Node[] = [];
    do body.push(item());
    while (!this.is('}'));
    return { body, end: this.expect('}').comments };
  }

  typeDef(comments: string[], desc: string | undefined, kw: string, pre: string): Node {
    const head = `${pre}${kw}`;
    if (kw === 'schema') {
      const dirs = this.directives();
      const m = this.members(() => {
        const c = this.tok.comments;
        const d = desc === undefined ? this.descPrefix() : '';
        const op = this.name();
        this.expect(':');
        return this.node(c, `${d}${op}: ${this.name()}`);
      }, !!pre);
      return this.node(comments, head, { desc, tail: dirs, ...m });
    }
    const name = this.name();
    let h = `${head} ${name}`;
    if (kw === 'scalar') return this.node(comments, h, { desc, tail: this.directives() });
    if (kw === 'type' || kw === 'interface') {
      if (this.isName('implements')) {
        this.p++;
        this.eat('&');
        const names = [this.name()];
        while (this.eat('&')) names.push(this.name());
        h += ' implements ' + names.join(' & ');
      }
      const tail = this.directives();
      return this.node(comments, h, { desc, tail, ...this.members(() => this.fieldDef(), true) });
    }
    if (kw === 'union') {
      const tail = this.directives();
      let alts: string[] | undefined;
      if (this.eat('=')) {
        this.eat('|');
        alts = [this.name()];
        while (this.eat('|')) alts.push(this.name());
      }
      return this.node(comments, h, { desc, tail, alts });
    }
    const tail = this.directives();
    const item = kw === 'enum' ? () => this.enumValue() : () => this.inputField();
    return this.node(comments, h, { desc, tail, ...this.members(item, true) });
  }

  fieldDef(): Node {
    const comments = this.tok.comments;
    const desc = this.tok.t === 'string' || this.tok.t === 'block' ? this.toks[this.p++].v : undefined;
    const head = this.name();
    const args = this.argDefs();
    this.expect(':');
    return this.node(comments, head, { desc, args, tail: `: ${this.type()}${this.directives()}` });
  }

  inputField(): Node {
    const comments = this.tok.comments;
    const desc = this.tok.t === 'string' || this.tok.t === 'block' ? this.toks[this.p++].v : undefined;
    const name = this.name();
    this.expect(':');
    const t = this.type();
    return this.node(comments, name, { desc, tail: `: ${t}${this.eat('=') ? ' = ' + this.value() : ''}${this.directives()}` });
  }

  enumValue(): Node {
    const comments = this.tok.comments;
    const desc = this.tok.t === 'string' || this.tok.t === 'block' ? this.toks[this.p++].v : undefined;
    return this.node(comments, this.name(), { desc, tail: this.directives() });
  }

  directiveDef(comments: string[], desc?: string): Node {
    this.p++;
    this.expect('@');
    const head = `directive @${this.name()}`;
    const args = this.argDefs();
    let tail = this.isName('repeatable') ? (this.p++, ' repeatable') : '';
    this.keyword('on');
    this.eat('|');
    const locs = [this.name()];
    while (this.eat('|')) locs.push(this.name());
    tail += ' on ' + locs.join(' | ');
    return this.node(comments, head, { desc, args, tail });
  }
}

const WIDTH = 80;

/** Block string raw text to its value (spec BlockStringValue: common indent and blank edge lines removed). */
function blockValue(raw: string): string {
  const lines = raw.slice(3, -3).replace(/\\"""/g, '"""').split(/\r\n|\n|\r/);
  let common = Infinity;
  for (const l of lines.slice(1)) {
    const ind = /^[ \t]*/.exec(l)![0].length;
    if (ind < l.length) common = Math.min(common, ind);
  }
  const out = lines.map((l, i) => (i && common < Infinity ? l.slice(common) : l));
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.join('\n');
}

function printDescInline(raw: string): string {
  if (!raw.startsWith('"""')) return raw;
  const v = blockValue(raw);
  return v.includes('\n') || v.endsWith('"') ? raw : `"""${v.replace(/"""/g, '\\"""')}"""`;
}

function descLines(raw: string, pad: string): string[] {
  if (!raw.startsWith('"""')) return [pad + raw];
  const v = blockValue(raw);
  if (!v.includes('\n') && !v.endsWith('"') && pad.length + v.length < WIDTH - 6) return [pad + `"""${v.replace(/"""/g, '\\"""')}"""`];
  return [pad + '"""', ...v.replace(/"""/g, '\\"""').split('\n').map((l) => (l ? pad + l : '')), pad + '"""'];
}

export interface PrintOptions {
  indent: number | 'tab';
}

function printNode(n: Node, level: number, unit: string, used: { n: number }): string[] {
  const pad = unit.repeat(level);
  const out: string[] = [];
  used.n += n.comments.length;
  for (const c of n.comments) out.push(pad + c);
  if (n.desc) out.push(...descLines(n.desc, pad));
  let main: string[] = [];
  if (n.alts) {
    const one = `${n.head}${n.tail} = ${n.alts.join(' | ')}`;
    main = pad.length + one.length <= WIDTH ? [pad + one] : [pad + n.head + n.tail + ' =', ...n.alts.map((a) => `${pad}${unit}| ${a}`)];
  } else {
    const one = n.head + (n.args.length ? `(${n.args.join(', ')})` : '') + n.tail;
    if (n.args.length && (pad.length + one.length > WIDTH || n.args.some((a) => a.includes('\n')))) {
      main = [pad + n.head + '(', ...n.args.map((a) => unit.repeat(level + 1) + a), pad + ')' + n.tail];
    } else if (one) main = [pad + one];
  }
  out.push(...main);
  if (n.body) {
    if (main.length) out[out.length - 1] += ' {';
    else out.push(pad + '{');
    n.body.forEach((c, i) => {
      if (i && c.desc) out.push('');
      out.push(...printNode(c, level + 1, unit, used));
    });
    used.n += n.end.length;
    for (const c of n.end) out.push(unit.repeat(level + 1) + c);
    out.push(pad + '}');
  }
  return out;
}

export type FormatResult = { ok: true; text: string; dropped: number } | { ok: false; error: TextError };

function run<T>(src: string, f: () => T): { ok: true; value: T } | { ok: false; error: TextError } {
  try {
    return { ok: true, value: f() };
  } catch (e) {
    if (e instanceof GqlError) return { ok: false, error: textError(src, e.offset, e.message) };
    throw e;
  }
}

/** Pretty-print a GraphQL document (queries, fragments and/or SDL). */
export function formatGraphql(src: string, options: PrintOptions = { indent: 2 }): FormatResult {
  const r = run(src, () => {
    const { tokens, comments } = lex(src);
    return { doc: new Parser(tokens).document(), comments };
  });
  if (!r.ok) return r;
  const unit = options.indent === 'tab' ? '\t' : ' '.repeat(options.indent);
  const used = { n: 0 };
  const blocks = r.value.doc.defs.map((d) => printNode(d, 0, unit, used).join('\n'));
  used.n += r.value.doc.end.length;
  if (r.value.doc.end.length) blocks.push(r.value.doc.end.join('\n'));
  return { ok: true, text: blocks.join('\n\n') + '\n', dropped: r.value.comments - used.n };
}

/** Smallest equivalent document: comments and commas gone, spaces only where two tokens would merge. */
export function minifyGraphql(src: string): FormatResult {
  const r = run(src, () => {
    const { tokens } = lex(src);
    new Parser(tokens).document();
    return tokens;
  });
  if (!r.ok) return r;
  const word = (t?: Token) => t && (t.t === 'name' || t.t === 'int' || t.t === 'float');
  const str = (t?: Token) => t && (t.t === 'string' || t.t === 'block');
  let out = '';
  let prev: Token | undefined;
  for (const t of r.value) {
    if (t.t === 'eof') break;
    if ((word(prev) && word(t)) || (str(prev) && str(t))) out += ' ';
    out += t.v;
    prev = t;
  }
  return { ok: true, text: out, dropped: 0 };
}
