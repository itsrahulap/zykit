import { useId, useMemo, useState } from 'react';
import emailDnsRecords from './index';
import {
  analyse,
  buildDmarc,
  buildSpf,
  DMARC_DEFAULTS,
  KIND_LABEL,
  recordStatus,
  SPF_DEFAULTS,
  toZoneTxt,
  type DmarcOptions,
  type Issue,
  type ParsedRecord,
  type SpfOptions,
} from './features/email-dns-records';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button } from '../../shared/ui/ui';

type Mode = 'check' | 'dmarc' | 'spf';

const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';

const EXAMPLE = `example.com. 3600 IN TXT "v=spf1 ip4:192.0.2.0/24 include:_spf.google.com include:sendgrid.net ~all"
_dmarc.example.com. 3600 IN TXT "v=DMARC1; p=none; rua=mailto:dmarc@example.com; adkim=s"
_mta-sts.example.com. 3600 IN TXT "v=STSv1; id=20240101T000000"
_smtp._tls.example.com. 3600 IN TXT "v=TLSRPTv1; rua=mailto:tls@example.com"
default._bimi.example.com. 3600 IN TXT "v=BIMI1; l=https://example.com/logo.svg;"`;

const LEVEL_STYLE: Record<Issue['level'], { tone: 'red' | 'amber' | 'blue'; label: string; box: string }> = {
  error: { tone: 'red', label: 'Error', box: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200' },
  warning: { tone: 'amber', label: 'Warning', box: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200' },
  info: { tone: 'blue', label: 'Note', box: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200' },
};

function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  const order = { error: 0, warning: 1, info: 2 } as const;
  return (
    <ul className="space-y-2">
      {[...issues].sort((a, b) => order[a.level] - order[b.level]).map((i, idx) => (
        <li key={idx} className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-sm break-words ${LEVEL_STYLE[i.level].box}`}>
          <span className="shrink-0 font-semibold">{LEVEL_STYLE[i.level].label}:</span>
          <span className="min-w-0">{i.message}</span>
        </li>
      ))}
    </ul>
  );
}

function RecordCard({ rec }: { rec: ParsedRecord }) {
  const status = recordStatus(rec);
  return (
    <article className={card} aria-label={`${KIND_LABEL[rec.kind]} record`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="violet">{KIND_LABEL[rec.kind]}</Badge>
        <Badge tone={status === 'error' ? 'red' : status === 'warning' ? 'amber' : 'green'}>{status === 'error' ? 'Has errors' : status === 'warning' ? 'Has warnings' : 'Looks good'}</Badge>
        {rec.owner && <code className="min-w-0 font-mono text-sm break-all text-slate-600 dark:text-slate-400">{rec.owner}</code>}
      </div>
      {rec.summary && <p className="text-sm text-slate-700 dark:text-slate-300">{rec.summary}</p>}
      <CodeBlock label={`${KIND_LABEL[rec.kind]} record text`}>{rec.raw}</CodeBlock>
      {rec.items.length > 0 && (
        <dl className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {rec.items.map((it, idx) => (
            <div key={idx} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
              <dt className="min-w-0 font-mono font-semibold break-all text-slate-900 dark:text-slate-100">
                {it.label}
                {it.value ? <span className="font-normal text-slate-600 dark:text-slate-400">={it.value}</span> : null}
              </dt>
              <dd className="min-w-0 text-slate-700 dark:text-slate-300">{it.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      <IssueList issues={rec.issues} />
    </article>
  );
}

const POLICY_OPTS = [
  { value: 'none' as const, label: 'none (monitor only)' },
  { value: 'quarantine' as const, label: 'quarantine' },
  { value: 'reject' as const, label: 'reject' },
];
const SP_OPTS = [{ value: '' as const, label: 'same as p' }, ...POLICY_OPTS];
const ALIGN_OPTS = [
  { value: 'r' as const, label: 'relaxed (r)' },
  { value: 's' as const, label: 'strict (s)' },
];
const FO_OPTS = [
  { value: '0' as const, label: '0: all checks fail' },
  { value: '1' as const, label: '1: any check fails' },
  { value: 'd' as const, label: 'd: DKIM fails' },
  { value: 's' as const, label: 's: SPF fails' },
];
const ALL_OPTS = [
  { value: '~all' as const, label: '~all (SoftFail)' },
  { value: '-all' as const, label: '-all (Fail)' },
  { value: '?all' as const, label: '?all (Neutral)' },
];

function TextField({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} autoComplete="off" aria-describedby={hint ? `${id}-h` : undefined} className={field} />
      {hint && (
        <p id={`${id}-h`} className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function EmailDnsRecordsPage() {
  const [mode, setMode] = useState<Mode>('check');
  const [input, setInput] = useState('');
  const [dmarc, setDmarc] = useState<DmarcOptions>(DMARC_DEFAULTS);
  const [spf, setSpf] = useState<SpfOptions>(SPF_DEFAULTS);

  useIncomingText(emailDnsRecords.id, (t) => {
    setMode('check');
    setInput(t);
  });
  useShareState(
    { mode, input, dmarc: JSON.stringify(dmarc), spf: JSON.stringify(spf) },
    (s) => {
      if (s.mode) setMode(s.mode);
      if (s.input !== undefined) setInput(s.input);
      try {
        if (s.dmarc) setDmarc({ ...DMARC_DEFAULTS, ...(JSON.parse(s.dmarc) as Partial<DmarcOptions>) });
        if (s.spf) setSpf({ ...SPF_DEFAULTS, ...(JSON.parse(s.spf) as Partial<SpfOptions>) });
      } catch {
        /* ignore a malformed link */
      }
    },
    { mode: ['check', 'dmarc', 'spf'] },
  );

  const result = useMemo(() => analyse(input), [input]);
  const dmarcText = useMemo(() => buildDmarc(dmarc), [dmarc]);
  const spfText = useMemo(() => buildSpf(spf), [spf]);
  const built = mode === 'dmarc' ? dmarcText : spfText;
  const builtAnalysis = useMemo(() => analyse(built), [built]);
  const builtRec = builtAnalysis.records[0];

  const errors = [...result.records.flatMap((r) => r.issues), ...result.issues].filter((i) => i.level === 'error').length;
  const warnings = [...result.records.flatMap((r) => r.issues), ...result.issues].filter((i) => i.level === 'warning').length;
  const recognised = result.records.filter((r) => r.kind !== 'unknown');
  const status =
    mode !== 'check'
      ? 'Adjust the options; the record updates as you go.'
      : !input.trim()
        ? 'Paste TXT records or a zone snippet to start.'
        : `${recognised.length} record${recognised.length === 1 ? '' : 's'} checked: ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`;

  const hostName = mode === 'dmarc' ? '_dmarc' : '@';
  const zoneLine = `${hostName}  3600  IN  TXT  ${toZoneTxt(built)}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={emailDnsRecords} />
      <Headline accent="email DNS records">Check your </Headline>
      <StatusStrip status={status} tone={mode === 'check' && input.trim() && errors === 0 ? 'good' : 'neutral'} />
      <Notices items={['Everything is checked offline from the text you paste. DNS is never queried, so SPF includes and redirects are not followed and their lookups can\'t be fully counted.']} />

      <Segmented
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'check', label: 'Check records' },
          { value: 'dmarc', label: 'Build DMARC' },
          { value: 'spf', label: 'Build SPF' },
        ]}
      />

      {mode === 'check' ? (
        <div className="space-y-6">
          <section className={card} aria-label="Input">
            <CodeArea
              label="TXT records or zone snippet"
              hint="SPF, DKIM, DMARC, MTA-STS, TLS-RPT, BIMI"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              placeholder={'v=spf1 include:_spf.example.com -all\n_dmarc.example.com. IN TXT "v=DMARC1; p=reject; rua=mailto:r@example.com"'}
              onFileText={(t) => setInput(t)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setInput(EXAMPLE)}>
                Load example
              </Button>
              <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
                Clear
              </Button>
            </div>
          </section>
          <IssueList issues={result.issues} />
          {result.records.map((r, idx) => (
            <RecordCard key={idx} rec={r} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card} aria-label="Options">
            {mode === 'dmarc' ? (
              <>
                <Select label="Policy (p)" options={POLICY_OPTS} value={dmarc.policy} onChange={(policy) => setDmarc({ ...dmarc, policy })} />
                <Select label="Subdomain policy (sp)" options={SP_OPTS} value={dmarc.subdomainPolicy} onChange={(subdomainPolicy) => setDmarc({ ...dmarc, subdomainPolicy })} />
                <TextField label="Percentage (pct)" value={String(dmarc.pct)} onChange={(v) => setDmarc({ ...dmarc, pct: v === '' ? 100 : Number(v.replace(/\D/g, '')) })} hint="Share of failing mail the policy applies to. 100 is the default." />
                <TextField label="Aggregate report addresses (rua)" value={dmarc.rua} onChange={(rua) => setDmarc({ ...dmarc, rua })} placeholder="dmarc@example.com" hint="Separate several with commas." />
                <TextField label="Failure report addresses (ruf)" value={dmarc.ruf} onChange={(ruf) => setDmarc({ ...dmarc, ruf })} placeholder="optional" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="DKIM alignment (adkim)" options={ALIGN_OPTS} value={dmarc.adkim} onChange={(adkim) => setDmarc({ ...dmarc, adkim })} />
                  <Select label="SPF alignment (aspf)" options={ALIGN_OPTS} value={dmarc.aspf} onChange={(aspf) => setDmarc({ ...dmarc, aspf })} />
                </div>
                <Select label="Failure reporting (fo)" options={FO_OPTS} value={dmarc.fo} onChange={(fo) => setDmarc({ ...dmarc, fo })} />
                <TextField label="Report interval in seconds (ri)" value={String(dmarc.ri)} onChange={(v) => setDmarc({ ...dmarc, ri: v === '' ? 86400 : Number(v.replace(/\D/g, '')) })} hint="86400 (one day) is the default." />
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-6">
                  <Checkbox label="Allow this domain's A/AAAA (a)" checked={spf.a} onChange={(a) => setSpf({ ...spf, a })} />
                  <Checkbox label="Allow this domain's mail servers (mx)" checked={spf.mx} onChange={(mx) => setSpf({ ...spf, mx })} />
                </div>
                <TextField label="Include other senders" value={spf.includes} onChange={(includes) => setSpf({ ...spf, includes })} placeholder="_spf.google.com sendgrid.net" hint="Domains of your email providers, separated by spaces. Each costs a DNS lookup." />
                <TextField label="IPv4 addresses or ranges" value={spf.ip4} onChange={(ip4) => setSpf({ ...spf, ip4 })} placeholder="192.0.2.10 198.51.100.0/24" />
                <TextField label="IPv6 addresses or ranges" value={spf.ip6} onChange={(ip6) => setSpf({ ...spf, ip6 })} placeholder="2001:db8::/32" />
                <Select label="Everything else" options={ALL_OPTS} value={spf.all} onChange={(all) => setSpf({ ...spf, all })} />
                <TextField label="Or redirect to another domain" value={spf.redirect} onChange={(redirect) => setSpf({ ...spf, redirect })} placeholder="_spf.example.com" hint="Replaces the final all term." />
              </>
            )}
          </section>

          <section className={card} aria-label="Generated record">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">{mode === 'dmarc' ? 'DMARC record' : 'SPF record'}</h2>
              <div className="flex flex-wrap items-center gap-1">
                <CopyButton text={built} />
                <SendToMenu text={built} kind="text" />
              </div>
            </div>
            <CodeBlock label="Generated record">{built}</CodeBlock>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Publish it as a TXT record at <code className="font-mono">{mode === 'dmarc' ? '_dmarc.yourdomain.com' : 'yourdomain.com (the root)'}</code>
              {mode === 'spf' ? '. Keep only one SPF record per domain.' : '.'}
            </p>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">Zone file line</summary>
              <div className="mt-2 space-y-2">
                <CodeBlock label="Zone file line">{zoneLine}</CodeBlock>
                <CopyButton text={zoneLine} label="Copy zone line" />
              </div>
            </details>
            {builtRec && <IssueList issues={builtRec.issues} />}
          </section>
        </div>
      )}

      <Panel eyebrow="What is checked">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>SPF: syntax, qualifiers, the 10 DNS-lookup limit (counted statically), <code className="font-mono">+all</code> and <code className="font-mono">?all</code>, multiple records, length.</li>
          <li>DKIM: tags, revoked keys and RSA/Ed25519 key size read from <code className="font-mono">p=</code>.</li>
          <li>DMARC: policy, alignment, reporting URIs, percentage and monitoring-only warnings. Plus MTA-STS, TLS-RPT and BIMI.</li>
          <li>Nothing is looked up or uploaded. The text stays in this tab.</li>
        </ul>
      </Panel>
    </div>
  );
}
