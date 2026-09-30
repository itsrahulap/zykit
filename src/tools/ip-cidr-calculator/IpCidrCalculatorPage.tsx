import { useMemo, useState, type ReactNode } from 'react';
import ipCidrCalculator from './index';
import {
  binarySplit,
  cidrInfo,
  compressIPv6,
  contains,
  expandIPv6,
  formatAddress,
  formatCidr,
  ipv4Class,
  parseCidr,
  reverseDns,
  splitByPrefix,
  splitInto,
  summarise,
  type Version,
} from './features/ip-cidr-calculator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Notices } from '../../shared/ui/convert';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';

type SplitMode = 'prefix' | 'count';
const SHOWN_SUBNETS = 256;

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

function Field({ id, label, value, onChange, invalid, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid?: boolean; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
    </div>
  );
}

const Mono = ({ children }: { children: ReactNode }) => <code className="break-all font-mono text-sm">{children}</code>;

const fmtCount = (n: bigint) => {
  const s = n.toLocaleString('en-US');
  return n >= 1n << 20n ? `${s} (2^${n.toString(2).length - 1}${n & (n - 1n) ? '+' : ''})` : s;
};

function BinaryLine({ label, value, version, prefix }: { label: string; value: bigint; version: Version; prefix: number }) {
  const [net, host] = binarySplit(value, version, prefix);
  return (
    <div className="min-w-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-950">
        <span className="text-emerald-700 dark:text-emerald-400">{net}</span>
        <span className="text-slate-500 dark:text-slate-400">{host}</span>
      </code>
    </div>
  );
}

