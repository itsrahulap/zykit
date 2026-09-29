import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatNumber, isIdentityTransform, joinNumbers, parsePath, roundPath } from '../../../src/tools/svg-optimizer/features/numbers';
import { DEFAULT_OPTIONS, optimizeSvg } from '../../../src/tools/svg-optimizer/features/optimize';
import { decodeEntities, parseXml, serializeXml, XmlError, type XmlElement } from '../../../src/tools/svg-optimizer/features/xml';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const NONE = { ...DEFAULT_OPTIONS, sanitize: false, removeComments: false, removeMetadata: false, removeEditorData: false, removeEmpty: false, removeDefaults: false, removeUnusedIds: false, roundNumbers: false };

/** Absolute end points of every segment, for comparing paths numerically. */
function points(d: string): [number, number][] {
  const out: [number, number][] = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  const ar: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 };
  for (const { cmd, args } of parsePath(d)!) {
    const l = cmd.toLowerCase();
    const rel = cmd === l;
    if (l === 'z') {
      [x, y] = [sx, sy];
      out.push([x, y]);
      continue;
    }
    for (let g = 0; g < args.length; g += ar[l]) {
      const a = args.slice(g, g + ar[l]);
      if (l === 'h') x = rel ? x + a[0] : a[0];
      else if (l === 'v') y = rel ? y + a[0] : a[0];
      else {
        const ex = a[a.length - 2], ey = a[a.length - 1];
        [x, y] = rel ? [x + ex, y + ey] : [ex, ey];
      }
      if (l === 'm' && g === 0) [sx, sy] = [x, y];
      out.push([x, y]);
    }
  }
  return out;
}

const root = (svg: string) => parseXml(svg).children.find((n): n is XmlElement => n.type === 'element')!;
function allNames(svg: string) {
  const names: string[] = [];
  const attrs: string[] = [];
  const walk = (el: XmlElement) => {
    names.push(el.name);
    attrs.push(...el.attrs.map((a) => a.name));
    el.children.forEach((c) => c.type === 'element' && walk(c));
  };
  walk(root(svg));
  return { names, attrs };
}

describe('XML parser', () => {
  it('round-trips markup exactly when nothing is removed', () => {
    const src = '<svg xmlns="http://www.w3.org/2000/svg"><!-- c --><g a=\'1\'><text>a &amp; b</text></g><![CDATA[x]]></svg>';
    expect(serializeXml(parseXml(src))).toBe(src.replace("a='1'", 'a="1"'));
  });

  it('reports malformed input with a line and column', () => {
    const bad = '<svg>\n  <g>\n</svg>';
    try {
      parseXml(bad);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(XmlError);
      expect((e as XmlError).detail).toMatchObject({ line: 3, column: 1 });
      expect((e as XmlError).message).toMatch('Expected </g> but found </svg>');
    }
    expect(() => parseXml('<svg a=1/>')).toThrow(/quotes/);
    expect(() => parseXml('<svg a="1" a="2"/>')).toThrow(/Duplicate/);
    expect(() => parseXml('<svg><!-- open</svg>')).toThrow(/comment/);
    expect(() => parseXml('<svg>')).toThrow(/never closed/);
  });

  it('decodes entities for inspection', () => {
    expect(decodeEntities('&#106;ava&#x73;cript&colon;&amp;')).toBe('javascript&colon;&');
  });
});

describe('numbers and paths', () => {
  it('formats numbers compactly', () => {
    expect(formatNumber(0.5, 3)).toBe('.5');
    expect(formatNumber(-0.25, 3)).toBe('-.25');
    expect(formatNumber(-0.0001, 3)).toBe('0');
    expect(formatNumber(10.123456, 3)).toBe('10.123');
    expect(formatNumber(1e-7, 8)).toBe('.0000001');
    expect(joinNumbers(['10', '-5.5', '.5', '3', '.25'])).toBe('10-5.5.5 3 .25');
  });

  it('parses compact arc flags and rejects garbage', () => {
    expect(parsePath('M0 0a10 10 0 01 20 0')).toEqual([
      { cmd: 'M', args: [0, 0] },
      { cmd: 'a', args: [10, 10, 0, 0, 1, 20, 0] },
    ]);
    expect(parsePath('L0 0')).toBeNull();
    expect(parsePath('M0 0 L')).toBeNull();
    expect(parsePath('M0 0 X1')).toBeNull();
    expect(roundPath('M 0 0 Q', 3)).toBeNull();
  });

  it('rounds path data without drifting on long relative paths', () => {
    let d = 'm 0.1234567,0.1234567';
    for (let i = 0; i < 2000; i++) d += ' l 0.0004,0.0004';
    const rounded = roundPath(d, 3)!;
    const a = points(d).at(-1)!;
    const b = points(rounded).at(-1)!;
    expect(Math.abs(a[0] - b[0])).toBeLessThan(0.001);
    expect(Math.abs(a[1] - b[1])).toBeLessThan(0.001);
  });

  it('keeps every point within the precision for mixed commands', () => {
    const d = fixture('inkscape.svg').match(/\sd="([^"]+)"/)![1];
    const rounded = roundPath(d, 2)!;
    expect(rounded.length).toBeLessThan(d.length * 0.6);
    const a = points(d), b = points(rounded);
    expect(b.length).toBe(a.length);
    a.forEach(([x, y], i) => {
      expect(Math.abs(x - b[i][0])).toBeLessThanOrEqual(0.006);
      expect(Math.abs(y - b[i][1])).toBeLessThanOrEqual(0.006);
    });
    expect(roundPath('M0 0H10.5555V5.5555h-3.3333v-2.2222Z', 2)).toBe('M0 0H10.56V5.56h-3.34v-2.23Z');
  });

  it('recognises identity transforms', () => {
    for (const t of ['translate(0)', 'translate(0 0)', 'scale(1)', 'rotate(0)', 'matrix(1,0,0,1,0,0)', 'translate(0,0) scale(1 1)']) expect(isIdentityTransform(t)).toBe(true);
    for (const t of ['translate(1)', 'scale(2)', 'rotate(0 5 5) translate(3)', 'matrix(1 0 0 1 0 1)', 'foo(0)']) expect(isIdentityTransform(t)).toBe(false);
  });
});

