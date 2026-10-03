import { useEffect, useMemo, useRef, useState } from 'react';
import cssGenerator from './index';
import { BezierEditor } from './components/BezierEditor';
import { useReducedMotion } from './components/useReducedMotion';
import { Checkbox2, ColorField, Group, NumField, Output, Slider } from './components/controls';
import {
  BEZIER_PRESETS,
  FLUID_PROPS,
  bezierCss,
  bezierTailwind,
  borderRadiusDeclaration,
  borderRadiusTailwind,
  borderRadiusValue,
  boxShadowDeclaration,
  boxShadowTailwind,
  boxShadowValue,
  fluid,
  fluidDeclaration,
  fluidTailwind,
  gradientCss,
  gradientDeclaration,
  gradientTailwind,
  normaliseBezier,
  num,
  parseBezier,
  textShadowDeclaration,
  textShadowTailwind,
  textShadowValue,
  type Bezier,
  type BoxShadow,
  type Corners,
  type FluidProp,
  type Gradient,
  type RadiusUnit,
  type TextShadow,
} from './features/css';
import { restore } from './features/state';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Tab = 'gradient' | 'box-shadow' | 'text-shadow' | 'radius' | 'clamp' | 'easing';
const TABS: { value: Tab; label: string }[] = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'box-shadow', label: 'Box shadow' },
  { value: 'text-shadow', label: 'Text shadow' },
  { value: 'radius', label: 'Border radius' },
  { value: 'clamp', label: 'clamp()' },
  { value: 'easing', label: 'Easing' },
];

interface State {
  tab: Tab;
  gradient: Gradient;
  box: BoxShadow[];
  text: TextShadow[];
  radius: { corners: Corners; unit: RadiusUnit; linked: boolean };
  clamp: { minSize: number; maxSize: number; minVw: number; maxVw: number; rootPx: number; prop: FluidProp };
  bezier: Bezier;
}

const INITIAL: State = {
  tab: 'gradient',
  gradient: {
    kind: 'linear',
    angle: 135,
    repeat: false,
    shape: 'circle',
    cx: 50,
    cy: 50,
    stops: [
      { color: '#2f5f4b', alpha: 1, pos: 0 },
      { color: '#93b7a0', alpha: 1, pos: 100 },
    ],
  },
  box: [{ x: 0, y: 10, blur: 25, spread: -5, color: '#000000', alpha: 0.25, inset: false }],
  text: [{ x: 2, y: 2, blur: 4, color: '#000000', alpha: 0.4 }],
  radius: { corners: [{ h: 24, v: 24 }, { h: 24, v: 24 }, { h: 24, v: 24 }, { h: 24, v: 24 }], unit: 'px', linked: true },
  clamp: { minSize: 16, maxSize: 24, minVw: 320, maxVw: 1280, rootPx: 16, prop: 'font-size' },
  bezier: [0.25, 0.1, 0.25, 1],
};

const MAX_LAYERS = 8;
const MAX_STOPS = 10;
const TAB_IDS = TABS.map((t) => t.value);

const PREVIEW = 'flex min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 p-6 dark:border-slate-800';

