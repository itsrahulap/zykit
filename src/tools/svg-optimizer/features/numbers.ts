// Number formatting and path-data rounding for the SVG optimizer.

/** Shortest decimal for `n` rounded to `precision` places: 0.50 → .5, -0 → 0, no exponents. */
export function formatNumber(n: number, precision: number): string {
  let r = Number(n.toFixed(precision));
  if (Object.is(r, -0)) r = 0;
  let s = String(r);
  if (s.includes('e')) s = r.toFixed(precision).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s.replace(/^(-?)0\./, '$1.');
}

/** Join numbers with the fewest separators: "10-5.5.5" is 10, -5.5, .5. */
export function joinNumbers(parts: string[]): string {
  let out = '';
  parts.forEach((p, i) => {
    if (i > 0) {
      const prev = parts[i - 1];
      const needsSpace = !(p.startsWith('-') || (p.startsWith('.') && prev.includes('.')));
      if (needsSpace) out += ' ';
    }
    out += p;
  });
  return out;
}

const NUM = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/y;
const SEP = /[\s,]*/y;
const ARITY: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

export interface PathSegment {
  /** Command letter as written (case = absolute/relative). */
  cmd: string;
  /** All parameter groups for this command, flattened. */
  args: number[];
}

/** Parse path data. Returns null for anything malformed (the caller then leaves `d` untouched). */
export function parsePath(d: string): PathSegment[] | null {
  const segs: PathSegment[] = [];
  let i = 0;
  const skip = () => {
    SEP.lastIndex = i;
    SEP.exec(d);
    i = SEP.lastIndex;
  };
  const num = (): number | null => {
    NUM.lastIndex = i;
    const m = NUM.exec(d);
    if (!m) return null;
    i = NUM.lastIndex;
    return Number(m[0]);
  };
  const flag = (): number | null => {
    if (d[i] === '0' || d[i] === '1') return Number(d[i++]);
    return null;
  };
  skip();
  while (i < d.length) {
    const cmd = d[i];
    const lower = cmd.toLowerCase();
    if (!(lower in ARITY)) return null;
    if (!segs.length && lower !== 'm') return null;
    i++;
    const arity = ARITY[lower];
    const args: number[] = [];
    if (arity === 0) {
      segs.push({ cmd, args });
      skip();
      continue;
    }
    for (;;) {
      skip();
      if (i >= d.length || /[A-Za-z]/.test(d[i])) break;
      for (let k = 0; k < arity; k++) {
        if (k > 0) skip();
        const v = lower === 'a' && (k === 3 || k === 4) ? flag() : num();
        if (v === null || !Number.isFinite(v)) return null;
        args.push(v);
      }
    }
    if (!args.length) return null;
    segs.push({ cmd, args });
  }
  return segs;
}

/**
 * Round path data to `precision` decimals. Relative coordinates are rounded against the already
 * rounded current point, so rounding errors don't accumulate along long relative paths.
 */
export function roundPath(d: string, precision: number): string | null {
  const segs = parsePath(d);
  if (!segs) return null;
  const f = (n: number) => formatNumber(n, precision);
  const r = (n: number) => Number(n.toFixed(precision));
  // True and rounded current point, and subpath start.
  let x = 0, y = 0, rx = 0, ry = 0, sx = 0, sy = 0, srx = 0, sry = 0;
  const out: string[] = [];

  for (const { cmd, args } of segs) {
    const lower = cmd.toLowerCase();
    const rel = cmd === lower;
    const parts: string[] = [];
    if (lower === 'z') {
      [x, y, rx, ry] = [sx, sy, srx, sry];
      out.push(cmd);
      continue;
    }
    const arity = ARITY[lower];
    for (let g = 0; g < args.length; g += arity) {
      const a = args.slice(g, g + arity);
      // Emit a coordinate pair (index into `a`); returns the true and rounded absolute point.
      const pair = (k: number) => {
        const ax = rel ? x + a[k] : a[k];
        const ay = rel ? y + a[k + 1] : a[k + 1];
        const ox = rel ? r(ax - rx) : r(ax);
        const oy = rel ? r(ay - ry) : r(ay);
        parts.push(f(ox), f(oy));
        return { ax, ay, bx: rel ? rx + ox : ox, by: rel ? ry + oy : oy };
      };
      let end: { ax: number; ay: number; bx: number; by: number };
      switch (lower) {
        case 'h': {
          const ax = rel ? x + a[0] : a[0];
          const o = rel ? r(ax - rx) : r(ax);
          parts.push(f(o));
          end = { ax, ay: y, bx: rel ? rx + o : o, by: ry };
          break;
        }
        case 'v': {
          const ay = rel ? y + a[0] : a[0];
          const o = rel ? r(ay - ry) : r(ay);
          parts.push(f(o));
          end = { ax: x, ay, bx: rx, by: rel ? ry + o : o };
          break;
        }
        case 'a':
          parts.push(f(a[0]), f(a[1]), f(a[2]), String(a[3]), String(a[4]));
          end = pair(5);
          break;
        default:
          for (let k = 0; k < arity - 2; k += 2) pair(k);
          end = pair(arity - 2);
      }
      [x, y, rx, ry] = [end.ax, end.ay, end.bx, end.by];
      if (lower === 'm' && g === 0) [sx, sy, srx, sry] = [x, y, rx, ry];
    }
    out.push(cmd + joinNumbers(parts));
  }
  return out.join('');
}

/** Round every number in a list-valued attribute (viewBox, points, stroke-dasharray). */
export function roundList(value: string, precision: number): string | null {
  const items = value.trim().split(/[\s,]+/);
  if (!items.length || items.some((v) => !/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(v))) return null;
  return items.map((v) => formatNumber(Number(v), precision)).join(' ');
}

/** Round the numbers inside a transform list, e.g. "matrix(0.70710678 0.70710678 …)". */
export function roundTransform(value: string, precision: number): string {
  return value
    .replace(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi, (m) => formatNumber(Number(m), precision))
    .replace(/\s*,\s*/g, ' ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True for identity transforms: translate(0), scale(1), rotate(0), matrix(1 0 0 1 0 0), skewX(0)… */
export function isIdentityTransform(value: string): boolean {
  const fns = [...value.matchAll(/(\w+)\s*\(([^)]*)\)/g)];
  if (!fns.length || value.replace(/(\w+)\s*\(([^)]*)\)/g, '').trim().replace(/,/g, '') !== '') return false;
  return fns.every(([, name, args]) => {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (n.some((v) => !Number.isFinite(v))) return false;
    switch (name) {
      case 'translate':
        return n.every((v) => v === 0);
      case 'scale':
        return n.every((v) => v === 1);
      case 'rotate':
      case 'skewX':
      case 'skewY':
        return n[0] === 0;
      case 'matrix':
        return n.length === 6 && n.join(' ') === '1 0 0 1 0 0';
      default:
        return false;
    }
  });
}
