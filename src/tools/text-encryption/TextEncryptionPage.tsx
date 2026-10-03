import { useId, useState } from 'react';
import textEncryption from './index';
import {
  DecryptError,
  DEFAULT_ITERATIONS,
  decryptedName,
  decryptFile,
  decryptText,
  encryptFile,
  encryptText,
  isEncryptedFile,
  MAX_FILE_BYTES,
  passphraseStrength,
  type Strength,
} from './features/text-encryption';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { Notices } from '../../shared/ui/convert';
import { FilePickerButton } from '../../shared/ui/ImageBatch';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadBlob } from '../../shared/utils/dom.utils';
import { formatBytes } from '../../shared/utils/format.utils';

type Mode = 'encrypt' | 'decrypt';
type Source = 'text' | 'file';
type Result = { kind: 'text'; text: string } | { kind: 'file'; name: string; blob: Blob; size: number } | { kind: 'error'; message: string } | null;

const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';

const ITERATIONS = [
  { value: DEFAULT_ITERATIONS, label: '600,000 (default)' },
  { value: 1_000_000, label: '1,000,000' },
  { value: 2_000_000, label: '2,000,000' },
];

const meter: Record<Strength, { width: string; colour: string }> = {
  empty: { width: '0%', colour: 'bg-slate-300' },
  'very weak': { width: '15%', colour: 'bg-red-600' },
  weak: { width: '35%', colour: 'bg-orange-500' },
  fair: { width: '55%', colour: 'bg-amber-500' },
  strong: { width: '80%', colour: 'bg-emerald-500' },
  'very strong': { width: '100%', colour: 'bg-emerald-600' },
};