function GradientTab({ g, set }: { g: Gradient; set: (g: Gradient) => void }) {
  const css = gradientCss(g);
  const setStop = (i: number, p: Partial<Gradient['stops'][number]>) => set({ ...g, stops: g.stops.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div role="img" aria-label="Gradient preview" className="h-56 rounded-2xl border border-slate-200 dark:border-slate-800" style={{ backgroundImage: css }} />
        <Output css={gradientDeclaration(g)} tailwind={gradientTailwind(g)} />
      </div>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Gradient type"
            value={g.kind}
            onChange={(kind) => set({ ...g, kind })}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'radial', label: 'Radial' },
              { value: 'conic', label: 'Conic' },
            ]}
          />
          <Checkbox2 label="Repeating" checked={g.repeat} onChange={(repeat) => set({ ...g, repeat })} />
        </div>
        {g.kind !== 'radial' && <Slider label={g.kind === 'conic' ? 'Start angle' : 'Angle'} value={g.angle} min={0} max={360} unit="°" onChange={(angle) => set({ ...g, angle })} />}
        {g.kind === 'radial' && (
          <Segmented label="Radial shape" value={g.shape} onChange={(shape) => set({ ...g, shape })} options={[{ value: 'circle', label: 'Circle' }, { value: 'ellipse', label: 'Ellipse' }]} />
        )}
        {g.kind !== 'linear' && (
          <>
            <Slider label="Centre X" value={g.cx} min={0} max={100} unit="%" onChange={(cx) => set({ ...g, cx })} />
            <Slider label="Centre Y" value={g.cy} min={0} max={100} unit="%" onChange={(cy) => set({ ...g, cy })} />
          </>
        )}
        <h3 className="eyebrow text-slate-600 dark:text-slate-400">Colour stops</h3>
        <ul className="space-y-3">
          {g.stops.map((s, i) => (
            <li key={i} className="space-y-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <ColorField label={`Stop ${i + 1} colour`} color={s.color} alpha={s.alpha} onColor={(color) => setStop(i, { color })} onAlpha={(alpha) => setStop(i, { alpha })} />
                <Button variant="ghost" aria-label={`Remove stop ${i + 1}`} disabled={g.stops.length <= 2} onClick={() => set({ ...g, stops: g.stops.filter((_, j) => j !== i) })}>
                  <Icon name="x" className="h-4 w-4" />
                </Button>
              </div>
              <Slider label={`Stop ${i + 1} position`} value={s.pos} min={0} max={100} unit="%" onChange={(pos) => setStop(i, { pos })} />
            </li>
          ))}
        </ul>
        <Button variant="secondary" disabled={g.stops.length >= MAX_STOPS} onClick={() => set({ ...g, stops: [...g.stops, { color: '#ffffff', alpha: 1, pos: 100 }] })}>
          Add stop
        </Button>
      </div>
    </div>
  );
}

function ShadowTab<T extends BoxShadow | TextShadow>({
  layers,
  set,
  make,
  render,
  kind,
}: {
  layers: T[];
  set: (l: T[]) => void;
  make: () => T;
  render: (l: T, patch: (p: Partial<T>) => void, i: number) => React.ReactNode;
  kind: string;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <ul className="space-y-3">
        {layers.map((l, i) => (
          <li key={i} className="space-y-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {kind} {i + 1}
              </h3>
              <Button variant="ghost" aria-label={`Remove ${kind.toLowerCase()} ${i + 1}`} disabled={layers.length <= 1} onClick={() => set(layers.filter((_, j) => j !== i))}>
                <Icon name="x" className="h-4 w-4" />
              </Button>
            </div>
            {render(l, (p) => set(layers.map((x, j) => (j === i ? { ...x, ...p } : x))), i)}
          </li>
        ))}
      </ul>
      <Button variant="secondary" disabled={layers.length >= MAX_LAYERS} onClick={() => set([...layers, make()])}>
        Add layer
      </Button>
    </div>
  );
}

function BoxTab({ layers, set }: { layers: BoxShadow[]; set: (l: BoxShadow[]) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className={`${PREVIEW} bg-slate-100 dark:bg-slate-950`}>
          <div role="img" aria-label="Box shadow preview" className="h-28 w-40 rounded-2xl bg-white dark:bg-slate-800" style={{ boxShadow: boxShadowValue(layers) }} />
        </div>
        <Output css={boxShadowDeclaration(layers)} tailwind={boxShadowTailwind(layers)} />
      </div>
      <ShadowTab
        kind="Layer"
        layers={layers}
        set={set}
        make={() => ({ x: 0, y: 4, blur: 8, spread: 0, color: '#000000', alpha: 0.2, inset: false })}
        render={(l, p, i) => (
          <>
            <Slider label={`Layer ${i + 1} X`} value={l.x} min={-100} max={100} unit="px" onChange={(x) => p({ x })} />
            <Slider label={`Layer ${i + 1} Y`} value={l.y} min={-100} max={100} unit="px" onChange={(y) => p({ y })} />
            <Slider label={`Layer ${i + 1} blur`} value={l.blur} min={0} max={100} unit="px" onChange={(blur) => p({ blur })} />
            <Slider label={`Layer ${i + 1} spread`} value={l.spread} min={-50} max={50} unit="px" onChange={(spread) => p({ spread })} />
            <ColorField label={`Layer ${i + 1} colour`} color={l.color} alpha={l.alpha} onColor={(color) => p({ color })} onAlpha={(alpha) => p({ alpha })} />
            <Checkbox2 label={`Layer ${i + 1} inset`} checked={l.inset} onChange={(inset) => p({ inset })} />
          </>
        )}
      />
    </div>
  );
}

