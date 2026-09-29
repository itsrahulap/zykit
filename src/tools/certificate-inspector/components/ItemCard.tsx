import { useEffect, useState, type ReactNode } from 'react';
import { fingerprint, validity, type Item } from '../features/inspect';
import type { Certificate, CertificateRequest, DecodedExtension, Extension, GeneralName, PrivateKeyBlock, PublicKeyInfo } from '../features/x509';
import { DetailRows } from '../../../shared/ui/Panel';
import { CopyButton } from '../../../shared/ui/tool';
import { Badge, Icon } from '../../../shared/ui/ui';

const card = 'min-w-0 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const mono = 'font-mono text-sm break-all';

const fmtDate = (d: Date) => d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

function keySummary(k: PublicKeyInfo | PrivateKeyBlock): string {
  const size = k.bits ? ` ${k.bits}-bit` : '';
  return `${k.type}${size}${k.curve ? ` (${k.curve})` : ''}`;
}

const cnOf = (c: Certificate | CertificateRequest) => c.subject.attributes.find((a) => a.name === 'CN')?.value ?? (c.subject.text || '(empty subject)');

function Names({ names }: { names: GeneralName[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {names.map((n, i) => (
        <li key={i} className="max-w-full rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs break-all text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          <span className="text-slate-500 dark:text-slate-400">{n.type}:</span> {n.value}
        </li>
      ))}
    </ul>
  );
}

function ExtensionBody({ d }: { d: DecodedExtension }): ReactNode {
  switch (d.kind) {
    case 'names':
      return <Names names={d.names} />;
    case 'crlDp':
      return <Names names={d.urls} />;
    case 'keyUsage':
      return <p>{d.usages.join(', ') || 'None'}</p>;
    case 'eku':
      return <p>{d.purposes.map((p) => p.name).join(', ')}</p>;
    case 'basicConstraints':
      return (
        <p>
          {d.ca ? 'Certificate authority (CA)' : 'Not a CA (end-entity)'}
          {d.pathLen !== undefined && `, path length ≤ ${d.pathLen}`}
        </p>
      );
    case 'keyId':
      return <p className={mono}>{d.hex}</p>;
    case 'aki':
      return (
        <div className="space-y-1">
          {d.keyId && <p className={mono}>{d.keyId}</p>}
          {d.issuer && <Names names={d.issuer} />}
          {d.serial && <p className={mono}>Serial {d.serial}</p>}
        </div>
      );
    case 'aia':
      return (
        <ul className="space-y-1">
          {d.entries.map((e, i) => (
            <li key={i} className="break-all">
              <span className="font-medium">{e.method}:</span> <span className="font-mono text-sm">{e.location.value}</span>
            </li>
          ))}
        </ul>
      );
    case 'policies':
      return (
        <ul className="space-y-1">
          {d.policies.map((p, i) => (
            <li key={i} className="break-all">
              {p.name !== p.oid ? `${p.name} ` : ''}
              <span className="font-mono text-xs text-slate-500">{p.oid}</span>
              {p.cps?.map((u) => (
                <span key={u} className="block font-mono text-xs">
                  CPS: {u}
                </span>
              ))}
            </li>
          ))}
        </ul>
      );
    case 'sct':
      return <p>{d.count === null ? 'Present (could not count entries)' : `${d.count} signed certificate timestamp${d.count === 1 ? '' : 's'} embedded`}</p>;
    case 'flag':
      return <p>{d.text}</p>;
  }
}

function Extensions({ list }: { list: Extension[] }) {
  if (!list.length) return <p className="text-sm text-slate-500 dark:text-slate-400">No extensions.</p>;
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {list.map((e, i) => (
        <li key={`${e.oid}-${i}`} className="space-y-1.5 py-3 text-sm text-slate-800 dark:text-slate-200">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="break-all">{e.name}</span>
            {e.name !== e.oid && <span className="font-mono text-xs font-normal text-slate-500">{e.oid}</span>}
            {e.critical && <Badge tone="amber">critical</Badge>}
          </p>
          {e.error ? (
            <p className="text-red-700 dark:text-red-300">{e.error}</p>
          ) : e.decoded ? (
            <ExtensionBody d={e.decoded} />
          ) : (
            <p className="text-slate-500 dark:text-slate-400">Not decoded by this tool.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Fingerprints({ der }: { der: Uint8Array }) {
  const [fp, setFp] = useState<{ sha1: string; sha256: string } | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([fingerprint(der, 'SHA-1'), fingerprint(der, 'SHA-256')]).then(
      ([sha1, sha256]) => live && setFp({ sha1, sha256 }),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [der]);
  if (!fp) return null;
  return (
    <div className="space-y-3">
      {(
        [
          ['SHA-256 fingerprint', fp.sha256],
          ['SHA-1 fingerprint', fp.sha1],
        ] as const
      ).map(([k, v]) => (
        <div key={k}>
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-slate-500 dark:text-slate-400">{k}</p>
            <CopyButton text={v} label="Copy" />
          </div>
          <p className={`${mono} text-slate-800 dark:text-slate-200`}>{v}</p>
        </div>
      ))}
    </div>
  );
}

function ValidityBadge({ cert, now }: { cert: Certificate; now: number }) {
  const v = validity(cert, now);
  if (v.state === 'expired') return <Badge tone="red">Expired {-v.days} day{v.days === -1 ? '' : 's'} ago</Badge>;
  if (v.state === 'not-yet-valid') return <Badge tone="amber">Not valid for {v.days} more day{v.days === 1 ? '' : 's'}</Badge>;
  return <Badge tone={v.days < 30 ? 'amber' : 'green'}>Valid, expires in {v.days} day{v.days === 1 ? '' : 's'}</Badge>;
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mt-6">
    <h3 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">{title}</h3>
    {children}
  </div>
);

function Header({ icon, title, sub, badges }: { icon: 'shield' | 'file' | 'key' | 'warn'; title: string; sub: string; badges?: ReactNode }) {
  return (
    <header className="flex items-start gap-3">
      <Icon name={icon} className="mt-1 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-slate-500 dark:text-slate-400">{sub}</p>
        <h2 className="text-xl font-bold break-all text-slate-900 dark:text-white">{title}</h2>
        {badges && <div className="mt-2 flex flex-wrap gap-2">{badges}</div>}
      </div>
    </header>
  );
}

export function ItemCard({ item, n, now }: { item: Item; n: number; now: number }) {
  const r = item.result;
  if (!r) {
    return (
      <section className={`${card} border-red-200 dark:border-red-900`} aria-label={`Block ${n}`}>
        <Header icon="warn" title={`Block ${n}: ${item.label}`} sub="Could not decode" />
        <p className="mt-3 break-words text-red-800 dark:text-red-300">{item.error}</p>
      </section>
    );
  }
  if (r.kind === 'private-key') {
    return (
      <section className={`${card} border-red-300 dark:border-red-800`} aria-label={`Block ${n}`}>
        <Header icon="key" title={r.encrypted ? 'Encrypted private key' : 'Private key'} sub={`Block ${n} · ${r.format}`} badges={<Badge tone="red">Secret</Badge>} />
        <div role="alert" className="mt-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <Icon name="warn" className="h-5 w-5 shrink-0" />
          <p>
            This is a <strong>private key</strong>. Anyone who has it can impersonate the certificate owner. It stayed in your browser, but
            don't paste real private keys into websites, chats or tickets. If this key was shared, replace it and revoke its certificates. Key
            material is not shown.
          </p>
        </div>
        <div className="mt-4">
          <DetailRows
            rows={[
              ['Key type', r.encrypted && r.type.startsWith('Unknown') ? 'Unknown (encrypted)' : keySummary(r)],
              ['Format', r.format],
              ['Encrypted', r.encrypted ? 'Yes' : 'No'],
            ]}
          />
        </div>
      </section>
    );
  }
  if (r.kind === 'public-key') {
    return (
      <section className={card} aria-label={`Block ${n}`}>
        <Header icon="key" title={`${keySummary(r.publicKey)} public key`} sub={`Block ${n} · ${r.format}`} />
        <div className="mt-4">
          <DetailRows
            rows={[
              ['Algorithm', r.publicKey.algorithm.name],
              ...(r.publicKey.exponent ? ([['Exponent', String(r.publicKey.exponent)]] as [string, string][]) : []),
            ]}
          />
        </div>
        <Section title="Fingerprints (of the DER)">
          <Fingerprints der={r.der} />
        </Section>
      </section>
    );
  }
  if (r.kind === 'csr') {
    return (
      <section className={card} aria-label={`Block ${n}`}>
        <Header icon="file" title={cnOf(r)} sub={`Block ${n} · Certificate signing request`} />
        <div className="mt-4">
          <DetailRows
            rows={[
              ['Subject', r.subject.text || '(empty)'],
              ['Public key', keySummary(r.publicKey)],
              ['Signature', r.signatureAlgorithm.name],
              ['Version', String(r.version)],
              ...(r.otherAttributes.length ? ([['Other attributes', r.otherAttributes.map((a) => a.name).join(', ')]] as [string, string][]) : []),
            ]}
          />
        </div>
        <Section title="Requested extensions">
          <Extensions list={r.extensions} />
        </Section>
      </section>
    );
  }
  return (
    <section className={card} aria-label={`Block ${n}`}>
      <Header
        icon="shield"
        title={cnOf(r)}
        sub={`Block ${n} · X.509 v${r.version} certificate`}
        badges={
          <>
            <ValidityBadge cert={r} now={now} />
            {r.selfIssued && <Badge tone="blue">Self-signed</Badge>}
            {r.extensions.some((e) => e.decoded?.kind === 'basicConstraints' && e.decoded.ca) && <Badge tone="violet">CA</Badge>}
          </>
        }
      />
      <div className="mt-4">
        <DetailRows
          rows={[
            ['Subject', r.subject.text || '(empty)'],
            ['Issuer', r.issuer.text || '(empty)'],
            ['Valid from', fmtDate(r.notBefore)],
            ['Valid until', fmtDate(r.notAfter)],
            ['Public key', keySummary(r.publicKey) + (r.publicKey.exponent ? `, e=${r.publicKey.exponent}` : '')],
            ['Signature', r.signatureAlgorithm.name + (r.signatureAlgorithm.params ? ` (${r.signatureAlgorithm.params})` : '')],
            ['Serial', r.serialHex],
          ]}
        />
      </div>
      <Section title="Extensions">
        <Extensions list={r.extensions} />
      </Section>
      <Section title="Fingerprints">
        <Fingerprints der={r.der} />
      </Section>
    </section>
  );
}
