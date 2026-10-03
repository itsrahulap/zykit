import { useEffect, useId, useState, type ReactNode } from 'react';
import sshKeyGenerator from './index';
import {
  authorizedKeysLine,
  checkExpiry,
  generateSshKey,
  KEY_TYPES,
  supportsEd25519,
  type AuthorizedKeyOptions,
  type KeyType,
  type SshKeyPair,
} from './features/ssh-key-generator';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';

const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';
const toolbarButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';

function TextField({ label, value, onChange, placeholder, hint, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; error?: string | null }) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={!!error || undefined}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        className={field}
      />
      {(hint || error) && (
        <p id={`${id}-hint`} className={`text-xs ${error ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function KeyBlock({ title, text, label, actions }: { title: string; text: string; label: string; actions: ReactNode }) {
  return (
    <section className={card} aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow text-slate-600 dark:text-slate-400">{title}</h2>
        <div className="flex flex-wrap items-center gap-1">{actions}</div>
      </div>
      <CodeBlock label={label} className="max-h-96 overflow-y-auto">{text}</CodeBlock>
    </section>
  );
}

export default function SshKeyGeneratorPage() {
  const [type, setType] = useState<KeyType>('ed25519');
  const [comment, setComment] = useState('');
  const [edOk, setEdOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<SshKeyPair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [privFormat, setPrivFormat] = useState<'openssh' | 'pkcs8'>('openssh');
  const [opts, setOpts] = useState<AuthorizedKeyOptions>({});
  const commentId = useId();

  useEffect(() => {
    let live = true;
    supportsEd25519().then((ok) => {
      if (!live) return;
      setEdOk(ok);
      if (!ok) setType((t) => (t === 'ed25519' ? 'ecdsa-p256' : t));
    });
    return () => {
      live = false;
    };
  }, []);

  const options = KEY_TYPES.map((o) => (o.value === 'ed25519' && edOk === false ? { ...o, label: 'Ed25519 (not supported here)' } : o));

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      setKey(await generateSshKey(type, comment));
    } catch (e) {
      setKey(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const expiryError = checkExpiry(opts.expiryTime ?? '');
  const set = (patch: Partial<AuthorizedKeyOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const authLine = key ? authorizedKeysLine(key.publicLine, expiryError ? { ...opts, expiryTime: '' } : opts) : '';
  const privText = key ? (privFormat === 'openssh' ? key.privateOpenSsh : key.privatePkcs8Pem) : '';
  const privFile = key ? (privFormat === 'openssh' ? key.fileBase : `${key.fileBase}.pem`) : '';

  const status = busy
    ? type.startsWith('rsa-4096')
      ? 'Generating… RSA 4096 can take a few seconds.'
      : 'Generating…'
    : error
      ? 'Could not generate a key.'
      : key
        ? `Generated a ${key.bits}-bit ${key.algorithm} key.`
        : 'Choose a key type and press Generate.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={sshKeyGenerator} />
      <Headline accent="locally">Generate SSH keys </Headline>
      <StatusStrip status={status} tone={busy ? 'busy' : key && !error ? 'good' : 'neutral'} />

      <div role="note" className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="min-w-0">
          <strong>Your keys never leave this browser.</strong> They are generated with the Web Crypto API on this device, are not uploaded or stored, and disappear when you close the tab. Download or copy them before leaving.
        </p>
      </div>

      {edOk === false && <Notices items={['This browser’s Web Crypto API can’t generate Ed25519 keys. Update the browser for Ed25519, or use ECDSA or RSA here.']} />}

      <section aria-label="Key options" className={`${card} flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end`}>
        <Select label="Key type" options={options} value={type} onChange={setType} />
        <div className="min-w-0 flex-1 sm:min-w-56">
          <label htmlFor={commentId} className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
            Comment
          </label>
          <input id={commentId} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="you@laptop" spellCheck={false} autoComplete="off" className={field} />
        </div>
        <Button onClick={generate} disabled={busy || (type === 'ed25519' && edOk === false)}>
          <Icon name="key" className="h-4 w-4" /> {key ? 'Generate new key' : 'Generate'}
        </Button>
      </section>

      {error && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      {key && (
        <>
          <Panel eyebrow="Fingerprints" icon="hash">
            <DetailRows
              rows={[
                ['Type', `${key.algorithm} (${key.bits} bits)`],
                ['SHA-256', <code key="SHA-256" className="font-mono text-sm break-all">{key.fingerprintSha256}</code>],
                ['MD5 (legacy)', <code key="MD5 (legacy)" className="font-mono text-sm break-all">{key.fingerprintMd5}</code>],
                ['ssh-keygen -l', <code key="ssh-keygen -l" className="font-mono text-sm break-all">{key.keygenLine}</code>],
              ]}
            />
          </Panel>

          <KeyBlock
            title={`Public key (${key.fileBase}.pub)`}
            label="Public key"
            text={key.publicLine}
            actions={
              <>
                <CopyButton text={key.publicLine} label="Copy public key" />
                <SendToMenu text={key.publicLine} kind="text" />
                <button type="button" className={toolbarButton} onClick={() => downloadText(key.publicLine + '\n', `${key.fileBase}.pub`, 'text/plain')}>
                  <Icon name="download" className="h-4 w-4" /> Download {key.fileBase}.pub
                </button>
              </>
            }
          />

          <section className={card} aria-label="Private key">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">Private key ({privFile})</h2>
              <div className="flex flex-wrap items-center gap-1">
                <CopyButton text={privText} label="Copy private key" />
                <button type="button" className={toolbarButton} onClick={() => downloadText(privText, privFile, 'application/x-pem-file')}>
                  <Icon name="download" className="h-4 w-4" /> Download {privFile}
                </button>
              </div>
            </div>
            <Segmented
              label="Private key format"
              value={privFormat}
              onChange={setPrivFormat}
              options={[
                { value: 'openssh', label: 'OpenSSH' },
                { value: 'pkcs8', label: 'PKCS#8 PEM' },
              ]}
            />
            <Notices
              items={[
                `This private key is not encrypted. To add a passphrase, save it and run: ssh-keygen -p -f ~/.ssh/${key.fileBase}`,
                `Keep it private: chmod 600 ~/.ssh/${key.fileBase}. Anyone with this file can log in as you.`,
              ]}
            />
            <CodeBlock label="Private key" className="max-h-96 overflow-y-auto">{privText}</CodeBlock>
          </section>

          <KeyBlock title="Public key (SPKI PEM)" label="Public key PEM" text={key.publicSpkiPem} actions={<CopyButton text={key.publicSpkiPem} label="Copy PEM" />} />

          <section className={card} aria-label="authorized_keys line">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">authorized_keys line</h2>
              <CopyButton text={authLine} label="Copy line" />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Checkbox label="restrict (disable all forwarding and PTY)" checked={!!opts.restrict} onChange={(v) => set({ restrict: v })} />
              {!opts.restrict && (
                <>
                  <Checkbox label="no-port-forwarding" checked={!!opts.noPortForwarding} onChange={(v) => set({ noPortForwarding: v })} />
                  <Checkbox label="no-agent-forwarding" checked={!!opts.noAgentForwarding} onChange={(v) => set({ noAgentForwarding: v })} />
                  <Checkbox label="no-X11-forwarding" checked={!!opts.noX11Forwarding} onChange={(v) => set({ noX11Forwarding: v })} />
                  <Checkbox label="no-pty" checked={!!opts.noPty} onChange={(v) => set({ noPty: v })} />
                </>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="from= (hosts)" value={opts.from ?? ''} onChange={(v) => set({ from: v })} placeholder="10.0.0.0/8,*.example.com" />
              <TextField label="command= (forced command)" value={opts.command ?? ''} onChange={(v) => set({ command: v })} placeholder="/usr/bin/backup" />
              <TextField label="expiry-time=" value={opts.expiryTime ?? ''} onChange={(v) => set({ expiryTime: v })} placeholder="20271231" hint="YYYYMMDD[HHMM[SS]]" error={expiryError} />
            </div>
            <CodeBlock label="authorized_keys line">{authLine}</CodeBlock>
          </section>
        </>
      )}
    </div>
  );
}
