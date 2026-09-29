import { useMemo, useState, type ChangeEvent } from 'react';
import hashGenerator from './index';
import { formatDigest, HASH_ALGS, HMAC_ALGS, MAX_FILE_BYTES, type HashRequest, type OutputFormat } from './features/hash';
import { useHashes } from './hooks/useHashes';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge } from '../../shared/ui/ui';
import { formatBytes } from '../../shared/utils/format.utils';

type Source = 'text' | 'file';
type LoadedFile = { name: string; size: number; bytes: Uint8Array };

const encoder = new TextEncoder();

export default function HashGeneratorPage() {
  const [source, setSource] = useState<Source>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [useHmac, setUseHmac] = useState(false);
  const [key, setKey] = useState('');
  const [format, setFormat] = useState<OutputFormat>('hex');

  const needsKey = useHmac && !key;
  const req = useMemo<HashRequest | null>(() => {
    if (needsKey) return null;
    const data = source === 'text' ? encoder.encode(text) : file?.bytes;
    if (!data) return null;
    return { data, hmacKey: useHmac ? encoder.encode(key) : undefined };
  }, [source, text, file, useHmac, key, needsKey]);

  // Typing is debounced; a freshly chosen file is hashed straight away.
  const { busy, values, error } = useHashes(req, source === 'text' ? 150 : 0);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFileError(null);
    if (f.size > MAX_FILE_BYTES) {
      setFileError(`${f.name} is ${formatBytes(f.size)}. Files up to ${formatBytes(MAX_FILE_BYTES)} can be hashed here.`);
      return;
    }
    setReading(true);
    try {
      setFile({ name: f.name, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()) });
    } catch {
      setFileError(`Couldn't read ${f.name}.`);
    } finally {
      setReading(false);
    }
  };

  const algs = useHmac ? HMAC_ALGS : HASH_ALGS;
  const inputSize = source === 'text' ? encoder.encode(text).length : (file?.size ?? 0);
  const hasInput = source === 'text' || !!file;
  const status = reading
    ? 'Reading file…'
    : needsKey
      ? 'Enter an HMAC key to compute HMACs.'
      : !hasInput
        ? 'Choose a file to hash.'
        : busy
          ? 'Hashing…'
          : `${algs.length} ${useHmac ? 'HMACs' : 'hashes'} of ${formatBytes(inputSize)}${source === 'file' && file ? ` (${file.name})` : ''}.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={hashGenerator} />
      <Headline accent="fingerprint">Every input has a </Headline>
      <StatusStrip status={status} tone={busy || reading ? 'busy' : values && !needsKey ? 'good' : 'neutral'} />

      {fileError && <ErrorAlert message={fileError} onDismiss={() => setFileError(null)} />}
      {error && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <Segmented<Source>
          label="Input source"
          options={[
            { value: 'text', label: 'Text' },
            { value: 'file', label: 'File' },
          ]}
          value={source}
          onChange={setSource}
        />

        {source === 'text' ? (
          <CodeArea
            label="Text to hash"
            hint="Hashed as UTF-8"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text…"
          />
        ) : (
          <div className="space-y-2">
            <label className="block">
              <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">File to hash</span>
              <input
                type="file"
                onChange={onFile}
                className="block w-full min-w-0 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-semibold file:text-slate-800 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
              />
            </label>
            <p className="break-all text-sm text-slate-500 dark:text-slate-400">
              {file ? `${file.name} · ${formatBytes(file.size)}` : `Up to ${formatBytes(MAX_FILE_BYTES)}. The file is read in your browser and never uploaded.`}
            </p>
          </div>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
            <input type="checkbox" checked={useHmac} onChange={(e) => setUseHmac(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
            HMAC mode (keyed hash)
          </label>
          {useHmac && (
            <label className="block">
              <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">HMAC key</span>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder="Secret key (UTF-8)"
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900" aria-busy={busy}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">{useHmac ? 'HMAC results' : 'Hash results'}</h2>
          <Segmented<OutputFormat>
            label="Output format"
            options={[
              { value: 'hex', label: 'hex' },
              { value: 'HEX', label: 'HEX' },
              { value: 'base64', label: 'Base64' },
            ]}
            value={format}
            onChange={setFormat}
          />
        </div>
        <ul className={`divide-y divide-slate-100 dark:divide-slate-800 ${busy ? 'opacity-60' : ''}`}>
          {algs.map((alg) => {
            const name = useHmac ? `HMAC-${alg}` : alg;
            const bytes = !needsKey ? values?.[alg] : undefined;
            const value = bytes ? formatDigest(bytes, format) : '';
            return (
              <li key={alg} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-28 shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</span>
                <code aria-label={`${name} value`} className="min-w-0 flex-1 break-all font-mono text-sm text-slate-700 dark:text-slate-300">
                  {value || '—'}
                </code>
                <div className="shrink-0 self-end sm:self-auto">
                  <CopyButton text={value} label={`Copy ${name}`} disabled={busy} />
                </div>
              </li>
            );
          })}
          {useHmac && (
            <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-28 shrink-0 text-sm font-semibold text-slate-400 dark:text-slate-500">HMAC-MD5</span>
              <Badge>Not supported</Badge>
            </li>
          )}
        </ul>
      </section>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        MD5 and SHA-1 are broken for security purposes; use them only for checksums and compatibility. Hashes are computed in your
        browser with the Web Crypto API. Nothing is uploaded.
      </p>
    </div>
  );
}
