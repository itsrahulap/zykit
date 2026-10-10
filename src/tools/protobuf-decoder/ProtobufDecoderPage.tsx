import { useDeferredValue, useMemo, useState } from 'react';
import protobufDecoder from './index';
import { WIRE_NAMES, bytesFromText, decodeGrpc, decodeMessage, fieldsToText, type Decoded, type Field, type InputFormat } from './features/protobuf-decoder';
import { Checkbox, OpenFileButton, OptionsCard } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

const SAMPLE = '0a 07 74 65 73 74 69 6e 67 10 96 01 1a 05 08 01 12 01 78 25 00 00 20 41 29 00 00 00 00 00 00 f0 3f 30 01';
const FORMATS: { value: InputFormat; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
  { value: 'base64url', label: 'Base64URL' },
];
type Parsed =
  | { msg: string; results?: undefined; size?: undefined; error?: undefined }
  | { msg?: undefined; size: number; results: { label: string; result: Decoded }[]; error?: { message: string; offset: number } };
const MAX_FILE = 8 * 1024 * 1024;
const MAX_CHARS = 10_000_000;

function Tree({ fields }: { fields: Field[] }) {
  return (
    <ul className="space-y-2">
      {fields.map((f) => {
        const row = (
          <>
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">#{f.num}</span>{' '}
            <span className="text-xs text-slate-600 dark:text-slate-400">{WIRE_NAMES[f.wire]} · @{f.offset}–{f.end}</span>{' '}
            <span className="font-mono text-sm break-all text-slate-900 dark:text-slate-100">{f.value}</span>
          </>
        );
        return (
          <li key={f.offset} className="min-w-0">
            {f.children ? (
              <details open>
                <summary className="cursor-pointer pointer-coarse:min-h-11">{row}</summary>
                {f.children.length > 0 && (
                  <div className="ml-3 border-l border-slate-200 pl-3 pt-2 dark:border-slate-700">
                    <Tree fields={f.children} />
                  </div>
                )}
              </details>
            ) : (
              row
            )}
            {f.alts.length > 0 && (
              <ul aria-label={`Other readings of field ${f.num}`} className="ml-4 mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                {f.alts.map((a) => (
                  <li key={a} className="break-all font-mono">also {a}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ProtobufDecoderPage() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<InputFormat>('auto');
  const [grpc, setGrpc] = useState(false);
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [fileError, setFileError] = useState('');
  const text = useDeferredValue(input);

  const parsed = useMemo((): Parsed | null => {
    let bytes: Uint8Array;
    if (file) bytes = file.bytes;
    else if (!text.trim()) return null;
    else if (text.length > MAX_CHARS) return { msg: 'This input is too large (limit: about 10 MB of text).' };
    else
      try {
        bytes = bytesFromText(text, format);
      } catch (e) {
        return { msg: e instanceof Error ? e.message : 'Could not read the input.' };
      }
    if (!bytes.length) return { msg: 'The input has no bytes.' };
    if (grpc) {
      const g = decodeGrpc(bytes);
      return { size: bytes.length, results: g.frames.map((f) => ({ label: `Frame at offset ${f.offset} · ${formatBytes(f.length)}${f.compressed ? ' · compressed (decompress it first)' : ''}`, result: f.result })), error: g.error };
    }
    return { size: bytes.length, results: [{ label: '', result: decodeMessage(bytes) }] };
  }, [text, format, grpc, file]);

  const total = parsed?.results ? parsed.results.reduce((n, r) => n + r.result.fields.length, 0) : 0;
  const firstError = parsed?.results ? parsed.error ?? parsed.results.find((r) => r.result.error)?.result.error : undefined;
  const dump = parsed?.results ? parsed.results.map((r) => (r.label ? `# ${r.label}\n` : '') + fieldsToText(r.result.fields)).join('\n') : '';

  useIncomingText(protobufDecoder.id, (t) => (setFile(null), setInput(t)));
  useShareState(
    { input, format, grpc },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.format) setFormat(s.format);
      if (s.grpc !== undefined) setGrpc(s.grpc);
    },
    { format: FORMATS.map((f) => f.value) },
  );

  const status = parsed === null ? 'Paste hex or Base64 bytes, or open a binary file.' : parsed.msg ?? (firstError ? firstError.message : `Decoded ${pluralize(total, 'top-level field')} from ${formatBytes(parsed.size)}.`);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={protobufDecoder} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="protobuf">Decode raw </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => (setFile(null), setInput(SAMPLE), setGrpc(false))}>
            Try an example
          </Button>
          <OpenFileButton
            accept=""
            label="Open binary file"
            onFile={(f) => {
              setFileError('');
              if (f.size > MAX_FILE) return setFileError(`${f.name} is larger than ${formatBytes(MAX_FILE)}.`);
              void f.arrayBuffer().then((b) => setFile({ name: f.name, bytes: new Uint8Array(b) }), () => setFileError(`Couldn't read ${f.name}.`));
            }}
          />
          <Button variant="ghost" disabled={!input && !file} onClick={() => (setInput(''), setFile(null), setFileError(''))}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={parsed?.results && !firstError ? 'good' : 'neutral'} />
      {fileError && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{fileError}</p>}

      <OptionsCard label="Decoding options">
        <Select<InputFormat> label="Input format" options={FORMATS} value={format} onChange={setFormat} />
        <Checkbox label="gRPC frame(s): 5-byte header before each message" checked={grpc} onChange={setGrpc} />
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <CodeArea
            label="Input bytes (hex, Base64 or Base64URL)"
            value={file ? '' : input}
            disabled={!!file}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            placeholder="08 96 01"
            aria-invalid={parsed?.msg ? true : undefined}
            hint={file ? undefined : 'or open a binary file'}
          />
          {file && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Using file <strong className="break-all">{file.name}</strong> ({formatBytes(file.bytes.length)}). Clear it to type bytes instead.
            </p>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          {firstError && (
            <Panel eyebrow="Could not decode everything" icon="warn" className="border-red-200 dark:border-red-900">
              <p role="alert" className="font-medium break-words text-red-800 dark:text-red-300">{firstError.message}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Fields read before the problem are shown below.</p>
            </Panel>
          )}
          {parsed?.results && (
            <section aria-label="Decoded fields" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
                <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="hash" className="h-4 w-4" /> Fields
                </h2>
                <CopyButton text={dump} label="Copy as text" disabled={!dump} />
              </header>
              <div className="max-h-[40rem] space-y-6 overflow-auto p-4 sm:p-6">
                {parsed.results.map((r, i) => (
                  <div key={i} className="min-w-0 space-y-2">
                    {r.label && <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{r.label}</h3>}
                    {r.result.fields.length ? <Tree fields={r.result.fields} /> : <p className="text-sm text-slate-500">No fields.</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Decoding happens in your browser. Without a .proto file, the field types are guesses: the other readings of each value are listed under it.
      </p>
    </div>
  );
}
