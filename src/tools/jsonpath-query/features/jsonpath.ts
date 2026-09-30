// JSONPath (RFC 9535): parser, type checker and evaluator. Filters are parsed into an AST and
// interpreted here; nothing is ever evaluated as code. Pure TypeScript, unit-tested in Node.

export class JsonPathError extends Error {
  offset: number;
  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

// ---------------------------------------------------------------------------------------------
// AST

export interface Query {
  root: '$' | '@';
  segments: Segment[];
}
export interface Segment {
  descendant: boolean;
  selectors: Selector[];
}
export type Selector =
  | { t: 'name'; name: string }
  | { t: 'wild' }
  | { t: 'index'; index: number }
  | { t: 'slice'; start: number | null; end: number | null; step: number | null }
  | { t: 'filter'; expr: Logical };

type CmpOp = '==' | '!=' | '<' | '<=' | '>' | '>=';
type Logical =
  | { t: 'or'; items: Logical[] }
  | { t: 'and'; items: Logical[] }
  | { t: 'not'; expr: Logical }
  | { t: 'cmp'; op: CmpOp; left: Comparable; right: Comparable }
  | { t: 'exists'; query: Query }
  | { t: 'fnTest'; fn: FnCall };
type Comparable = { t: 'lit'; value: unknown } | { t: 'sq'; query: Query } | { t: 'fn'; fn: FnCall };
type FnArg = { t: 'value'; c: Comparable } | { t: 'nodes'; query: Query };
interface FnCall {
  name: FnName;
  args: FnArg[];
}

type FnType = 'value' | 'logical' | 'nodes';
type FnName = 'length' | 'count' | 'match' | 'search' | 'value';
const FUNCTIONS: Record<FnName, { params: ('value' | 'nodes')[]; result: FnType }> = {
  length: { params: ['value'], result: 'value' },
  count: { params: ['nodes'], result: 'value' },
  match: { params: ['value', 'value'], result: 'logical' },
  search: { params: ['value', 'value'], result: 'logical' },
  value: { params: ['nodes'], result: 'value' },
};

const MAX_INT = 2 ** 53 - 1;

// ---------------------------------------------------------------------------------------------
// Parser

const isNameFirst = (c: number) =>
  (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || c === 0x5f || (c >= 0x80 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0x10ffff);
const isDigit = (c: number) => c >= 0x30 && c <= 0x39;
const isNameChar = (c: number) => isNameFirst(c) || isDigit(c);

class Parser {
  i = 0;
  readonly s: string;
  constructor(s: string) {
    this.s = s;
  }

  fail(message: string, at = this.i): never {
    throw new JsonPathError(message, at);
  }
  peek(k = 0) {
    return this.s[this.i + k];
  }
  describe(at = this.i): string {
    if (at >= this.s.length) return 'end of query';
    return `'${String.fromCodePoint(this.s.codePointAt(at)!)}'`;
  }
  ws() {
    while (this.i < this.s.length && ' \t\n\r'.includes(this.s[this.i])) this.i++;
  }
  eat(t: string): boolean {
    if (this.s.startsWith(t, this.i)) {
      this.i += t.length;
      return true;
    }
    return false;
  }
  expect(t: string, what = `'${t}'`) {
    if (!this.eat(t)) this.fail(`Expected ${what} but found ${this.describe()}`);
  }

  query(): Query {
    this.ws();
    if (this.i !== 0) this.fail('A JSONPath query can’t start with whitespace', 0);
    if (this.peek() !== '$') this.fail(`A query must start with '$' but found ${this.describe()}`);
    this.i++;
    const q: Query = { root: '$', segments: this.segments() };
    if (this.i < this.s.length) {
      if (' \t\n\r'.includes(this.s[this.i])) this.fail('Unexpected whitespace at the end of the query');
      this.fail(`Unexpected ${this.describe()} — expected '.', '..' or '['`);
    }
    return q;
  }

  segments(): Segment[] {
    const out: Segment[] = [];
    for (;;) {
      const save = this.i;
      this.ws();
      const c = this.peek();
      if (c !== '.' && c !== '[') {
        this.i = save;
        return out;
      }
      out.push(this.segment());
    }
  }

  segment(): Segment {
    if (this.eat('..')) {
      if (this.peek() === '[') return { descendant: true, selectors: this.bracketed() };
      if (this.eat('*')) return { descendant: true, selectors: [{ t: 'wild' }] };
      if (this.nameStart()) return { descendant: true, selectors: [{ t: 'name', name: this.shorthand() }] };
      this.fail(`Expected a name, '*' or '[' after '..' but found ${this.describe()}`);
    }
    if (this.eat('.')) {
      if (this.eat('*')) return { descendant: false, selectors: [{ t: 'wild' }] };
      if (this.nameStart()) return { descendant: false, selectors: [{ t: 'name', name: this.shorthand() }] };
      if (isDigit(this.s.charCodeAt(this.i))) this.fail('Member names can’t start with a digit — use [0] for array indexes or [\'0\'] for names');
      this.fail(`Expected a member name or '*' after '.' but found ${this.describe()}`);
    }
    return { descendant: false, selectors: this.bracketed() };
  }

  nameStart() {
    const c = this.s.codePointAt(this.i);
    return c !== undefined && isNameFirst(c);
  }
  shorthand(): string {
    const start = this.i;
    while (this.i < this.s.length) {
      const c = this.s.codePointAt(this.i)!;
      if (!isNameChar(c)) break;
      this.i += c > 0xffff ? 2 : 1;
    }
    return this.s.slice(start, this.i);
  }

  bracketed(): Selector[] {
    const open = this.i;
    this.expect('[');
    const sels: Selector[] = [];
    for (;;) {
      this.ws();
      sels.push(this.selector());
      this.ws();
      if (this.eat(']')) return sels;
      if (this.eat(',')) continue;
      if (this.i >= this.s.length) this.fail(`Unclosed '[' — expected ']'`, open);
      this.fail(`Expected ',' or ']' but found ${this.describe()}`);
    }
  }

  selector(): Selector {
    const c = this.peek();
    if (c === "'" || c === '"') return { t: 'name', name: this.string() };
    if (this.eat('*')) return { t: 'wild' };
    if (c === '?') {
      this.i++;
      this.ws();
      return { t: 'filter', expr: this.or() };
    }
    if (c === '-' || c === ':' || isDigit(this.s.charCodeAt(this.i))) {
      const start = c === ':' ? null : this.int();
      this.ws();
      if (this.peek() !== ':') {
        if (start === null) this.fail('Expected an index');
        return { t: 'index', index: start };
      }
      this.i++;
      this.ws();
      const end = this.peek() === '-' || isDigit(this.s.charCodeAt(this.i)) ? this.int() : null;
      this.ws();
      let step: number | null = null;
      if (this.eat(':')) {
        this.ws();
        if (this.peek() === '-' || isDigit(this.s.charCodeAt(this.i))) step = this.int();
      }
      return { t: 'slice', start, end, step };
    }
    if (c === undefined || c === ']') this.fail('Expected a selector (a name, index, slice, * or ?filter)');
    if (this.nameStart()) this.fail('Names in brackets must be quoted, like [\'name\']');
    this.fail(`Unexpected ${this.describe()} — expected a selector`);
  }

  int(): number {
    const m = /^-?(?:0|[1-9]\d*)/.exec(this.s.slice(this.i));
    if (!m) this.fail(`Expected an integer but found ${this.describe()}`);
    if (m[0] === '-0') this.fail('-0 isn’t a valid index');
    if (isDigit(this.s.charCodeAt(this.i + m[0].length))) this.fail('Integers can’t have leading zeros');
    const n = Number(m[0]);
    if (Math.abs(n) > MAX_INT) this.fail('Integer is out of range (beyond ±2^53−1)');
    this.i += m[0].length;
    return n;
  }

  string(): string {
    const q = this.s[this.i];
    const start = this.i;
    this.i++;
    let out = '';
    for (;;) {
      if (this.i >= this.s.length) this.fail('Unterminated string', start);
      const ch = this.s[this.i];
      const code = this.s.charCodeAt(this.i);
      if (ch === q) {
        this.i++;
        return out;
      }
      if (code < 0x20) this.fail('Control characters must be escaped in strings');
      if (ch !== '\\') {
        out += ch;
        this.i++;
        continue;
      }
      const e = this.s[this.i + 1];
      const simple: Record<string, string> = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', '/': '/', '\\': '\\' };
      if (e === q) out += q;
      else if (simple[e]) out += simple[e];
      else if (e === 'u') {
        const hi = this.hex4(this.i + 2);
        this.i += 6;
        if (hi >= 0xdc00 && hi <= 0xdfff) this.fail('Lone low surrogate in \\u escape', this.i - 6);
        if (hi >= 0xd800 && hi <= 0xdbff) {
          if (this.s[this.i] !== '\\' || this.s[this.i + 1] !== 'u') this.fail('High surrogate must be followed by a low surrogate \\u escape', this.i - 6);
          const lo = this.hex4(this.i + 2);
          if (lo < 0xdc00 || lo > 0xdfff) this.fail('High surrogate must be followed by a low surrogate \\u escape', this.i);
          this.i += 6;
          out += String.fromCharCode(hi, lo);
        } else out += String.fromCharCode(hi);
        continue;
      } else this.fail(`Invalid escape '\\${e ?? ''}' in string`);
      this.i += 2;
    }
  }
  hex4(at: number): number {
    const h = this.s.slice(at, at + 4);
    if (!/^[0-9A-Fa-f]{4}$/.test(h)) this.fail('\\u must be followed by 4 hex digits', at - 2);
    return parseInt(h, 16);
  }

  // --- filter expressions ---

  or(): Logical {
    const items = [this.and()];
    for (;;) {
      const save = this.i;
      this.ws();
      if (!this.eat('||')) {
        this.i = save;
        break;
      }
      this.ws();
      items.push(this.and());
    }
    return items.length === 1 ? items[0] : { t: 'or', items };
  }

  and(): Logical {
    const items = [this.basic()];
    for (;;) {
      const save = this.i;
      this.ws();
      if (!this.eat('&&')) {
        this.i = save;
        break;
      }
      this.ws();
      items.push(this.basic());
    }
    return items.length === 1 ? items[0] : { t: 'and', items };
  }

  basic(): Logical {
    if (this.eat('!')) {
      this.ws();
      if (this.eat('(')) return { t: 'not', expr: this.paren() };
      const at = this.i;
      const operand = this.operand();
      const test = this.asTest(operand, at);
      this.noComparisonAfterTest();
      return { t: 'not', expr: test };
    }
    if (this.peek() === '(') {
      this.i++;
      return this.paren();
    }
    const at = this.i;
    const left = this.operand();
    const save = this.i;
    this.ws();
    const op = this.cmpOp();
    if (!op) {
      this.i = save;
      return this.asTest(left, at);
    }
    this.ws();
    const rat = this.i;
    const right = this.operand();
    const lc = this.asComparable(left, at);
    const rc = this.asComparable(right, rat);
    const save2 = this.i;
    this.ws();
    if (this.cmpOp()) this.fail('Comparisons can’t be chained — combine them with && or ||', save2);
    this.i = save2;
    return { t: 'cmp', op, left: lc, right: rc };
  }

  noComparisonAfterTest() {
    const save = this.i;
    this.ws();
    if (this.cmpOp()) this.fail('A negated test can’t be compared — put the comparison in parentheses: !(a == b)', save);
    this.i = save;
  }

  paren(): Logical {
    this.ws();
    const e = this.or();
    this.ws();
    this.expect(')');
    return e;
  }

  cmpOp(): CmpOp | null {
    for (const op of ['==', '!=', '<=', '>=', '<', '>'] as CmpOp[]) if (this.eat(op)) return op;
    if (this.peek() === '=') this.fail("Use '==' to compare, not '='");
    return null;
  }

  /** A literal, query or function call — typed later by how it's used. */
  operand(): { t: 'lit'; value: unknown } | { t: 'query'; query: Query } | { t: 'fn'; fn: FnCall; type: FnType } {
    const c = this.peek();
    if (c === '@' || c === '$') return { t: 'query', query: this.filterQuery() };
    if (c === "'" || c === '"') return { t: 'lit', value: this.string() };
    if (c === '-' || isDigit(this.s.charCodeAt(this.i))) return { t: 'lit', value: this.number() };
    const word = /^[a-z][a-z0-9_]*/.exec(this.s.slice(this.i))?.[0];
    if (word) {
      const next = this.s.charCodeAt(this.i + word.length);
      if ((word === 'true' || word === 'false' || word === 'null') && !isNameChar(next) && this.s[this.i + word.length] !== '(') {
        this.i += word.length;
        return { t: 'lit', value: word === 'true' ? true : word === 'false' ? false : null };
      }
      if (this.s[this.i + word.length] === '(') return this.fnCall(word);
      this.fail(`Unknown name '${word}' — did you mean @.${word}?`);
    }
    if (c === undefined) this.fail('Unexpected end of query — expected a filter expression');
    this.fail(`Unexpected ${this.describe()} in filter — expected @, $, a literal or a function`);
  }

  filterQuery(): Query {
    const root = this.s[this.i] as '$' | '@';
    this.i++;
    return { root, segments: this.segments() };
  }

  number(): number {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.s.slice(this.i));
    if (!m) this.fail(`Invalid number`);
    const after = this.s.charCodeAt(this.i + m[0].length);
    if (isNameChar(after) || this.s[this.i + m[0].length] === '.') this.fail('Invalid number', this.i);
    this.i += m[0].length;
    return Number(m[0]);
  }

  fnCall(name: string): { t: 'fn'; fn: FnCall; type: FnType } {
    const at = this.i;
    const def = FUNCTIONS[name as FnName];
    if (!def) this.fail(`Unknown function '${name}()' — available: length, count, match, search, value`, at);
    this.i += name.length + 1;
    const args: FnArg[] = [];
    this.ws();
    if (!this.eat(')')) {
      for (;;) {
        this.ws();
        const aat = this.i;
        const param = def.params[args.length];
        if (!param) this.fail(`${name}() takes ${def.params.length} argument${def.params.length > 1 ? 's' : ''}`, aat);
        const op = this.operand();
        if (param === 'nodes') {
          if (op.t !== 'query') this.fail(`${name}() needs a query like @.items as its argument`, aat);
          args.push({ t: 'nodes', query: op.query });
        } else args.push({ t: 'value', c: this.asComparable(op, aat, `${name}() needs a single value here (a literal, a singular query or length/count/value)`) });
        this.ws();
        if (this.eat(')')) break;
        this.expect(',', "',' or ')'");
      }
    }
    if (args.length !== def.params.length) this.fail(`${name}() takes ${def.params.length} argument${def.params.length > 1 ? 's' : ''}`, at);
    return { t: 'fn', fn: { name: name as FnName, args }, type: def.result };
  }

  asComparable(op: ReturnType<Parser['operand']>, at: number, msg?: string): Comparable {
    if (op.t === 'lit') return op;
    if (op.t === 'query') {
      if (!isSingular(op.query)) this.fail(msg ?? 'Only singular queries (names and indexes, no wildcards, slices, filters or ..) can be compared', at);
      return { t: 'sq', query: op.query };
    }
    if (op.type !== 'value') this.fail(msg ?? `${op.fn.name}() returns true/false and can’t be compared — use it on its own`, at);
    return { t: 'fn', fn: op.fn };
  }

  asTest(op: ReturnType<Parser['operand']>, at: number): Logical {
    if (op.t === 'query') return { t: 'exists', query: op.query };
    if (op.t === 'fn') {
      if (op.type === 'value') this.fail(`${op.fn.name}() returns a value — compare it, e.g. ${op.fn.name}(…) > 0`, at);
      return { t: 'fnTest', fn: op.fn };
    }
    this.fail('A literal on its own isn’t a test — compare it with something', at);
  }
}

function isSingular(q: Query): boolean {
  return q.segments.every((s) => !s.descendant && s.selectors.length === 1 && (s.selectors[0].t === 'name' || s.selectors[0].t === 'index'));
}

export function parseQuery(query: string): Query {
  return new Parser(query).query();
}

// ---------------------------------------------------------------------------------------------
// Evaluation

interface Node {
  value: unknown;
  parent: Node | null;
  key: string | number;
}

const NOTHING = Symbol('Nothing');
type Val = unknown | typeof NOTHING;

/** Evaluation stops when this many nodes are produced (e.g. $..* on a huge document). */
export const MAX_NODES = 1_000_000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const hasOwn = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

function children(n: Node, out: Node[]) {
  const v = n.value;
  if (Array.isArray(v)) for (let i = 0; i < v.length; i++) out.push({ value: v[i], parent: n, key: i });
  else if (isObj(v)) for (const k of Object.keys(v)) out.push({ value: v[k], parent: n, key: k });
}

function sliceIndexes(len: number, sel: Extract<Selector, { t: 'slice' }>): number[] {
  const step = sel.step ?? 1;
  if (step === 0) return [];
  const norm = (i: number) => (i >= 0 ? i : len + i);
  const out: number[] = [];
  if (step > 0) {
    const lower = Math.min(Math.max(norm(sel.start ?? 0), 0), len);
    const upper = Math.min(Math.max(norm(sel.end ?? len), 0), len);
    for (let i = lower; i < upper; i += step) out.push(i);
  } else {
    const upper = Math.min(Math.max(norm(sel.start ?? len - 1), -1), len - 1);
    const lower = Math.min(Math.max(sel.end === null ? -1 : norm(sel.end), -1), len - 1);
    for (let i = upper; lower < i; i += step) out.push(i);
  }
  return out;
}

class Evaluator {
  produced = 0;
  private regexCache = new Map<string, RegExp | null>();
  private readonly root: Node;
  constructor(root: Node) {
    this.root = root;
  }

