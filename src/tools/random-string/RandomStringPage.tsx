import { useMemo, useState } from 'react';
import randomString from './index';
import {
  alphabetFor,
  clampInt,
  formatOutput,
  generateStrings,
  MAX_COUNT,
  MAX_LENGTH,
  PRESETS,
  stringBits,
  type OutputFormat,
  type PresetId,
} from './features/randomString';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';
import { downloadText } from '../../shared/utils/dom.utils';

/** Output longer than this is truncated on screen; copy and download still get all of it. */
const MAX_PREVIEW_CHARS = 200_000;

const inputClass =
  'rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-950 dark:text-slate-100';

function download(text: string, format: OutputFormat) {
  const json = format === 'json';
  downloadText(text, json ? 'random-strings.json' : 'random-strings.txt', json ? 'application/json' : 'text/plain');
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="block">
      <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
        {label} <span className="normal-case tracking-normal font-normal text-slate-500">
          ({min}–{max.toLocaleString('en-US')})
        </span>
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft ?? value}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== '' && n >= min && n <= max) onChange(Math.round(n));
        }}
        onBlur={() => {
          if (draft !== null) onChange(clampInt(Number(draft), min, max));
          setDraft(null);
        }}
        className={`${inputClass} w-full font-mono`}
      />
    </label>
  );
}

export default function RandomStringPage() {
  const [preset, setPreset] = useState<PresetId>('hex-lower');
  const [custom, setCustom] = useState('');
  const [length, setLength] = useState(32);
  const [count, setCount] = useState(5);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [format, setFormat] = useState<OutputFormat>('lines');
  const [nonce, setNonce] = useState(0);

  const alphabet = useMemo(() => alphabetFor(preset, custom), [preset, custom]);

  // Regenerates on any option change or when "Generate" is pressed.
  const values = useMemo(() => {
    void nonce;
    return alphabet.length ? generateStrings({ alphabet, length, count, prefix, suffix }) : [];
  }, [nonce, alphabet, length, count, prefix, suffix]);
  const output = useMemo(() => formatOutput(values, format), [values, format]);
  useToolShortcuts({
    onRun: () => alphabet.length > 0 && setNonce((n) => n + 1),
    getOutput: () => output,
    onDownload: () => output && download(output, format),
  });
  const preview = output.length > MAX_PREVIEW_CHARS ? output.slice(0, MAX_PREVIEW_CHARS) : output;

  const bits = stringBits(alphabet.length, length);
  const status = !alphabet.length
    ? 'Type the characters to pick from.'
    : alphabet.length === 1
      ? 'Only one character to pick from, so every string is the same.'
      : `${pluralize(count, 'string')} · ${Math.round(bits)} bits of entropy each`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={randomString} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="strings">Generate random </Headline>
        <Button onClick={() => setNonce((n) => n + 1)} disabled={!alphabet.length}>
          <Icon name="dice" className="h-4 w-4" /> Generate
        </Button>
      </div>

      <StatusStrip status={status} tone={alphabet.length > 1 && bits >= 128 ? 'good' : 'neutral'} />

      <section aria-label="Options" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Select<PresetId>
            label="Characters"
            options={(Object.keys(PRESETS) as PresetId[]).map((id) => ({ value: id, label: PRESETS[id].label }))}
            value={preset}
            onChange={setPreset}
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {alphabet.length} unique {alphabet.length === 1 ? 'character' : 'characters'} · {bits.toFixed(1)} bits per string
          </p>
        </div>

        {preset === 'custom' && (
          <label className="block">
            <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Custom characters</span>
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="ABCDEFGHJKMNPQRSTVWXYZ23456789"
              spellCheck={false}
              autoComplete="off"
              className={`${inputClass} w-full font-mono`}
            />
            <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">Repeated characters are counted once.</span>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Length" value={length} min={1} max={MAX_LENGTH} onChange={setLength} />
          <NumberField label="How many" value={count} min={1} max={MAX_COUNT} onChange={setCount} />
          <label className="block">
            <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Prefix</span>
            <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="sk_" spellCheck={false} autoComplete="off" className={`${inputClass} w-full font-mono`} />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Suffix</span>
            <input type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} spellCheck={false} autoComplete="off" className={`${inputClass} w-full font-mono`} />
          </label>
        </div>

        <Segmented<OutputFormat>
          label="Output format"
          options={[
            { value: 'lines', label: 'One per line' },
            { value: 'comma', label: 'Comma-separated' },
            { value: 'json', label: 'JSON array' },
          ]}
          value={format}
          onChange={setFormat}
        />
      </section>

      {values.length > 0 && (
        <section aria-label="Output" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="text" className="h-4 w-4" /> Output
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <CopyButton text={output} />
              <SendToMenu text={output} kind={format === 'json' ? 'json' : 'text'} />
              <button
                type="button"
                onClick={() => download(output, format)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 pointer-coarse:min-h-11 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon name="download" className="h-4 w-4" /> Download
              </button>
            </div>
          </header>
          <div className="p-4">
            <CodeBlock className="max-h-[36rem] overflow-y-auto">{preview}</CodeBlock>
            {preview.length < output.length && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Showing the start of the output. Copy or download to get all of it.</p>
            )}
          </div>
        </section>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Made in your browser with <code>crypto.getRandomValues</code> and rejection sampling, so every character is equally likely. Prefix and suffix
        add no entropy.
      </p>
    </div>
  );
}