function TextTab({ layers, set }: { layers: TextShadow[]; set: (l: TextShadow[]) => void }) {
  const [sample, setSample] = useState('Shadow');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className={`${PREVIEW} bg-slate-100 dark:bg-slate-950`}>
          <p role="img" aria-label="Text shadow preview" className="text-6xl font-extrabold break-all text-slate-800 dark:text-slate-100" style={{ textShadow: textShadowValue(layers) }}>
            {sample || 'Shadow'}
          </p>
        </div>
        <label className="block text-sm text-slate-600 dark:text-slate-400">
          Preview text
          <input value={sample} maxLength={24} onChange={(e) => setSample(e.target.value)} className="mt-1 block w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100" />
        </label>
        <Output css={textShadowDeclaration(layers)} tailwind={textShadowTailwind(layers)} />
      </div>
      <ShadowTab
        kind="Layer"
        layers={layers}
        set={set}
        make={() => ({ x: 1, y: 1, blur: 2, color: '#000000', alpha: 0.3 })}
        render={(l, p, i) => (
          <>
            <Slider label={`Layer ${i + 1} X`} value={l.x} min={-50} max={50} unit="px" onChange={(x) => p({ x })} />
            <Slider label={`Layer ${i + 1} Y`} value={l.y} min={-50} max={50} unit="px" onChange={(y) => p({ y })} />
            <Slider label={`Layer ${i + 1} blur`} value={l.blur} min={0} max={50} unit="px" onChange={(blur) => p({ blur })} />
            <ColorField label={`Layer ${i + 1} colour`} color={l.color} alpha={l.alpha} onColor={(color) => p({ color })} onAlpha={(alpha) => p({ alpha })} />
          </>
        )}
      />
    </div>
  );
}

const CORNER_NAMES = ['Top left', 'Top right', 'Bottom right', 'Bottom left'];

function RadiusTab({ r, set }: { r: State['radius']; set: (r: State['radius']) => void }) {
  const max = r.unit === '%' ? 100 : 200;
  const setCorner = (i: number, p: Partial<Corners[number]>) =>
    set({ ...r, corners: r.corners.map((c, j) => (r.linked || j === i ? { ...c, ...p } : c)) as Corners });
  const elliptical = r.corners.some((c) => c.h !== c.v);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className={`${PREVIEW} bg-slate-100 dark:bg-slate-950`}>
          <div role="img" aria-label="Border radius preview" className="h-40 w-56 max-w-full border-2 border-emerald-700 bg-emerald-200 dark:border-emerald-300 dark:bg-emerald-900" style={{ borderRadius: borderRadiusValue(r.corners, r.unit) }} />
        </div>
        <Output css={borderRadiusDeclaration(r.corners, r.unit)} tailwind={borderRadiusTailwind(r.corners, r.unit)} />
      </div>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Unit" value={r.unit} onChange={(unit) => set({ ...r, unit })} options={[{ value: 'px', label: 'px' }, { value: '%', label: '%' }]} />
          <Checkbox2 label="Link all corners" checked={r.linked} onChange={(linked) => set({ ...r, linked })} />
        </div>
        {r.corners.map((c, i) => (
          <Group key={i} title={CORNER_NAMES[i]}>
            <Slider label={`${CORNER_NAMES[i]} horizontal`} value={c.h} min={0} max={max} unit={r.unit} onChange={(h) => setCorner(i, r.linked && !elliptical ? { h, v: h } : { h })} />
            <Slider label={`${CORNER_NAMES[i]} vertical`} value={c.v} min={0} max={max} unit={r.unit} onChange={(v) => setCorner(i, { v })} />
          </Group>
        ))}
        <p className="text-sm text-slate-600 dark:text-slate-400">Set horizontal and vertical radii apart for elliptical corners; the CSS then uses a slash.</p>
      </div>
    </div>
  );
}