export default function TextEncryptionPage() {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [source, setSource] = useState<Source>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [show, setShow] = useState(false);
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const passId = useId();
  const strengthId = useId();

  useIncomingText(textEncryption.id, (t) => {
    setSource('text');
    setText(t);
    setMode(t.trim().startsWith('zykit:') ? 'decrypt' : 'encrypt');
    setResult(null);
  });

  const strength = passphraseStrength(passphrase);
  const reset = () => setResult(null);

  const pickFile = (f: File | undefined) => {
    setResult(null);
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setFile(null);
      setResult({ kind: 'error', message: `${f.name} is ${formatBytes(f.size)}. Files up to 100 MB are supported.` });
      return;
    }
    setFile(f);
    if (f.name.toLowerCase().endsWith('.zyk')) setMode('decrypt');
  };

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      if (source === 'text') {
        const out = mode === 'encrypt' ? await encryptText(text, passphrase, iterations) : await decryptText(text, passphrase);
        setResult({ kind: 'text', text: out });
      } else if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (mode === 'encrypt') {
          const out = await encryptFile(file.name, bytes, passphrase, iterations);
          setResult({ kind: 'file', name: `${file.name}.zyk`, blob: new Blob([out], { type: 'application/octet-stream' }), size: out.length });
        } else {
          if (!isEncryptedFile(bytes)) throw new DecryptError('format', 'Unknown format: this is not a .zyk file made by this tool.');
          const out = await decryptFile(bytes, passphrase);
          const name = decryptedName(file.name, out.name);
          setResult({ kind: 'file', name, blob: new Blob([new Uint8Array(out.data)]), size: out.data.length });
        }
      }
    } catch (e) {
      setResult({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const canRun = !busy && !!passphrase && (source === 'text' ? mode === 'encrypt' || !!text.trim() : !!file);
  const status = busy
    ? `${mode === 'encrypt' ? 'Encrypting' : 'Decrypting'}… deriving the key takes a moment.`
    : result?.kind === 'error'
      ? 'Something went wrong. See the message below.'
      : result
        ? mode === 'encrypt'
          ? 'Encrypted. Share the passphrase separately.'
          : 'Decrypted.'
        : 'Enter a passphrase and some text or a file.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={textEncryption} />
      <Headline accent="passphrase">Encrypt text with a </Headline>
      <StatusStrip status={status} tone={busy ? 'busy' : result && result.kind !== 'error' ? 'good' : 'neutral'} />

      <Notices items={['Security depends entirely on your passphrase. Anyone with the encrypted output can guess passphrases offline, so use a long, random one, and share it through a different channel.']} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Mode"
          value={mode}
          onChange={(m) => {
            setMode(m);
            reset();
          }}
          options={[
            { value: 'encrypt', label: 'Encrypt' },
            { value: 'decrypt', label: 'Decrypt' },
          ]}
        />
        <Segmented
          label="Input type"
          value={source}
          onChange={(s) => {
            setSource(s);
            reset();
          }}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'file', label: 'File' },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-label="Input">
          <div>
            <label htmlFor={passId} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Passphrase
            </label>
            <div className="flex gap-2">
              <input
                id={passId}
                type={show ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  reset();
                }}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={mode === 'encrypt' ? strengthId : undefined}
                className={field}
              />
              <Button variant="secondary" className="!px-3 !py-2 !text-sm" aria-pressed={show} onClick={() => setShow((s) => !s)}>
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
            {mode === 'encrypt' && (
              <div id={strengthId} className="mt-2 space-y-1 text-sm">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
                  <div className={`h-full ${meter[strength.level].colour}`} style={{ width: meter[strength.level].width }} />
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {strength.level !== 'empty' && (
                    <strong className="font-semibold text-slate-800 capitalize dark:text-slate-200">
                      {strength.level} (~{strength.bits} bits).{' '}
                    </strong>
                  )}
                  {strength.hint}
                </p>
              </div>
            )}
          </div>

          {mode === 'encrypt' && (
            <Select label="PBKDF2 iterations" options={ITERATIONS} value={iterations} onChange={setIterations} />
          )}

          {source === 'text' ? (
            <CodeArea
              label={mode === 'encrypt' ? 'Text to encrypt' : 'Encrypted text'}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                reset();
              }}
              rows={8}
              placeholder={mode === 'encrypt' ? 'Type or paste the secret…' : 'zykit:v1:…'}
            />
          ) : (
            <div className="space-y-2">
              <p className="eyebrow text-slate-600 dark:text-slate-400">{mode === 'encrypt' ? 'File to encrypt' : '.zyk file to decrypt'}</p>
              <div className="flex flex-wrap items-center gap-3">
                <FilePickerButton
                  multiple={false}
                  accept={mode === 'decrypt' ? '.zyk' : '*/*'}
                  label="Choose file"
                  variant="secondary"
                  onFiles={(fs) => pickFile(fs[0])}
                />
                <span className="min-w-0 break-all text-sm text-slate-700 dark:text-slate-300">
                  {file ? `${file.name} (${formatBytes(file.size)})` : 'No file chosen. Up to 100 MB.'}
                </span>
              </div>
            </div>
          )}

          <Button onClick={run} disabled={!canRun} className="w-full sm:w-auto">
            <Icon name="lock" className="h-4 w-4" /> {mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </Button>
        </section>

        <section className={card} aria-label="Result" aria-busy={busy}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Result</h2>
            {result?.kind === 'text' && (
              <div className="flex flex-wrap items-center gap-1">
                <CopyButton text={result.text} />
                <SendToMenu text={result.text} kind="text" />
              </div>
            )}
          </div>
          {!result && <p className="text-sm text-slate-500 dark:text-slate-400">The result appears here. Nothing is saved.</p>}
          {result?.kind === 'error' && (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm break-words text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              {result.message}
            </p>
          )}
          {result?.kind === 'text' && <CodeBlock label={mode === 'encrypt' ? 'Encrypted text' : 'Decrypted text'} className="max-h-96 overflow-y-auto">{result.text}</CodeBlock>}
          {result?.kind === 'file' && (
            <div className="space-y-3">
              <p className="text-sm break-all text-slate-700 dark:text-slate-300">
                {result.name} · {formatBytes(result.size)}
              </p>
              <Button onClick={() => downloadBlob(result.blob, result.name)}>
                <Icon name="download" className="h-4 w-4" /> Download {result.name.endsWith('.zyk') ? '.zyk' : 'file'}
              </Button>
            </div>
          )}
        </section>
      </div>

      <Panel eyebrow="Format and compatibility">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>
            AES-256-GCM with a key from PBKDF2-SHA-256 ({DEFAULT_ITERATIONS.toLocaleString('en')}+ iterations, random 16-byte salt) and a random 12-byte IV.
          </li>
          <li>
            Text output is <code className="font-mono">zykit:v1:</code> followed by Base64URL of the iterations, salt, IV, a passphrase check value and the ciphertext. Files are saved as <code className="font-mono">.zyk</code>.
          </li>
          <li>
            <strong>OpenSSL-compatible? No.</strong> <code className="font-mono">openssl enc</code> can’t read this format and this tool can’t read OpenSSL’s <code className="font-mono">Salted__</code> output. Decrypt with this tool.
          </li>
          <li>Nothing is stored or uploaded. Closing the tab forgets the passphrase, text and files.</li>
        </ul>
      </Panel>
    </div>
  );
}