  count(n: number) {
    this.produced += n;
    if (this.produced > MAX_NODES) throw new JsonPathError(`The query produced more than ${MAX_NODES.toLocaleString('en-US')} nodes — narrow it down`, 0);
  }

  run(q: Query, current: Node): Node[] {
    let nodes = [q.root === '$' ? this.root : current];
    for (const seg of q.segments) {
      const next: Node[] = [];
      for (const n of nodes) {
        if (seg.descendant) {
          // Pre-order: a node before its descendants, array elements in order.
          const stack = [n];
          while (stack.length) {
            const d = stack.pop()!;
            for (const sel of seg.selectors) this.select(sel, d, next);
            const kids: Node[] = [];
            children(d, kids);
            for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
          }
        } else for (const sel of seg.selectors) this.select(sel, n, next);
      }
      this.count(next.length);
      nodes = next;
    }
    return nodes;
  }

  select(sel: Selector, n: Node, out: Node[]) {
    const v = n.value;
    switch (sel.t) {
      case 'name':
        if (isObj(v) && hasOwn(v, sel.name)) out.push({ value: v[sel.name], parent: n, key: sel.name });
        return;
      case 'wild':
        children(n, out);
        return;
      case 'index':
        if (Array.isArray(v)) {
          const i = sel.index < 0 ? v.length + sel.index : sel.index;
          if (i >= 0 && i < v.length) out.push({ value: v[i], parent: n, key: i });
        }
        return;
      case 'slice':
        if (Array.isArray(v)) for (const i of sliceIndexes(v.length, sel)) out.push({ value: v[i], parent: n, key: i });
        return;
      case 'filter': {
        const kids: Node[] = [];
        children(n, kids);
        for (const k of kids) if (this.test(sel.expr, k)) out.push(k);
      }
    }
  }

