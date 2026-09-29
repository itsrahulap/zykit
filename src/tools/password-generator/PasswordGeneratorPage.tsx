import { useMemo, useState } from 'react';
import passwordGenerator from './index';
import {
  crackTime,
  generatePassphrase,
  generatePasswords,
  MAX_LENGTH,
  MAX_WORDS,
  MIN_LENGTH,
  MIN_WORDS,
  passphraseBits,
  strengthLabel,
  type SetName,
  type Strength,
} from './features/password';
import { WORDS } from './features/words';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { createSampler } from '../../shared/lib/random';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Mode = 'password' | 'passphrase';
type Sep = '-' | ' ' | '.' | '_' | '';

const SET_LABELS: Record<SetName, string> = {
  lower: 'Lowercase (a–z)',
  upper: 'Uppercase (A–Z)',
  digits: 'Digits (0–9)',
  symbols: 'Symbols (!@#…)',
};

const STRENGTH_STYLE: Record<Strength, { bar: string; width: string }> = {
  'Very weak': { bar: 'bg-red-500', width: 'w-1/5' },
  Weak: { bar: 'bg-orange-500', width: 'w-2/5' },
  Fair: { bar: 'bg-amber-500', width: 'w-3/5' },
  Strong: { bar: 'bg-emerald-500', width: 'w-4/5' },
  'Very strong': { bar: 'bg-emerald-600', width: 'w-full' },
};

const clamp = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : min);

const inputClass =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 pointer-coarse:min-h-11 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const card = 'rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900';

/** Slider plus number box, kept in sync. */
function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <span className="eyebrow block text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          aria-label={`${label} slider`}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1 accent-emerald-600 pointer-coarse:min-h-11"
        />
        <input
          type="number"
          min={min}
          max={max}
          aria-label={label}
          value={draft ?? value}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value !== '' && n >= min && n <= max) onChange(Math.round(n));
          }}
          onBlur={() => {
            if (draft !== null) onChange(clamp(Number(draft), min, max));
            setDraft(null);
          }}
          className={`${inputClass} w-20 text-center font-mono`}
        />
      </div>
    </div>
  );
}

