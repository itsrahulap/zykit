import { useEffect, useMemo, useState } from 'react';
import certificateInspector from './index';
import { ItemCard } from './components/ItemCard';
import { buildChain, inspectBytes, inspectText, MAX_INPUT_BYTES, verifySignature, type ChainReport, type InspectResult } from './features/inspect';
import { SAMPLE_PEM } from './features/sample';
import type { Certificate } from './features/x509';
import { Notices, OpenFileButton } from '../../shared/ui/convert';
import { DropZone } from '../../shared/ui/DropZone';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';

const cn = (c: Certificate) => c.subject.attributes.find((a) => a.name === 'CN')?.value ?? (c.subject.text || '(empty subject)');

function ChainView({ chain }: { chain: ChainReport }) {
  const [sigs, setSigs] = useState<(boolean | null | undefined)[]>([]);
  useEffect(() => {
    let live = true;
    Promise.all(
      chain.ordered.map((l, k) => {
        const issuer = l.link === 'self-signed' ? l.cert : l.link === 'issued-by-next' ? chain.ordered[k + 1]?.cert : undefined;
        return issuer ? verifySignature(l.cert, issuer) : Promise.resolve(undefined);
      }),
    ).then((r) => live && setSigs(r));
    return () => {
      live = false;
    };
  }, [chain]);

  return (
    <Panel eyebrow="Chain" icon="link">
      {!chain.inOrder && (
        <p className="mb-4 text-sm text-amber-800 dark:text-amber-300">
          The certificates were not pasted in leaf → root order. Servers should send the leaf first, then each issuer.
        </p>
      )}
      <ol className="space-y-3">
        {chain.ordered.map((l, k) => {
          const s = sigs[k];
          return (
            <li key={l.index} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <span className="text-slate-500">{k + 1}.</span>
                <span className="break-all">{cn(l.cert)}</span>
                <span className="text-xs font-normal text-slate-500">(block {l.index + 1})</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                {l.link === 'issued-by-next' && <Badge tone="green">Issuer name matches #{k + 2}</Badge>}
                {l.link === 'self-signed' && <Badge tone="blue">Self-signed (root)</Badge>}
                {l.link === 'issuer-missing' && <Badge tone="amber">Issuer not included</Badge>}
                {s === true && <Badge tone="green">Signature verified</Badge>}
                {s === false && <Badge tone="red">Signature does not verify</Badge>}
                {s === null && <Badge>Signature not checked (algorithm unsupported)</Badge>}
              </p>
              {l.link === 'issuer-missing' && (
                <p className="mt-2 text-sm break-all text-slate-600 dark:text-slate-400">Issued by: {l.cert.issuer.text}</p>
              )}
            </li>
          );
        })}
      </ol>
      {chain.unrelated.length > 0 && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Not part of this chain: block {chain.unrelated.map((i) => i + 1).join(', ')}.
        </p>
      )}
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Links are found by matching issuer and subject names (and key identifiers). Signatures are checked in your browser with WebCrypto.
        Trust in a root, revocation and hostname checks are not performed.
      </p>
    </Panel>
  );
}

export default function CertificateInspectorPage() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ name: string; result: InspectResult } | null>(null);
  const [fileError, setFileError] = useState('');
  const [now] = useState(() => Date.now());

  const result = useMemo<InspectResult | null>(() => (file ? file.result : text.trim() ? inspectText(text) : null), [text, file]);
  const certs = useMemo(() => (result?.items.map((i) => i.result).filter((r): r is Certificate => r?.kind === 'certificate') ?? []), [result]);
  const chain = useMemo(() => (certs.length > 1 ? buildChain(certs) : null), [certs]);

  const onFile = async (f: File) => {
    setFileError('');
    if (f.size > MAX_INPUT_BYTES) {
      setFileError('This file is larger than 5 MB, which is too big for a certificate.');
      return;
    }
    const bytes = new Uint8Array(await f.arrayBuffer());
    setText('');
    setFile({ name: f.name, result: inspectBytes(bytes) });
  };

  const count = result?.items.length ?? 0;
  const status = !result
    ? 'Paste a PEM certificate, CSR or key, or open a file.'
    : count === 0
      ? 'Nothing to decode yet.'
      : `Decoded ${count} block${count === 1 ? '' : 's'}${certs.length ? ` (${certs.length} certificate${certs.length === 1 ? '' : 's'})` : ''}.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={certificateInspector} />
      <Headline accent="certificate">Inspect a </Headline>
      <StatusStrip status={status} tone={count ? 'good' : 'neutral'} />

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <DropZone onFile={onFile}>
          <CodeArea
            label="PEM input"
            hint="One or more blocks"
            rows={8}
            value={text}
            onChange={(e) => {
              setFile(null);
              setText(e.target.value);
            }}
            placeholder="-----BEGIN CERTIFICATE-----"
            className="break-all"
          />
        </DropZone>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".pem,.crt,.cer,.der,.csr,.key,.pub,application/x-x509-ca-cert,application/pkix-cert" onFile={onFile} />
          <Button
            variant="secondary"
            className="pointer-coarse:min-h-11"
            onClick={() => {
              setFile(null);
              setText(SAMPLE_PEM);
            }}
          >
            Load sample chain
          </Button>
          <Button
            variant="ghost"
            className="pointer-coarse:min-h-11"
            disabled={!text && !file}
            onClick={() => {
              setFile(null);
              setText('');
            }}
          >
            Clear
          </Button>
        </div>
        {file && (
          <p className="flex items-center gap-2 text-sm break-all text-slate-600 dark:text-slate-400">
            <Icon name="file" className="h-4 w-4 shrink-0" /> {file.name}
          </p>
        )}
        {fileError && <Notices items={[fileError]} />}
      </section>

      {result && <Notices items={result.notices} />}
      {chain && <ChainView chain={chain} />}
      {result?.items.map((item, i) => <ItemCard key={`${i}-${item.label}`} item={item} n={i + 1} now={now} />)}

      {!result && (
        <Panel eyebrow="What you can paste" icon="info">
          <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
            <li>Certificates (<code className="font-mono">BEGIN CERTIFICATE</code>), one or a whole chain</li>
            <li>Certificate signing requests (<code className="font-mono">BEGIN CERTIFICATE REQUEST</code>)</li>
            <li>Public keys (SPKI or PKCS#1)</li>
            <li>Private keys: only the key type and size are shown, never the key itself</li>
            <li>Binary .der / .cer files via Open file</li>
          </ul>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            To grab a site's chain: <code className="font-mono break-all">openssl s_client -connect example.com:443 -showcerts &lt;/dev/null</code>
          </p>
        </Panel>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">Everything is decoded in your browser. Nothing is uploaded.</p>
    </div>
  );
}
