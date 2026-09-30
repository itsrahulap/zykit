import { useMemo, useState } from 'react';
import colorConverter from './index';
import {
  apca,
  DEFICIENCIES,
  formatAll,
  formatRatio,
  harmony,
  HARMONIES,
  inP3Gamut,
  inSrgbGamut,
  nearestPassing,
  num,
  parseColor,
  shades,
  simulate,
  tints,
  toHex,
  wcag,
  type Color,
  type Harmony,
} from './features/color-converter';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Notices } from '../../shared/ui/convert';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';

const FORMAT_LABELS: Record<string, string> = {
  hex: 'hex',
  named: 'a named colour',
  rgb: 'rgb()',
  hsl: 'hsl()',
  hwb: 'hwb()',
  lab: 'lab()',
  lch: 'lch()',
  oklab: 'oklab()',
  oklch: 'oklch()',
  color: 'color()',
};
const HARMONY_IDS = HARMONIES.map((h) => h.id);

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

/** Checkerboard under a swatch so transparency is visible. React's style prop goes through CSSOM, which the CSP allows. */
const checker = {
  backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '16px 16px',
};

function Swatch({ color, className = '' }: { color: Color; className?: string }) {
  const hex = toHex(color);
  return (
    <span className={`relative block overflow-hidden rounded-xl ring-1 ring-inset ring-slate-900/10 dark:ring-white/10 ${className}`} style={checker}>
      <span className="absolute inset-0" style={{ backgroundColor: hex }} />
    </span>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
  parsed,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  parsed: ReturnType<typeof parseColor>;
}) {
  const hex6 = parsed.ok ? toHex(parsed.color, false) : '#000000';
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-invalid={!parsed.ok}
          aria-describedby={parsed.ok ? undefined : `${id}-error`}
          className={inputClass}
        />
        <input
          type="color"
          aria-label={`${label}: colour picker`}
          value={hex6}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950"
        />
      </div>
      {!parsed.ok && value.trim() && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-700 dark:text-red-400">
          {parsed.error}
        </p>
      )}
    </div>
  );
}

function PassBadge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <Badge tone={pass ? 'green' : 'red'}>{pass ? 'Pass' : 'Fail'}</Badge>
    </div>
  );
}

function SwatchButton({ color, onPick, label }: { color: Color; onPick: (hex: string) => void; label?: string }) {
  const hex = toHex(color);
  return (
    <button
      type="button"
      onClick={() => onPick(hex)}
      title={`Use ${hex}`}
      aria-label={`Use ${label ? `${label} ` : ''}${hex}`}
      className="group min-w-0 text-left focus-visible:outline-none"
    >
      <Swatch color={color} className="h-12 w-full group-hover:ring-2 group-hover:ring-emerald-500 group-focus-visible:ring-2 group-focus-visible:ring-emerald-500" />
      <span className="mt-1 block truncate font-mono text-xs text-slate-600 dark:text-slate-400">{hex}</span>
    </button>
  );
}