export default function PasswordGeneratorPage() {
  const [mode, setMode] = useState<Mode>('password');
  const [length, setLength] = useState(20);
  const [sets, setSets] = useState<Record<SetName, boolean>>({ lower: true, upper: true, digits: true, symbols: true });
  const [excludeLookAlikes, setExcludeLookAlikes] = useState(false);
  const [exclude, setExclude] = useState('');
  const [requireEach, setRequireEach] = useState(true);
  const [words, setWords] = useState(5);
  const [separator, setSeparator] = useState<Sep>('-');
  const [capitalize, setCapitalize] = useState(false);
  const [addNumber, setAddNumber] = useState(false);
  const [count, setCount] = useState(5);
  const [nonce, setNonce] = useState(0);

  // Regenerates whenever an option changes or "Generate" is pressed. Nothing is persisted.
  const result = useMemo(() => {
    void nonce;
    const sampler = createSampler();
    if (mode === 'password') return generatePasswords({ length, sets, excludeLookAlikes, exclude, requireEach }, count, sampler);
    const o = { words, separator, capitalize, addNumber };
    return { ok: true as const, passwords: Array.from({ length: count }, () => generatePassphrase(o, sampler)), bits: passphraseBits(o) };
  }, [nonce, mode, length, sets, excludeLookAlikes, exclude, requireEach, words, separator, capitalize, addNumber, count]);

  const bits = result.ok ? result.bits : 0;
  const strength = strengthLabel(bits);
  const style = STRENGTH_STYLE[strength];
  useToolShortcuts({ onRun: () => setNonce((n) => n + 1), getOutput: () => (result.ok ? result.passwords.join('\n') : '') });

  return (
    <div className="space-y-8">
      <Breadcrumb tool={passwordGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="password">Make a strong </Headline>
        <Button onClick={() => setNonce((n) => n + 1)}>
          <Icon name="dice" className="h-4 w-4" /> Generate
        </Button>
      </div>

      <StatusStrip
        status={result.ok ? `${strength} · ${Math.round(bits)} bits of entropy` : result.error}
        tone={result.ok && bits >= 60 ? 'good' : 'neutral'}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section aria-label="Options" className={`${card} min-w-0 space-y-6`}>
          <Segmented<Mode>
            label="Mode"
            options={[
              { value: 'password', label: 'Password' },
              { value: 'passphrase', label: 'Passphrase' },
            ]}
            value={mode}
            onChange={setMode}
          />

          {mode === 'password' ? (
            <>
              <RangeField label="Length" value={length} min={MIN_LENGTH} max={MAX_LENGTH} onChange={setLength} />
              <fieldset className="space-y-1">
                <legend className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Characters</legend>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {(Object.keys(SET_LABELS) as SetName[]).map((n) => (
                    <Checkbox key={n} label={SET_LABELS[n]} checked={sets[n]} onChange={(v) => setSets((s) => ({ ...s, [n]: v }))} />
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1">
                <Checkbox label="Exclude look-alikes (0 O 1 l I |)" checked={excludeLookAlikes} onChange={setExcludeLookAlikes} />
                <Checkbox label="At least one of each chosen set" checked={requireEach} onChange={setRequireEach} />
              </div>
              <label className="block">
                <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Also exclude</span>
                <input
                  type="text"
                  value={exclude}
                  onChange={(e) => setExclude(e.target.value)}
                  placeholder={'e.g. "\'`\\'}
                  spellCheck={false}
                  autoComplete="off"
                  className={`${inputClass} w-full font-mono`}
                />
              </label>
            </>
          ) : (
            <>
              <RangeField label="Words" value={words} min={MIN_WORDS} max={MAX_WORDS} onChange={setWords} />
              <div className="space-y-2">
                <span className="eyebrow block text-slate-600 dark:text-slate-400">Separator</span>
                <Segmented<Sep>
                  label="Separator"
                  options={[
                    { value: '-', label: 'Hyphen' },
                    { value: ' ', label: 'Space' },
                    { value: '.', label: 'Dot' },
                    { value: '_', label: 'Underscore' },
                    { value: '', label: 'None' },
                  ]}
                  value={separator}
                  onChange={setSeparator}
                />
              </div>
              <div className="space-y-1">
                <Checkbox label="Capitalise words" checked={capitalize} onChange={setCapitalize} />
                <Checkbox label="Add a number" checked={addNumber} onChange={setAddNumber} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Words are picked from a built-in list of {WORDS.length.toLocaleString('en-US')} common English words.</p>
            </>
          )}

          <RangeField label="How many" value={count} min={1} max={50} onChange={setCount} />
        </section>

        <div className="min-w-0 space-y-6">
          {result.ok && (
            <>
              <section aria-label="Strength" className={card}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{strength}</p>
                  <p className="font-mono text-sm text-slate-600 dark:text-slate-400">{bits.toFixed(1)} bits</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                  <div className={`h-full rounded-full ${style.bar} ${style.width}`} />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Time to crack: <span className="font-semibold text-slate-800 dark:text-slate-200">{crackTime(bits)}</span>, on average, for an attacker
                  making 100 billion guesses per second against a leaked, fast hash.
                </p>
              </section>

              <section aria-label="Generated" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                  <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Icon name="key" className="h-4 w-4" /> {mode === 'password' ? 'Passwords' : 'Passphrases'}
                  </h2>
                  <CopyButton text={result.passwords.join('\n')} label="Copy all" />
                </header>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.passwords.map((p, i) => (
                    <li key={`${nonce}-${i}`} className="flex items-center justify-between gap-3 px-6 py-3">
                      <code data-testid="generated" className="min-w-0 break-all font-mono text-sm text-slate-900 dark:text-slate-100">
                        {p}
                      </code>
                      <CopyButton text={p} />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Generated in your browser with <code>crypto.getRandomValues</code> and unbiased sampling. Nothing is saved or sent anywhere; reloading the page
        clears everything.
      </p>
    </div>
  );
}
