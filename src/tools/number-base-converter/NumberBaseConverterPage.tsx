import { useMemo, useState } from 'react';
import numberBaseConverter from './index';
import {
  BIT_OPS,
  bitLength,
  bitwise,
  charInfo,
  codesToText,
  decodeFloatBits,
  floatBits,
  groupDigits,
  parseFloatInput,
  parseInteger,
  toBase,
  twosComplement,
  type BitOp,
} from './features/number-base-converter';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Checkbox } from '../../shared/ui/convert';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';

type InBase = 'auto' | '2' | '8' | '10' | '16' | 'custom';
type FloatWidth = '32' | '64';
type FloatMode = 'decimal' | 'bits';

const IN_BASES: InBase[] = ['auto', '2', '8', '10', '16', 'custom'];
const BASE_OPTIONS = Array.from({ length: 35 }, (_, i) => ({ value: i + 2, label: `Base ${i + 2}` }));
const WIDTHS = [8, 16, 32, 64, 128];
const OP_IDS = BIT_OPS.map((o) => o.id);

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const card = 'min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';

function Field({ id, label, value, onChange, invalid, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid?: boolean; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
    </div>
  );
}

function OutRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
      <span className="w-24 shrink-0 text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900 dark:text-slate-100" data-testid={`out-${label}`}>
        {value}
      </code>
      <CopyButton text={value} />
    </li>
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