  test(e: Logical, cur: Node): boolean {
    switch (e.t) {
      case 'or':
        return e.items.some((x) => this.test(x, cur));
      case 'and':
        return e.items.every((x) => this.test(x, cur));
      case 'not':
        return !this.test(e.expr, cur);
      case 'exists':
        return this.run(e.query, cur).length > 0;
      case 'fnTest':
        return this.call(e.fn, cur) === true;
      case 'cmp':
        return compare(e.op, this.value(e.left, cur), this.value(e.right, cur));
    }
  }

  value(c: Comparable, cur: Node): Val {
    if (c.t === 'lit') return c.value;
    if (c.t === 'sq') {
      const r = this.run(c.query, cur);
      return r.length === 1 ? r[0].value : NOTHING;
    }
    return this.call(c.fn, cur);
  }

  call(fn: FnCall, cur: Node): Val {
    const arg = (i: number): Val => {
      const a = fn.args[i];
      return a.t === 'value' ? this.value(a.c, cur) : NOTHING;
    };
    const nodes = (i: number): Node[] => {
      const a = fn.args[i];
      return a.t === 'nodes' ? this.run(a.query, cur) : [];
    };
    switch (fn.name) {
      case 'length': {
        const v = arg(0);
        if (typeof v === 'string') return [...v].length;
        if (Array.isArray(v)) return v.length;
        if (isObj(v)) return Object.keys(v).length;
        return NOTHING;
      }
      case 'count':
        return nodes(0).length;
      case 'value': {
        const r = nodes(0);
        return r.length === 1 ? r[0].value : NOTHING;
      }
      case 'match':
      case 'search': {
        const s = arg(0);
        const p = arg(1);
        if (typeof s !== 'string' || typeof p !== 'string') return false;
        const re = this.regex(p, fn.name === 'match');
        return re ? re.test(s) : false;
      }
    }
  }

