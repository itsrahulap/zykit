// Value formatting for the JS Runner console (a small `util.inspect`).
//
// IMPORTANT: `createFormatter` is serialised with `Function.prototype.toString()` and injected
// into the worker script, so it must be completely self-contained: no imports, no references to
// anything outside its own body, and nothing a bundler might rewrite into a shared helper.

export interface Formatter {
  /** Formats any value the way `console.dir` would (strings quoted). */
  inspect: (value: unknown) => string;
  /** Formats `console.log` arguments: printf-style directives, strings raw at top level. */
  formatArgs: (args: unknown[]) => string;
}

export interface FormatterOptions {
  /** Nesting depth before objects collapse to `[Object]`. */
  depth?: number;
  /** Items shown per array / map / set / object before "... N more items". */
  maxItems?: number;
  /** Width at which a collection breaks onto several lines. */
  breakLength?: number;
}

export function createFormatter(options?: FormatterOptions): Formatter {
  const maxDepth = options && typeof options.depth === 'number' ? options.depth : 4;
  const maxItems = options && typeof options.maxItems === 'number' ? options.maxItems : 100;
  const breakLength = options && typeof options.breakLength === 'number' ? options.breakLength : 72;
  const MAX_NODES = 5000;

  const toStr = Object.prototype.toString;
  const IDENT = /^[A-Za-z_$][\w$]*$/;

  function quote(s: string): string {
    return (
      "'" +
      s
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t') +
      "'"
    );
  }

  function num(n: number): string {
    return Object.is(n, -0) ? '-0' : String(n);
  }

  function safe<T>(fn: () => T, fallback: T): T {
    try {
      return fn();
    } catch {
      return fallback;
    }
  }

  function ctorName(obj: object): string | null {
    const proto = safe(() => Object.getPrototypeOf(obj), null);
    if (proto === null) return null;
    const c = safe(() => (proto as { constructor?: unknown }).constructor, undefined);
    return typeof c === 'function' && typeof c.name === 'string' ? c.name : '';
  }

  function fnLabel(fn: Function): string {
    const src = safe(() => Function.prototype.toString.call(fn), '');
    const name = safe(() => fn.name, '');
    if (/^class[\s{]/.test(src)) return name ? '[class ' + name + ']' : '[class (anonymous)]';
    const kind = /^async\s/.test(src) ? 'AsyncFunction' : /^(async\s+)?function\s*\*/.test(src) ? 'GeneratorFunction' : 'Function';
    return name ? '[' + kind + ': ' + name + ']' : '[' + kind + ' (anonymous)]';
  }

  function errorText(err: Error): string {
    const name = safe(() => String(err.name), 'Error');
    const message = safe(() => String(err.message), '');
    const head = message ? name + ': ' + message : name;
    const stack = safe(() => (typeof err.stack === 'string' ? err.stack : ''), '');
    if (!stack) return head;
    // V8 stacks start with "Name: message"; Firefox/Safari stacks are frames only.
    const body = stack.indexOf(head) === 0 || stack.indexOf(name) === 0 ? stack : head + '\n' + stack;
    return body.replace(/\s+$/, '');
  }

  function keyLabel(k: string | symbol): string {
    if (typeof k === 'symbol') return '[' + k.toString() + ']';
    return IDENT.test(k) ? k : quote(k);
  }

  function wrap(prefix: string, open: string, parts: string[], close: string, indent: string): string {
    if (parts.length === 0) return prefix + open + close;
    const oneLine = prefix + open + ' ' + parts.join(', ') + ' ' + close;
    if (oneLine.length <= breakLength && oneLine.indexOf('\n') === -1) return oneLine;
    const inner = indent + '  ';
    return prefix + open + '\n' + parts.map((p) => inner + p).join(',\n') + '\n' + indent + close;
  }

  function inspectValue(v: unknown, depth: number, seen: unknown[], indent: string, budget: { nodes: number }): string {
    switch (typeof v) {
      case 'string':
        return quote(v);
      case 'number':
        return num(v);
      case 'bigint':
        return String(v) + 'n';
      case 'boolean':
      case 'undefined':
        return String(v);
      case 'symbol':
        return v.toString();
      case 'function':
        return fnLabel(v);
    }
    if (v === null) return 'null';
    const obj = v as object;
    if (seen.indexOf(obj) !== -1) return '[Circular]';
    budget.nodes++;
    if (budget.nodes > MAX_NODES) return '…';

    const tag = safe(() => toStr.call(obj), '[object Object]');
    const cname = ctorName(obj);

    if (obj instanceof Error || tag === '[object Error]') {
      const text = errorText(obj as Error);
      if (depth === 0) return text;
      return '[' + text.split('\n')[0] + ']';
    }
    if (tag === '[object Date]') {
      const t = (obj as Date).getTime();
      return isNaN(t) ? 'Invalid Date' : (obj as Date).toISOString();
    }
    if (tag === '[object RegExp]') return String(obj);
    if (tag === '[object Number]') return '[Number: ' + num((obj as Number).valueOf()) + ']';
    if (tag === '[object String]') return '[String: ' + quote((obj as String).valueOf()) + ']';
    if (tag === '[object Boolean]') return '[Boolean: ' + String((obj as Boolean).valueOf()) + ']';
    if (tag === '[object Symbol]') return '[Symbol: ' + (obj as Symbol).valueOf().toString() + ']';
    if (tag === '[object BigInt]') return '[BigInt: ' + String((obj as BigInt).valueOf()) + 'n]';
    if (tag === '[object Promise]') return 'Promise { <state hidden> }';
    if (tag === '[object WeakMap]' || tag === '[object WeakSet]') return (cname || 'WeakMap') + ' { <items unknown> }';
    if (tag === '[object ArrayBuffer]' || tag === '[object SharedArrayBuffer]') {
      return (cname || 'ArrayBuffer') + ' { byteLength: ' + (obj as ArrayBuffer).byteLength + ' }';
    }

    const isArray = Array.isArray(obj);
    const isTyped = ArrayBuffer.isView(obj) && !(tag === '[object DataView]');
    const isMap = tag === '[object Map]';
    const isSet = tag === '[object Set]';

    if (depth > maxDepth) {
      if (isArray) return '[Array]';
      if (isMap || isSet) return '[' + (cname || (isMap ? 'Map' : 'Set')) + ']';
      return '[' + (cname || 'Object') + ']';
    }

    seen.push(obj);
    const next = indent + '  ';
    const sub = (x: unknown) => inspectValue(x, depth + 1, seen, next, budget);
    const parts: string[] = [];
    let result: string;
    try {
      if (isArray || isTyped) {
        const arr = obj as ArrayLike<unknown>;
        const len = arr.length;
        const shown = Math.min(len, maxItems);
        let holes = 0;
        for (let i = 0; i < shown; i++) {
          if (!isTyped && !(i in arr)) {
            holes++;
            continue;
          }
          if (holes) {
            parts.push('<' + holes + ' empty item' + (holes > 1 ? 's' : '') + '>');
            holes = 0;
          }
          parts.push(sub(arr[i]));
        }
        if (holes) parts.push('<' + holes + ' empty item' + (holes > 1 ? 's' : '') + '>');
        if (len > shown) parts.push('... ' + (len - shown) + ' more item' + (len - shown > 1 ? 's' : ''));
        const prefix = isTyped ? (cname || 'TypedArray') + '(' + len + ') ' : cname && cname !== 'Array' ? cname + '(' + len + ') ' : '';
        result = wrap(prefix, '[', parts, ']', indent);
      } else if (isMap || isSet) {
        const coll = obj as Map<unknown, unknown> | Set<unknown>;
        let i = 0;
        const size = coll.size;
        if (isMap) {
          (coll as Map<unknown, unknown>).forEach((val, key) => {
            if (i++ < maxItems) parts.push(sub(key) + ' => ' + sub(val));
          });
        } else {
          (coll as Set<unknown>).forEach((val) => {
            if (i++ < maxItems) parts.push(sub(val));
          });
        }
        if (size > maxItems) parts.push('... ' + (size - maxItems) + ' more item' + (size - maxItems > 1 ? 's' : ''));
        result = wrap((cname || (isMap ? 'Map' : 'Set')) + '(' + size + ') ', '{', parts, '}', indent);
      } else {
        const keys: (string | symbol)[] = safe(() => Reflect.ownKeys(obj), [] as (string | symbol)[]);
        let shown = 0;
        let total = 0;
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const d = safe(() => Object.getOwnPropertyDescriptor(obj, k), undefined);
          if (!d || !d.enumerable) continue;
          total++;
          if (shown >= maxItems) continue;
          shown++;
          let val: string;
          if (d.get || d.set) val = d.get && d.set ? '[Getter/Setter]' : d.get ? '[Getter]' : '[Setter]';
          else val = sub(d.value);
          parts.push(keyLabel(k) + ': ' + val);
        }
        if (total > shown) parts.push('... ' + (total - shown) + ' more item' + (total - shown > 1 ? 's' : ''));
        const prefix = cname === null ? '[Object: null prototype] ' : cname && cname !== 'Object' ? cname + ' ' : '';
        result = wrap(prefix, '{', parts, '}', indent);
      }
    } finally {
      seen.pop();
    }
    return result;
  }

  function inspect(v: unknown): string {
    return inspectValue(v, 0, [], '', { nodes: 0 });
  }

  /** Top-level: strings print raw, everything else is inspected. */
  function plain(v: unknown): string {
    return typeof v === 'string' ? v : inspect(v);
  }

  function formatArgs(args: unknown[]): string {
    if (args.length === 0) return '';
    let rest = args;
    let out = '';
    const first = args[0];
    if (typeof first === 'string' && first.indexOf('%') !== -1) {
      let idx = 1;
      out = first.replace(/%([sdifoOjc%])/g, (m, ch: string) => {
        if (ch === '%') return '%';
        if (idx >= args.length) return m;
        const a = args[idx++];
        switch (ch) {
          case 's':
            if (typeof a === 'string') return a;
            if (typeof a === 'bigint') return String(a) + 'n';
            if (typeof a === 'symbol') return a.toString();
            if (a !== null && typeof a === 'object') return inspect(a);
            return typeof a === 'number' ? num(a) : String(a);
          case 'd':
          case 'i': {
            if (typeof a === 'bigint') return String(a) + 'n';
            if (typeof a === 'symbol') return 'NaN';
            const n = Number(a);
            return num(ch === 'i' ? Math.trunc(n) : n);
          }
          case 'f':
            return typeof a === 'symbol' ? 'NaN' : num(parseFloat(String(a)));
          case 'o':
          case 'O':
            return inspect(a);
          case 'j':
            try {
              const j = JSON.stringify(a);
              return j === undefined ? 'undefined' : j;
            } catch {
              return '[Circular]';
            }
          case 'c':
            return ''; // CSS styling is ignored
        }
        return m;
      });
      rest = args.slice(idx);
    } else {
      out = plain(first);
      rest = args.slice(1);
    }
    for (let i = 0; i < rest.length; i++) out += ' ' + plain(rest[i]);
    return out;
  }

  return { inspect, formatArgs };
}