describe('optimizer on real exports', () => {
  it('cleans an Inkscape file', () => {
    const src = fixture('inkscape.svg');
    const { output, changes } = optimizeSvg(src);
    expect(output.length).toBeLessThan(src.length * 0.6);
    expect(output).not.toMatch(/inkscape|sodipodi|<metadata|rdf:|xmlns:cc|xmlns:dc|<!--|<\?xml/);
    expect(output).not.toContain('id="g333"'); // empty group
    expect(output).toContain('id="linearGradient1234"'); // referenced via url(#…)
    expect(output).not.toContain('id="path111"'); // unused
    expect(output).toContain('viewBox="0 0 210 297"');
    expect(output).toContain('ry="0"');
    expect(output.startsWith('<svg')).toBe(true);
    expect(changes.comments).toBe(1);
    expect(changes['editor elements']).toBeGreaterThan(0);
    // Still well-formed and still an SVG.
    expect(root(output).name).toBe('svg');
  });

  it('cleans an Illustrator file with DOCTYPE entities', () => {
    const src = fixture('illustrator.svg');
    const { output, security } = optimizeSvg(src);
    expect(output).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(output).not.toMatch(/&ns_|<!DOCTYPE|i:pgf|i:extraneous|xmlns:i=|xmlns:x=|xmlns:graph|data-name|enable-background|foreignObject|version=/);
    expect(output).not.toContain('x="0px"');
    expect(output).toContain('points="10 90 50.5 10.25 90 90"');
    expect(output).toContain('r="40.123"');
    expect(output).toContain('.st0{fill:#FF6600;}'); // stylesheets are left alone
    expect(output).toContain('<switch>');
    expect(security).toContain('Removed <foreignObject> element');
    const { names } = allNames(output);
    expect(names).toContain('circle');
    expect(names).toContain('polyline');
  });

  it('cleans a Figma file and keeps referenced ids', () => {
    const src = fixture('figma.svg');
    const { output } = optimizeSvg(src);
    expect(output).toContain('clip-path="url(#clip0_12_345)"');
    expect(output).toContain('id="clip0_12_345"');
    expect(output).toContain('fill="#111"');
    expect(output).toContain('stroke="#e5e5e5"');
    expect(output).not.toContain('stroke-opacity');
    expect(output).not.toContain('transform=');
    expect(output).toContain('d="M12 2C6.477 2 2 6.477 2 12');
    expect(output).toContain('fill="none"'); // root fill="none" is not a default
    expect(output).not.toMatch(/>\s+</);
  });

  it('options switch passes off', () => {
    const src = fixture('figma.svg');
    expect(optimizeSvg(src, { ...NONE, pretty: false }).output.length).toBeGreaterThan(optimizeSvg(src).output.length);
    const pretty = optimizeSvg(src, { ...DEFAULT_OPTIONS, pretty: true }).output;
    expect(pretty).toContain('\n  <g clip-path');
    expect(optimizeSvg('<svg><!--keep--></svg>', NONE).output).toBe('<svg><!--keep--></svg>');
  });

  it('keeps whitespace in text and rejects non-SVG roots', () => {
    expect(optimizeSvg('<svg>\n <text x="1.00">a  <tspan> b</tspan></text>\n</svg>').output).toBe('<svg><text x="1">a  <tspan> b</tspan></text></svg>');
    expect(() => optimizeSvg('<html></html>')).toThrow(/root element must be <svg>/);
  });

  it('keeps inherited defaults that would override an ancestor', () => {
    const out = optimizeSvg('<svg><g stroke-width="3"><path stroke-width="1" d="M0 0"/></g><path stroke-linecap="butt" d="M0 0"/></svg>').output;
    expect(out).toContain('<path stroke-width="1"');
    expect(out).not.toContain('stroke-linecap');
  });
});

describe('sanitizer', () => {
  it('removes scripts, handlers, javascript: links, foreignObject and external references', () => {
    const { output, security } = optimizeSvg(fixture('malicious.svg'));
    expect(output).not.toMatch(/<script|onload|onclick|onmouseover|javascript|&#106;|foreignObject|iframe|<set|evil|tracker|@import|svg\+xml/i);
    expect(output).toContain('href="https://example.com/"'); // ordinary links stay
    expect(output).toContain('href="data:image/png;base64,iVBORw0KGgo="'); // safe embedded raster
    expect(output).toContain('<animate'); // harmless animation stays
    expect(security.join('\n')).toMatch(/<script> element/);
    expect(security.join('\n')).toMatch(/event handler/);
    expect(security.join('\n')).toMatch(/javascript: link/);
    expect(security.join('\n')).toMatch(/external resource reference/);
  });

  it('can be switched off (output then keeps scripts)', () => {
    const { output, security } = optimizeSvg(fixture('malicious.svg'), { ...DEFAULT_OPTIONS, sanitize: false });
    expect(output).toContain('<script');
    expect(security).toEqual([]);
  });
});