export default function NumberBaseConverterPage() {
  const [input, setInput] = useState('255');
  const [inBase, setInBase] = useState<InBase>('auto');
  const [customBase, setCustomBase] = useState(36);
  const [outBase, setOutBase] = useState(36);
  const [group, setGroup] = useState(true);
  const [upper, setUpper] = useState(true);
  const [floatText, setFloatText] = useState('0.1');
  const [floatWidth, setFloatWidth] = useState<FloatWidth>('64');
  const [floatMode, setFloatMode] = useState<FloatMode>('decimal');
  const [a, setA] = useState('0b1100');
  const [b, setB] = useState('0b1010');
  const [op, setOp] = useState<BitOp>('and');
  const [bits, setBits] = useState(8);
  const [chars, setChars] = useState('Hi é😀');
  const [codes, setCodes] = useState('72 105 0x1F600');

  useShareState(
    { input, inBase, customBase, outBase, group, upper, floatText, floatWidth, floatMode, a, b, op, bits, chars, codes },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.inBase) setInBase(s.inBase);
      if (s.customBase !== undefined && s.customBase >= 2 && s.customBase <= 36) setCustomBase(s.customBase);
      if (s.outBase !== undefined && s.outBase >= 2 && s.outBase <= 36) setOutBase(s.outBase);
      if (s.group !== undefined) setGroup(s.group);
      if (s.upper !== undefined) setUpper(s.upper);
      if (s.floatText !== undefined) setFloatText(s.floatText);
      if (s.floatWidth) setFloatWidth(s.floatWidth);
      if (s.floatMode) setFloatMode(s.floatMode);
      if (s.a !== undefined) setA(s.a);
      if (s.b !== undefined) setB(s.b);
      if (s.op) setOp(s.op);
      if (s.bits !== undefined && WIDTHS.includes(s.bits)) setBits(s.bits);
      if (s.chars !== undefined) setChars(s.chars);
      if (s.codes !== undefined) setCodes(s.codes);
    },
    { inBase: IN_BASES, floatWidth: ['32', '64'], floatMode: ['decimal', 'bits'], op: OP_IDS },
  );

  const base = inBase === 'auto' ? 'auto' : inBase === 'custom' ? customBase : Number(inBase);
  const parsed = useMemo(() => parseInteger(input, base), [input, base]);
  const n = parsed.ok ? parsed.value : null;
  const fmt = (v: bigint, radix: number) => toBase(v, radix, { group, upper });
  useToolShortcuts({ getOutput: () => (n !== null ? n.toString() : '') });

  const status = !input.trim()
    ? 'Type a number in any base.'
    : !parsed.ok
      ? parsed.error
      : `Read as base ${parsed.base} · ${bitLength(parsed.value)} bits`;

  // Float
  const width = Number(floatWidth) as 32 | 64;
  const float = useMemo(() => {
    if (floatMode === 'decimal') {
      const v = parseFloatInput(floatText);
      return v === null ? null : floatBits(v, width);
    }
    const r = parseInteger(floatText, 16);
    if (!r.ok || r.value < 0n || bitLength(r.value) > width) return null;
    return decodeFloatBits(r.value, width);
  }, [floatText, floatMode, width]);

  // Bitwise
  const opDef = BIT_OPS.find((o) => o.id === op)!;
  const pa = parseInteger(a);
  const pb = parseInteger(b);
  const bit = pa.ok && (opDef.unary || pb.ok) ? bitwise(op, pa.value, pb.ok ? pb.value : 0n, bits) : null;

  const infos = useMemo(() => charInfo(chars.slice(0, 500)), [chars]);
  const fromCodes = useMemo(() => codesToText(codes), [codes]);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={numberBaseConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="base">Numbers in every </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { setInBase('auto'); setInput('0xDEADBEEF'); }}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={parsed.ok ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Input" className={`${card} space-y-4`}>
          <Field id="nb-input" label="Number" value={input} onChange={setInput} invalid={!!input.trim() && !parsed.ok} placeholder="255, 0xff, 0b1111…" />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<InBase>
              label="Input base"
              options={[
                { value: 'auto', label: 'Auto' },
                { value: '2', label: 'Bin' },
                { value: '8', label: 'Oct' },
                { value: '10', label: 'Dec' },
                { value: '16', label: 'Hex' },
                { value: 'custom', label: 'Other' },
              ]}
              value={inBase}
              onChange={setInBase}
            />
            {inBase === 'custom' && <Select label="Base" options={BASE_OPTIONS} value={customBase} onChange={setCustomBase} />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Auto reads <code>0x</code>, <code>0b</code> and <code>0o</code> prefixes, otherwise decimal. Any size works; spaces, <code>_</code> and{' '}
            <code>,</code> are ignored.
          </p>
          <div className="flex flex-wrap gap-x-6">
            <Checkbox label="Group digits" checked={group} onChange={setGroup} />
            <Checkbox label="Uppercase" checked={upper} onChange={setUpper} />
          </div>
        </section>

        <section aria-label="Conversions" className={card}>
          {n !== null ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              <OutRow label="Binary" value={fmt(n, 2)} />
              <OutRow label="Octal" value={fmt(n, 8)} />
              <OutRow label="Decimal" value={fmt(n, 10)} />
              <OutRow label="Hex" value={fmt(n, 16)} />
              <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <Select label="As" options={BASE_OPTIONS} value={outBase} onChange={setOutBase} />
                <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900 dark:text-slate-100" data-testid="out-custom">
                  {fmt(n, outBase)}
                </code>
                <CopyButton text={fmt(n, outBase)} />
              </li>
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter a valid integer to see it in other bases.</p>
          )}
        </section>
      </div>

      {n !== null && (
        <Panel eyebrow="Two's complement" icon="hash">
          <ul className="space-y-4">
            {[8, 16, 32, 64].map((w) => {
              const t = twosComplement(n, w);
              return (
                <li key={w} className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{w}-bit</span>
                    {t.fits ? <Badge tone="green">fits</Badge> : <Badge tone="amber">overflows, wrapped</Badge>}
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      signed {t.signed.toString()} · unsigned {t.unsigned.toString()} · 0x{t.hex}
                    </span>
                  </div>
                  <code className="block overflow-x-auto whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {t.binary}
                  </code>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <Panel eyebrow="IEEE-754 floating point" icon="layers">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-0 flex-1 basis-56">
              <Field
                id="float-input"
                label={floatMode === 'decimal' ? 'Decimal value' : `Raw bits (hex, ${width / 4} digits)`}
                value={floatText}
                onChange={setFloatText}
                invalid={!!floatText.trim() && !float}
              />
            </div>
            <Segmented<FloatMode>
              label="Float input"
              options={[
                { value: 'decimal', label: 'Decimal' },
                { value: 'bits', label: 'Hex bits' },
              ]}
              value={floatMode}
              onChange={(m) => {
                if (float) setFloatText(m === 'bits' ? float.hex : Number.isNaN(float.value) ? 'NaN' : String(float.value));
                setFloatMode(m);
              }}
            />
            <Segmented<FloatWidth>
              label="Precision"
              options={[
                { value: '32', label: 'float32' },
                { value: '64', label: 'float64' },
              ]}
              value={floatWidth}
              onChange={setFloatWidth}
            />
          </div>
          {float ? (
            <>
              <p className="break-all font-mono text-base leading-relaxed" aria-label="Bit layout" data-testid="float-bits">
                <span className="rounded bg-rose-100 px-0.5 text-rose-800 dark:bg-rose-950 dark:text-rose-300" title="Sign">
                  {float.sign}
                </span>{' '}
                <span className="rounded bg-sky-100 px-0.5 text-sky-800 dark:bg-sky-950 dark:text-sky-300" title="Exponent">
                  {float.exponent}
                </span>{' '}
                <span className="rounded bg-emerald-100 px-0.5 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" title="Mantissa">
                  {float.mantissa}
                </span>
              </p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                <span><span className="font-semibold text-rose-700 dark:text-rose-300">■</span> sign (1 bit)</span>
                <span><span className="font-semibold text-sky-700 dark:text-sky-300">■</span> exponent ({float.exponent.length} bits)</span>
                <span><span className="font-semibold text-emerald-700 dark:text-emerald-300">■</span> mantissa ({float.mantissa.length} bits)</span>
              </p>
              <DetailRows
                rows={[
                  ['Kind', { zero: 'Zero', subnormal: 'Subnormal', normal: 'Normal', infinity: 'Infinity', nan: 'NaN (not a number)' }[float.kind]],
                  ['Hex', <code key="h" className="font-mono">0x{float.hex}</code>],
                  ['Exponent', float.exponentValue === null ? '—' : `2^${float.exponentValue} (stored ${parseInt(float.exponent, 2)})`],
                  ['Stored value', <code key="v" className="break-all font-mono" data-testid="float-exact">{float.exact}</code>],
                ]}
              />
            </>
          ) : (
            floatText.trim() && <ErrorText>{floatMode === 'decimal' ? 'Enter a decimal number, inf or NaN.' : `Enter up to ${width / 4} hex digits.`}</ErrorText>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Bitwise calculator" icon="code">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="bit-a" label="A" value={a} onChange={setA} invalid={!pa.ok} />
            <Field id="bit-b" label="B" value={b} onChange={setB} invalid={!opDef.unary && !pb.ok} />
          </div>
          <div className="flex flex-wrap gap-4">
            <Select label="Operation" options={BIT_OPS.map((o) => ({ value: o.id, label: o.label }))} value={op} onChange={setOp} />
            <Select label="Width" options={WIDTHS.map((w) => ({ value: w, label: `${w} bits` }))} value={bits} onChange={setBits} />
          </div>
          {bit?.ok ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              <OutRow label="Result bin" value={groupDigits(bit.unsigned.toString(2).padStart(bits, '0'), 4, ' ')} />
              <OutRow label="Result hex" value={toBase(bit.unsigned, 16, { group, upper })} />
              <OutRow label="Unsigned" value={bit.unsigned.toString()} />
              <OutRow label="Signed" value={bit.signed.toString()} />
            </ul>
          ) : (
            <ErrorText>{bit && !bit.ok ? bit.error : 'Enter integers for A and B (decimal, 0x…, 0b… or 0o…).'}</ErrorText>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Characters and codes" icon="text">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-3">
            <Field id="chars-input" label="Text → codes" value={chars} onChange={setChars} />
            {infos.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Char</th>
                      <th className="px-3 py-2 font-medium">Code point</th>
                      <th className="px-3 py-2 font-medium">Dec</th>
                      <th className="px-3 py-2 font-medium">UTF-8</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono dark:divide-slate-800">
                    {infos.map((c, i) => (
                      <tr key={i} className="text-slate-800 dark:text-slate-200">
                        <td className="px-3 py-1.5">{c.char === ' ' ? '␠' : c.char}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{c.unicode}</td>
                        <td className="px-3 py-1.5">{c.codePoint}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          {c.utf8}
                          {!c.ascii && <span className="ml-2 font-sans text-xs text-slate-500">non-ASCII</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            <Field id="codes-input" label="Codes → text" value={codes} onChange={setCodes} invalid={!fromCodes.ok} placeholder="72 105, 0x48, U+1F600" />
            {fromCodes.ok ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-950">
                <span className="min-w-0 break-all font-mono text-lg text-slate-900 dark:text-slate-100" data-testid="codes-text">
                  {fromCodes.text}
                </span>
                <CopyButton text={fromCodes.text} />
              </div>
            ) : (
              <ErrorText>{fromCodes.error}</ErrorText>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">Decimal, 0x… or …h hex, U+… or 0b…, separated by spaces or commas.</p>
          </div>
        </div>
      </Panel>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Everything runs in your browser with arbitrary-precision integers, so large values are never rounded.
      </p>
    </div>
  );
}