function ClampTab({ c, set }: { c: State['clamp']; set: (c: State['clamp']) => void }) {
  const out = useMemo(() => fluid(c), [c]);
  const [vw, setVw] = useState(800);
  const px = out.ok ? out.result.valueAt(vw) : 0;
  const n = (k: keyof State['clamp']) => (v: number) => set({ ...c, [k]: v });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-4">
          <NumField label="Min size (px)" value={c.minSize} onChange={n('minSize')} step={0.5} />
          <NumField label="Max size (px)" value={c.maxSize} onChange={n('maxSize')} step={0.5} />
          <NumField label="Min viewport (px)" value={c.minVw} onChange={n('minVw')} step={10} min={0} />
          <NumField label="Max viewport (px)" value={c.maxVw} onChange={n('maxVw')} step={10} min={0} />
          <NumField label="Rem base (px)" value={c.rootPx} onChange={n('rootPx')} min={1} />
        </div>
        <div className="max-w-xs">
          <Select<FluidProp> label="Property" value={c.prop} onChange={(prop) => set({ ...c, prop })} options={FLUID_PROPS.map((p) => ({ value: p.value, label: p.label }))} />
        </div>
        {!out.ok && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {out.error}
          </p>
        )}
        {out.ok && <Output css={fluidDeclaration(out.result.css, c.prop)} tailwind={fluidTailwind(out.result.css, c.prop)} />}
      </div>
      <div className="min-w-0 space-y-4">
        {out.ok && (
          <>
            <h3 className="eyebrow text-slate-600 dark:text-slate-400">The maths</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm break-words text-slate-700 dark:text-slate-300">
              {out.result.steps.map((s) => (
                <li key={s} className="font-mono">
                  {s}
                </li>
              ))}
            </ol>
            <Slider label="Viewport width" value={vw} min={200} max={Math.max(1920, c.maxVw)} step={10} unit="px" onChange={setVw} />
            <p className="text-sm text-slate-700 dark:text-slate-300" aria-live="polite">
              At {vw}px wide: <span className="font-mono">{num(px, 2)}px</span> ({num(px / c.rootPx, 3)}rem)
            </p>
            <div className={`${PREVIEW} bg-slate-100 dark:bg-slate-950`}>
              <p className="max-w-full break-words text-slate-900 dark:text-slate-100" style={c.prop === 'font-size' ? { fontSize: px } : { fontSize: 16 }}>
                {c.prop === 'font-size' ? 'The quick brown fox' : <span className="inline-block bg-emerald-200 text-emerald-950" style={{ [c.prop === 'gap' ? 'padding' : c.prop]: px } as React.CSSProperties}>{c.prop} {num(px, 1)}px</span>}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EasingTab({ b, set }: { b: Bezier; set: (b: Bezier) => void }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const css = bezierCss(b);
  const [draft, setDraft] = useState<string | null>(null);
  const [textBad, setTextBad] = useState(false);
  const [duration, setDuration] = useState(1200);
  const text = draft ?? css;

  useEffect(() => {
    const el = box.current;
    if (!el || reduced || typeof el.animate !== 'function') return;
    const a = el.animate([{ left: '0%', transform: 'translateX(0)' }, { left: '100%', transform: 'translateX(-100%)' }], { duration, iterations: Infinity, direction: 'alternate', easing: css, delay: 200 });
    return () => a.cancel();
  }, [css, duration, reduced]);

  const onText = (v: string) => {
    setDraft(v);
    const p = parseBezier(v);
    setTextBad(!p);
    if (p) set(p);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <BezierEditor value={b} onChange={set} />
        <p className="text-sm text-slate-600 dark:text-slate-400">Drag the dots, or focus one and use the arrow keys (Shift for bigger steps).</p>
        <div className="flex flex-wrap gap-4">
          {(['x1', 'y1', 'x2', 'y2'] as const).map((k, i) => (
            <NumField key={k} label={k.toUpperCase()} value={b[i]} step={0.01} min={i % 2 ? -2 : 0} max={i % 2 ? 3 : 1} width="w-20" onChange={(v) => Number.isFinite(v) && set(normaliseBezier(b.map((x, j) => (j === i ? v : x)) as Bezier))} />
          ))}
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <div>
          <div className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Preview</div>
          <div className="relative h-14 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
            <div ref={box} role="img" aria-label="Easing preview" className="absolute top-2 h-10 w-10 rounded-xl bg-emerald-600 dark:bg-emerald-400" style={reduced ? { left: '50%', transform: 'translateX(-50%)' } : { left: 0 }} />
          </div>
          {reduced && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Animation is paused because your system prefers reduced motion.</p>}
        </div>
        <Slider label="Duration" value={duration} min={200} max={4000} step={100} unit="ms" onChange={setDuration} />
        <label className="block text-sm text-slate-600 dark:text-slate-400">
          Timing function
          <input value={text} aria-invalid={textBad} onChange={(e) => onText(e.target.value)} onBlur={() => (setDraft(null), setTextBad(false))} className="mt-1 block w-full rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-slate-900 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100" />
        </label>
        {textBad && <p className="text-sm text-red-700 dark:text-red-400">Not a valid cubic-bezier() (x values must be between 0 and 1).</p>}
        <div>
          <div className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Presets</div>
          <div className="flex flex-wrap gap-2">
            {BEZIER_PRESETS.map((p) => (
              <Button key={p.name} variant="secondary" className="!px-3 !py-1.5 !text-sm" onClick={() => set(p.value)}>
                {p.name}
              </Button>
            ))}
          </div>
        </div>
        <Output css={`transition-timing-function: ${css};`} tailwind={bezierTailwind(b)} />
      </div>
    </div>
  );
}

export default function CssGeneratorPage() {
  const [s, setS] = useState<State>(INITIAL);
  const up = <K extends keyof State>(k: K) => (v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  useShareState(
    { cfg: JSON.stringify(s) },
    (r) => {
      try {
        const next = restore(INITIAL, JSON.parse(r.cfg ?? '{}'));
        setS(TAB_IDS.includes(next.tab) ? next : { ...next, tab: 'gradient' });
      } catch {
        /* ignore a malformed link */
      }
    },
  );

  return (
    <div className="space-y-8">
      <Breadcrumb tool={cssGenerator} />
      <Headline accent="generator">CSS </Headline>
      <StatusStrip status={`${TABS.find((t) => t.value === s.tab)!.label}: change the controls, then copy the CSS.`} />
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <Segmented<Tab> label="Generator" value={s.tab} onChange={up('tab')} options={TABS} />
        <div>
          {s.tab === 'gradient' && <GradientTab g={s.gradient} set={up('gradient')} />}
          {s.tab === 'box-shadow' && <BoxTab layers={s.box} set={up('box')} />}
          {s.tab === 'text-shadow' && <TextTab layers={s.text} set={up('text')} />}
          {s.tab === 'radius' && <RadiusTab r={s.radius} set={up('radius')} />}
          {s.tab === 'clamp' && <ClampTab c={s.clamp} set={up('clamp')} />}
          {s.tab === 'easing' && <EasingTab b={s.bezier} set={up('bezier')} />}
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Everything is generated in your browser. Tailwind classes use arbitrary values, so they work in Tailwind 3.x and 4.</p>
    </div>
  );
}