  regex(pattern: string, full: boolean): RegExp | null {
    const key = `${full ? 'm' : 's'}:${pattern}`;
    if (this.regexCache.has(key)) return this.regexCache.get(key)!;
    let re: RegExp | null = null;
    try {
      const src = iRegexpToJs(pattern);
      re = new RegExp(full ? `^(?:${src})$` : src, 'u');
    } catch {
      re = null;
    }
    this.regexCache.set(key, re);
    return re;
  }
}

/** I-Regexp (RFC 9485) → JS: '.' outside a class matches anything but \n and \r. */
export function iRegexpToJs(p: string): string {
  let out = '';
  let inClass = false;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '\\') {
      out += c + (p[i + 1] ?? '');
      i++;
    } else if (inClass) {
      if (c === ']') inClass = false;
      out += c;
    } else if (c === '[') {
      inClass = true;
      out += c;
    } else if (c === '.') out += '[^\\n\\r]';
    else out += c;
  }
  return out;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (isObj(a)) {
    if (!isObj(b)) return false;
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => hasOwn(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

function codePointLess(a: string, b: string): boolean {
  const ia = a[Symbol.iterator]();
  const ib = b[Symbol.iterator]();
  for (;;) {
    const x = ia.next();
    const y = ib.next();
    if (x.done) return !y.done;
    if (y.done) return false;
    const cx = x.value.codePointAt(0)!;
    const cy = y.value.codePointAt(0)!;
    if (cx !== cy) return cx < cy;
  }
}

function eq(a: Val, b: Val): boolean {
  if (a === NOTHING || b === NOTHING) return a === b;
  return deepEqual(a, b);
}
function lt(a: Val, b: Val): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a < b;
  if (typeof a === 'string' && typeof b === 'string') return codePointLess(a, b);
  return false;
}
function compare(op: CmpOp, a: Val, b: Val): boolean {
  switch (op) {
    case '==':
      return eq(a, b);
    case '!=':
      return !eq(a, b);
    case '<':
      return lt(a, b);
    case '<=':
      return lt(a, b) || eq(a, b);
    case '>':
      return lt(b, a);
    case '>=':
      return lt(b, a) || eq(a, b);
  }
}

/** Normalized path (RFC 9535 §2.7), e.g. $['store']['book'][0]. */
export function normalizedPath(keys: (string | number)[]): string {
  let s = '$';
  for (const k of keys) {
    if (typeof k === 'number') s += `[${k}]`;
    else {
      // eslint-disable-next-line no-control-regex -- control characters are exactly what gets escaped
      const esc = k.replace(/[\u0000-\u001f'\\]/g, (c) => {
        const map: Record<string, string> = { '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t', "'": "\\'", '\\': '\\\\' };
        return map[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
      });
      s += `['${esc}']`;
    }
  }
  return s;
}

function pathOf(n: Node): (string | number)[] {
  const keys: (string | number)[] = [];
  for (let x: Node | null = n; x && x.parent; x = x.parent) keys.push(x.key);
  return keys.reverse();
}

export interface Match {
  path: string;
  value: unknown;
}

/** Runs a parsed or textual query against a JSON value. */
export function evaluate(query: string | Query, doc: unknown): Match[] {
  const q = typeof query === 'string' ? parseQuery(query) : query;
  const root: Node = { value: doc, parent: null, key: '' };
  return new Evaluator(root).run(q, root).map((n) => ({ path: normalizedPath(pathOf(n)), value: n.value }));
}
