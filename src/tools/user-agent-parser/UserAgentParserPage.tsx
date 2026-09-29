import { useEffect, useMemo, useState } from 'react';
import userAgentParser from './index';
import { BOT_CATEGORY_LABELS, parseUserAgent, SAMPLES, type DeviceType } from './features/ua';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CopyButton } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Badge, Button, Icon } from '../../shared/ui/ui';

interface UaDataBrand {
  brand: string;
  version: string;
}
interface UaData {
  brands: UaDataBrand[];
  mobile: boolean;
  platform: string;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
}

const DEVICE_LABELS: Record<DeviceType, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  tv: 'TV',
  console: 'Game console',
  bot: 'Bot / automated client',
  unknown: 'Unknown',
};

const HIGH_ENTROPY = ['platformVersion', 'architecture', 'bitness', 'model', 'fullVersionList', 'wow64', 'formFactors'];

function currentUa(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

function withVersion(name: string, version?: string) {
  return version ? `${name} ${version}` : name;
}

function ClientHints() {
  const data = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { userAgentData?: UaData }).userAgentData;
  const [high, setHigh] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    let alive = true;
    data
      ?.getHighEntropyValues?.(HIGH_ENTROPY)
      .then((v) => alive && setHigh(v))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [data]);

  const touch = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints;
  if (!data) {
    return (
      <Panel eyebrow="Client Hints (this browser)" icon="info">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This browser doesn&rsquo;t expose <code>navigator.userAgentData</code>. Firefox and Safari don&rsquo;t support User-Agent Client Hints, so
          the user agent string is all there is.
          {/Macintosh/.test(currentUa()) && touch > 1 && ' This device has a touch screen, so it is most likely an iPad requesting the desktop site.'}
        </p>
      </Panel>
    );
  }
  const brands = data.brands.filter((b) => !/not.?a.?brand/i.test(b.brand));
  const fullList = Array.isArray(high?.fullVersionList) ? (high.fullVersionList as UaDataBrand[]).filter((b) => !/not.?a.?brand/i.test(b.brand)) : null;
  const platformVersion = typeof high?.platformVersion === 'string' ? high.platformVersion : '';
  const win11 = data.platform === 'Windows' && platformVersion ? Number(platformVersion.split('.')[0]) >= 13 : null;
  const rows: [string, string][] = [
    ['Brands', (fullList ?? brands).map((b) => `${b.brand} ${b.version}`).join(', ') || '—'],
    ['Platform', data.platform || '—'],
    ['Mobile', data.mobile ? 'Yes' : 'No'],
  ];
  if (platformVersion) rows.push(['Platform version', win11 === null ? platformVersion : `${platformVersion} (Windows ${win11 ? '11' : '10'})`]);
  if (typeof high?.architecture === 'string' && high.architecture) rows.push(['Architecture', `${high.architecture}${high.bitness ? ` · ${String(high.bitness)}-bit` : ''}`]);
  if (typeof high?.model === 'string' && high.model) rows.push(['Model', high.model]);
  if (Array.isArray(high?.formFactors) && high.formFactors.length) rows.push(['Form factors', (high.formFactors as string[]).join(', ')]);
  return (
    <Panel eyebrow="Client Hints (this browser)" icon="info">
      <DetailRows rows={rows} />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Read from navigator.userAgentData. Brave shows up here as &ldquo;Brave&rdquo; even though its user agent says Chrome.</p>
    </Panel>
  );
}

export default function UserAgentParserPage() {
  const [input, setInput] = useState(currentUa);
  const r = useMemo(() => parseUserAgent(input), [input]);
  const isMine = input.trim() === currentUa();

  const summary = !input.trim()
    ? 'Paste a User-Agent string to parse it.'
    : r.bot
      ? `${r.bot.name} · ${BOT_CATEGORY_LABELS[r.bot.category]}`
      : `${withVersion(r.browser.name, r.browser.major)} on ${withVersion(r.os.name, r.os.version)} · ${DEVICE_LABELS[r.device.type]}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={userAgentParser} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="user agent">Read any </Headline>
        <div className="flex flex-wrap items-center gap-3">
          <Select<string> label="Samples" placeholder="Try a sample…" options={SAMPLES.map((s) => ({ value: s.ua, label: s.label }))} onChange={setInput} />
          <Button variant="secondary" disabled={isMine} onClick={() => setInput(currentUa())}>
            Use my browser
          </Button>
        </div>
      </div>

      <StatusStrip status={summary} tone={input.trim() ? 'good' : 'neutral'} />

      <div className="space-y-1">
        <CodeArea label="User-Agent" hint={isMine ? 'your browser' : undefined} value={input} onChange={(e) => setInput(e.target.value)} rows={3} placeholder="Mozilla/5.0 (…)" onFileText={(t) => setInput(t.trim())} />
        <div className="flex justify-end">
          <CopyButton text={input} />
        </div>
      </div>

      {input.trim() && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-6">
            {r.bot && (
              <section aria-label="Bot" className="flex items-start gap-3 rounded-3xl bg-amber-50 p-6 text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
                <Icon name="server" className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{withVersion(r.bot.name, r.bot.version)}</p>
                  <p className="text-sm">
                    {BOT_CATEGORY_LABELS[r.bot.category]}
                    {r.bot.owner ? ` · ${r.bot.owner}` : ''}
                  </p>
                </div>
              </section>
            )}
            <div role="region" aria-label="Parsed">
              <Panel eyebrow="Parsed" icon="search">
                <DetailRows
                  rows={[
                    [
                      'Browser',
                      <span key="b" className="inline-flex flex-wrap items-center justify-end gap-2">
                        {withVersion(r.browser.name, r.browser.version)}
                        {r.browser.kind !== 'browser' && r.browser.kind !== 'unknown' && <Badge tone="violet">{r.browser.kind}</Badge>}
                      </span>,
                    ],
                    ['Engine', withVersion(r.engine.name, r.engine.version)],
                    ['Operating system', withVersion(r.os.name, r.os.version)],
                    ['Device type', DEVICE_LABELS[r.device.type]],
                    ...(r.device.vendor || r.device.model ? ([['Device', [r.device.vendor, r.device.model].filter(Boolean).join(' ')]] as [string, string][]) : []),
                  ]}
                />
              </Panel>
            </div>
          </div>
          <div className="min-w-0 space-y-6">
            {r.notes.length > 0 && (
              <Panel eyebrow="Notes" icon="lightbulb">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {r.notes.map((n) => (
                    <li key={n} className="flex gap-2">
                      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> <span className="min-w-0">{n}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            <ClientHints />
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Parsed in your browser with a built-in rule table; nothing is sent anywhere. User agents are self-reported and easy to fake, so treat the result as
        a hint, not proof.
      </p>
    </div>
  );
}
