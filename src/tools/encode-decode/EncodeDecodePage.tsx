import { useMemo, useState } from 'react';
import encodeDecode from './index';
import { CODECS, CodecError, transform, type CodecId, type Direction } from './features/codecs';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Result = { ok: true; text: string } | { ok: false; error: string };

function run(codec: CodecId, direction: Direction, input: string, htmlAllNonAscii: boolean): Result {
  try {
    return { ok: true, text: transform(codec, direction, input, { htmlAllNonAscii }) };
  } catch (e) {
    return { ok: false, error: e instanceof CodecError ? e.message : 'Could not convert this input.' };
  }
}

export default function EncodeDecodePage() {
  const [codec, setCodec] = useState<CodecId>('base64');
  const [direction, setDirection] = useState<Direction>('encode');
  const [input, setInput] = useState('');
  const [htmlAllNonAscii, setHtmlAllNonAscii] = useState(false);

  const result = useMemo(() => run(codec, direction, input, htmlAllNonAscii), [codec, direction, input, htmlAllNonAscii]);
  const output = result.ok ? result.text : '';
  const info = CODECS.find((c) => c.id === codec)!;
  const verb = direction === 'encode' ? 'Encoded' : 'Decoded';

  const swap = () => {
    setInput(output);
    setDirection(direction === 'encode' ? 'decode' : 'encode');
  };

  const status = !input
    ? `Type or paste text to ${direction} it as ${info.label}.`
    : result.ok
      ? `${verb} ${input.length.toLocaleString()} → ${output.length.toLocaleString()} characters.`
      : `Couldn't ${direction} this input.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={encodeDecode} />
      <Headline accent="decode">Encode and </Headline>
      <StatusStrip status={status} tone={input && result.ok ? 'good' : 'neutral'} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<CodecId> label="Codec" options={CODECS.map((c) => ({ value: c.id, label: c.label }))} value={codec} onChange={setCodec} />
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Direction>
            label="Direction"
            options={[
              { value: 'encode', label: 'Encode' },
              { value: 'decode', label: 'Decode' },
            ]}
            value={direction}
            onChange={setDirection}
          />
          <Button variant="secondary" onClick={swap} disabled={!result.ok || !output} aria-label="Swap: move output to input and flip direction">
            <Icon name="swap" className="h-4 w-4" /> Swap
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
        <p>{info.hint}</p>
        {codec === 'html' && direction === 'encode' && (
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={htmlAllNonAscii}
              onChange={(e) => setHtmlAllNonAscii(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />
            Also escape all non-ASCII characters
          </label>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CodeArea
            label="Input"
            hint={direction === 'encode' ? 'Plain text' : info.label}
            rows={12}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'encode' ? 'Hello, world 👋' : 'Paste encoded text…'}
            aria-invalid={!result.ok}
            aria-describedby={!result.ok ? 'codec-error' : undefined}
          />
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
              Clear
            </Button>
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <CodeArea
            label="Output"
            hint={direction === 'encode' ? info.label : 'Plain text'}
            rows={12}
            value={output}
            readOnly
            placeholder="Result appears here"
            className="bg-slate-50 dark:bg-slate-950"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div aria-live="polite" className="min-w-0 flex-1">
              {!result.ok && (
                <p id="codec-error" className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <Icon name="warn" className="h-4 w-4 shrink-0" />
                  <span className="break-words">{result.error}</span>
                </p>
              )}
            </div>
            <CopyButton text={output} label="Copy output" />
          </div>
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversions run in your browser as you type. Nothing you enter is uploaded or stored.
      </p>
    </div>
  );
}