export default function ColorConverterPage() {
  const [input, setInput] = useState('#10b981');
  const [fg, setFg] = useState('#1e293b');
  const [bg, setBg] = useState('#ffffff');
  const [harmonyKind, setHarmonyKind] = useState<Harmony>('complementary');

  const parsed = useMemo(() => parseColor(input), [input]);
  const fgParsed = useMemo(() => parseColor(fg), [fg]);
  const bgParsed = useMemo(() => parseColor(bg), [bg]);
  const color = parsed.ok ? parsed.color : null;
  const formats = useMemo(() => (color ? formatAll(color) : []), [color]);

  useShareState(
    { color: input, fg, bg, harmony: harmonyKind },
    (s) => {
      if (s.color !== undefined) setInput(s.color);
      if (s.fg !== undefined) setFg(s.fg);
      if (s.bg !== undefined) setBg(s.bg);
      if (s.harmony) setHarmonyKind(s.harmony);
    },
    { harmony: HARMONY_IDS },
  );
  useToolShortcuts({ getOutput: () => (color ? toHex(color) : '') });

  const status = !input.trim()
    ? 'Type or pick a colour in any CSS format.'
    : !parsed.ok
      ? parsed.error
      : `Read as ${FORMAT_LABELS[parsed.format] ?? parsed.format} · ${inSrgbGamut(parsed.color) ? 'inside sRGB' : 'outside sRGB'}`;

  const notices: string[] = [];
  if (color && !inSrgbGamut(color))
    notices.push(
      `This colour is outside the sRGB gamut${inP3Gamut(color) ? ' but inside Display P3' : ' (and outside Display P3)'}. HEX, RGB, HSL and HWB show the nearest sRGB colour (chroma reduced); Lab, LCH, OKLab, OKLCH and P3 keep the exact value.`,
    );

  const contrast = fgParsed.ok && bgParsed.ok ? wcag(fgParsed.color, bgParsed.color) : null;
  const lc = fgParsed.ok && bgParsed.ok ? apca(fgParsed.color, bgParsed.color) : 0;
  const suggestions: { label: string; which: 'fg' | 'bg'; color: Color }[] = [];
  if (fgParsed.ok && bgParsed.ok && contrast && !contrast.normalAAA) {
    const add = (label: string, which: 'fg' | 'bg', c: Color | null) => c && suggestions.push({ label, which, color: c });
    if (!contrast.normalAA) add('Text for AA (4.5:1)', 'fg', nearestPassing(fgParsed.color, bgParsed.color, 4.5, 'fg'));
    add('Text for AAA (7:1)', 'fg', nearestPassing(fgParsed.color, bgParsed.color, 7, 'fg'));
    if (!contrast.normalAA) add('Background for AA', 'bg', nearestPassing(bgParsed.color, fgParsed.color, 4.5, 'bg'));
  }

  const palette = color ? harmony(color, harmonyKind) : [];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={colorConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="colour">Convert any </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput('oklch(70% 0.25 150)')}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={parsed.ok ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Colour input" className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <ColorField id="color-input" label="Colour" value={input} onChange={setInput} parsed={parsed} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            HEX (3/4/6/8 digits), names, <code>rgb()</code>, <code>hsl()</code>, <code>hwb()</code>, <code>lab()</code>, <code>lch()</code>,{' '}
            <code>oklab()</code>, <code>oklch()</code> or <code>color(display-p3 …)</code>.
          </p>
          {color ? (
            <Swatch color={color} className="h-40 w-full" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700">
              No colour yet
            </div>
          )}
          <Notices items={notices} />
        </section>

        <section aria-label="Formats" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="eyebrow flex items-center gap-2 border-b border-slate-100 px-4 py-4 text-slate-600 sm:px-6 dark:border-slate-800 dark:text-slate-400">
            <Icon name="swap" className="h-4 w-4" /> Formats
          </h2>
          {formats.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {formats.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
                  <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-400">{f.label}</span>
                  <code data-format={f.id} className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900 dark:text-slate-100">
                    {f.value}
                  </code>
                  <CopyButton text={f.value} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">Enter a valid colour to see it in every format.</p>
          )}
        </section>
      </div>

      <Panel eyebrow="Contrast checker (WCAG 2.1)" icon="check">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <ColorField id="contrast-fg" label="Text colour" value={fg} onChange={setFg} parsed={fgParsed} />
            <ColorField id="contrast-bg" label="Background colour" value={bg} onChange={setBg} parsed={bgParsed} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!color} onClick={() => color && setFg(toHex(color))}>
                Use colour as text
              </Button>
              <Button variant="secondary" disabled={!color} onClick={() => color && setBg(toHex(color))}>
                Use colour as background
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setFg(bg);
                  setBg(fg);
                }}
              >
                <Icon name="swap" className="h-4 w-4" /> Swap
              </Button>
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            {fgParsed.ok && bgParsed.ok && contrast ? (
              <>
                <div className="rounded-2xl p-5 ring-1 ring-inset ring-slate-900/10 dark:ring-white/10" style={{ backgroundColor: toHex(bgParsed.color) }}>
                  <p className="text-2xl font-bold" style={{ color: toHex(fgParsed.color) }}>
                    Large text sample
                  </p>
                  <p className="mt-1 text-sm" style={{ color: toHex(fgParsed.color) }}>
                    Normal text: the quick brown fox jumps over the lazy dog.
                  </p>
                </div>
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white" data-testid="contrast-ratio">
                    {formatRatio(contrast.ratio)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">APCA Lc {num(lc, 1)} (informational)</span>
                </p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <PassBadge pass={contrast.normalAA} label="Normal text AA (4.5:1)" />
                  <PassBadge pass={contrast.normalAAA} label="Normal text AAA (7:1)" />
                  <PassBadge pass={contrast.largeAA} label="Large text AA (3:1)" />
                  <PassBadge pass={contrast.largeAAA} label="Large text AAA (4.5:1)" />
                  <PassBadge pass={contrast.ui} label="UI components & graphics (3:1)" />
                </div>
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nearest passing colours</h3>
                    {suggestions.map(({ label, which, color: c }) => (
                      <div key={label} className="flex flex-wrap items-center gap-3">
                        <Swatch color={c} className="h-8 w-8 shrink-0" />
                        <span className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-300">
                          {label}: <code className="font-mono">{toHex(c)}</code>
                        </span>
                        <Button variant="ghost" className="pointer-coarse:min-h-11" onClick={() => (which === 'fg' ? setFg(toHex(c)) : setBg(toHex(c)))}>
                          Use {toHex(c)}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter two valid colours to check their contrast.</p>
            )}
          </div>
        </div>
      </Panel>

      {color && (
        <Panel eyebrow="Palette" icon="grid">
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Tints (towards white)</h3>
              <div className="grid grid-cols-5 gap-2">
                {tints(color).map((c, i) => (
                  <SwatchButton key={i} color={c} onPick={setInput} label="tint" />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Shades (towards black)</h3>
              <div className="grid grid-cols-5 gap-2">
                {shades(color).map((c, i) => (
                  <SwatchButton key={i} color={c} onPick={setInput} label="shade" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Segmented<Harmony> label="Harmony" options={HARMONIES.map((h) => ({ value: h.id, label: h.label }))} value={harmonyKind} onChange={setHarmonyKind} />
              <div className="grid grid-cols-4 gap-2">
                {palette.map((c, i) => (
                  <SwatchButton key={i} color={c} onPick={setInput} label="harmony colour" />
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {color && (
        <Panel eyebrow="Colour-blindness preview" icon="info">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Simulated with the Machado (2009) model: the colour, its {HARMONIES.find((h) => h.id === harmonyKind)!.label.toLowerCase()} palette and the
            contrast sample.
          </p>
          <ul className="space-y-4">
            {[{ id: 'normal', label: 'Normal vision', note: 'as entered' } as const, ...DEFICIENCIES].map((d) => {
              const sim = (c: Color) => (d.id === 'normal' ? c : simulate(c, d.id));
              return (
                <li key={d.id} className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
                  <span className="text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{d.label}</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">{d.note}</span>
                  </span>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {[color, ...palette.slice(1)].map((c, i) => (
                      <Swatch key={i} color={sim({ ...c, alpha: 1 })} className="h-10 w-12" />
                    ))}
                    {fgParsed.ok && bgParsed.ok && (
                      <span
                        className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold ring-1 ring-inset ring-slate-900/10"
                        style={{ backgroundColor: toHex(sim(bgParsed.color)), color: toHex(sim(fgParsed.color)) }}
                      >
                        Aa text
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Everything is calculated in your browser. Conversions follow CSS Color 4; contrast uses the WCAG 2.1 relative-luminance formula, with
        translucent text composited over the background.
      </p>
    </div>
  );
}