export default function IpCidrCalculatorPage() {
  const [input, setInput] = useState('192.168.1.10/24');
  const [test, setTest] = useState('192.168.1.200');
  const [splitMode, setSplitMode] = useState<SplitMode>('prefix');
  const [splitValue, setSplitValue] = useState('26');
  const [list, setList] = useState('10.0.0.0/24\n10.0.1.0/24\n10.0.2.0/23\n192.168.1.7');

  useShareState(
    { cidr: input, test, splitMode, splitValue, list },
    (s) => {
      if (s.cidr !== undefined) setInput(s.cidr);
      if (s.test !== undefined) setTest(s.test);
      if (s.splitMode) setSplitMode(s.splitMode);
      if (s.splitValue !== undefined) setSplitValue(s.splitValue);
      if (s.list !== undefined) setList(s.list);
    },
    { splitMode: ['prefix', 'count'] },
  );

  const parsed = useMemo(() => parseCidr(input), [input]);
  const info = parsed.ok ? cidrInfo(parsed.value) : null;
  const addr = (v: bigint) => formatAddress({ version: info!.version, value: v });
  useToolShortcuts({ getOutput: () => (info ? formatCidr(info.version, info.network, info.prefix) : '') });

  const status = !input.trim()
    ? 'Enter an IPv4 or IPv6 address, CIDR or address + netmask.'
    : !parsed.ok
      ? parsed.error
      : `IPv${info!.version} · ${formatCidr(info!.version, info!.network, info!.prefix)} · ${info!.classification.name}`;

  const testParsed = test.trim() ? parseCidr(test) : null;
  const inRange = info && parsed.ok && testParsed?.ok ? contains(parsed.value, testParsed.value) : null;

  const split = useMemo(() => {
    if (!parsed.ok || !splitValue.trim()) return null;
    const n = Number(splitValue.trim().replace(/^\//, ''));
    return splitMode === 'prefix' ? splitByPrefix(parsed.value, n) : splitInto(parsed.value, n);
  }, [parsed, splitMode, splitValue]);

  const summary = useMemo(() => summarise(list), [list]);
  const summaryText = summary.cidrs.join('\n');

  return (
    <div className="space-y-8">
      <Breadcrumb tool={ipCidrCalculator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="subnet">Work out any </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput('2001:db8:abcd:12::1/64')}>
            Try IPv6
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={parsed.ok ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-label="Address input" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <Field id="cidr-input" label="IP / CIDR" value={input} onChange={setInput} invalid={!!input.trim() && !parsed.ok} placeholder="10.0.0.0/8 or 192.168.1.1 255.255.255.0" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Examples: <code>10.0.0.0/8</code>, <code>192.168.1.1 255.255.255.0</code>, <code>2001:db8::/32</code>, <code>fe80::1</code>.
          </p>
          {info && (
            <>
              <Notices
                items={info.hostBitsSet ? [`${addr(info.address)} has host bits set; the network is ${formatCidr(info.version, info.network, info.prefix)}.`] : []}
              />
              <div className="space-y-3">
                <BinaryLine label="Address (network bits in green)" value={info.address} version={info.version} prefix={info.prefix} />
                <BinaryLine label="Netmask" value={info.netmask} version={info.version} prefix={info.prefix} />
              </div>
            </>
          )}
        </section>

        <section aria-label="Network details" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {info ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={info.classification.global ? 'green' : 'amber'}>{info.classification.global ? 'Public' : 'Special-purpose'}</Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {info.classification.name}
                    {info.classification.rfc && ` (${info.classification.rfc}${info.classification.range ? `, ${info.classification.range}` : ''})`}
                  </span>
                </div>
                <CopyButton text={formatCidr(info.version, info.network, info.prefix)} label="Copy CIDR" />
              </div>
              <DetailRows
                rows={[
                  ['Network', <Mono key="n">{formatCidr(info.version, info.network, info.prefix)}</Mono>],
                  ...(info.version === 4
                    ? ([
                        ['Broadcast', <Mono key="b">{addr(info.broadcast)}</Mono>],
                        ['Netmask', <Mono key="m">{addr(info.netmask)}</Mono>],
                        ['Wildcard', <Mono key="w">{addr(info.wildcard)}</Mono>],
                      ] as [string, ReactNode][])
                    : ([['Last address', <Mono key="b">{addr(info.broadcast)}</Mono>]] as [string, ReactNode][])),
                  ['First host', <Mono key="f">{addr(info.firstHost)}</Mono>],
                  ['Last host', <Mono key="l">{addr(info.lastHost)}</Mono>],
                  ['Usable hosts', <span key="u" data-testid="usable-hosts">{fmtCount(info.usable)}</span>],
                  ['Total addresses', fmtCount(info.total)],
                  ['Prefix', `/${info.prefix}`],
                  ...(info.version === 4
                    ? ([['Class', ipv4Class(info.address)]] as [string, ReactNode][])
                    : ([
                        ['Compressed', <Mono key="c">{compressIPv6(info.address)}</Mono>],
                        ['Expanded', <Mono key="e">{expandIPv6(info.address)}</Mono>],
                      ] as [string, ReactNode][])),
                  ['Integer', <Mono key="i">{info.address.toString()}</Mono>],
                  ['Hex', <Mono key="h">0x{info.address.toString(16)}</Mono>],
                  ['Reverse DNS', <Mono key="r">{reverseDns({ version: info.version, value: info.address })}</Mono>],
                ]}
              />
              {info.version === 4 && info.prefix >= 31 && (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  /{info.prefix}: every address is usable ({info.prefix === 31 ? 'point-to-point link, RFC 3021' : 'single host'}).
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter a valid address to see the network details.</p>
          )}
        </section>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel eyebrow="Is this IP in the range?" icon="search">
          <Field id="test-ip" label="IP or CIDR to check" value={test} onChange={setTest} invalid={!!testParsed && !testParsed.ok} />
          <div className="mt-4" aria-live="polite">
            {testParsed && !testParsed.ok && <p className="text-sm text-red-700 dark:text-red-400">{testParsed.error}</p>}
            {info && inRange !== null && testParsed?.ok && (
              <p className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300" data-testid="in-range">
                <Badge tone={inRange ? 'green' : 'red'}>{inRange ? 'Yes' : 'No'}</Badge>
                {test.trim()} is {inRange ? '' : 'not '}inside {formatCidr(info.version, info.network, info.prefix)}.
              </p>
            )}
          </div>
        </Panel>

        <Panel eyebrow="Split into subnets" icon="grid">
          <div className="flex flex-wrap items-end gap-4">
            <Segmented<SplitMode>
              label="Split by"
              options={[
                { value: 'prefix', label: 'New prefix' },
                { value: 'count', label: 'Number of subnets' },
              ]}
              value={splitMode}
              onChange={setSplitMode}
            />
            <div className="w-32">
              <Field id="split-value" label={splitMode === 'prefix' ? 'Prefix' : 'Subnets'} value={splitValue} onChange={setSplitValue} invalid={!!split && !split.ok} />
            </div>
          </div>
          <div className="mt-4">
            {split && !split.ok && <p className="text-sm text-red-700 dark:text-red-400">{split.error}</p>}
            {split?.ok && info && (
              <>
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                  {split.value.count.toLocaleString('en-US')} × /{split.value.prefix}
                  {split.value.count > BigInt(SHOWN_SUBNETS) && ` (showing the first ${SHOWN_SUBNETS})`}
                </p>
                <ol className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800" data-testid="subnets">
                  {split.value.subnets.slice(0, SHOWN_SUBNETS).map((net) => {
                    const sub = cidrInfo({ version: info.version, address: net, prefix: split.value.prefix });
                    return (
                      <li key={net.toString()} className="flex flex-wrap justify-between gap-x-4 px-3 py-1.5 font-mono text-sm">
                        <span className="text-slate-900 dark:text-slate-100">{formatCidr(info.version, net, split.value.prefix)}</span>
                        <span className="min-w-0 break-all text-slate-500 dark:text-slate-400">
                          {addr(sub.firstHost)} – {addr(sub.lastHost)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Summarise a list of CIDRs" icon="layers">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <CodeArea label="CIDRs or IPs (one per line)" value={list} onChange={(e) => setList(e.target.value)} rows={8} onFileText={(t) => setList(t)} />
          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="eyebrow text-slate-600 dark:text-slate-400">
                Summary ({summary.cidrs.length} {summary.cidrs.length === 1 ? 'block' : 'blocks'})
              </h3>
              <CopyButton text={summaryText} />
            </div>
            <pre className="max-h-80 overflow-auto rounded-2xl bg-slate-100 p-4 font-mono text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300" data-testid="summary">
              {summaryText || '—'}
            </pre>
            <Notices items={summary.errors.slice(0, 10)} />
          </div>
        </div>
      </Panel>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        All calculations run in your browser with 128-bit integers, so IPv6 host counts are exact. Nothing is looked up or sent anywhere.
      </p>
    </div>
  );
}
