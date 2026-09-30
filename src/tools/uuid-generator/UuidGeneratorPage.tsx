import { useMemo, useState } from 'react';
import uuidGenerator from './index';
import { clampCount, formatUuid, generate, inspectUuid, MAX_COUNT, type UuidVersion } from './features/uuid';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Checkbox } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';
import { downloadText } from '../../shared/utils/dom.utils';

const INPUT =
  'rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900 dark:text-slate-100';

export default function UuidGeneratorPage() {
  const [version, setVersion] = useState<UuidVersion>(4);
  const [countText, setCountText] = useState('10');
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [uuids, setUuids] = useState<string[]>(() => generate(4, 10));
  const [inspectText, setInspectText] = useState('');

  const count = clampCount(Number(countText));
  const regenerate = (v: UuidVersion = version) => setUuids(generate(v, count));

  const output = useMemo(() => uuids.map((u) => formatUuid(u, { uppercase, hyphens, braces })).join('\n'), [uuids, uppercase, hyphens, braces]);
  const download = () => downloadText(output + '\n', `uuids-v${version}.txt`, 'text/plain');
  useToolShortcuts({ onRun: () => regenerate(), getOutput: () => output, onDownload: download });
  const info = useMemo(() => (inspectText.trim() ? inspectUuid(inspectText) : null), [inspectText]);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={uuidGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="unique">Make every ID </Headline>
        <Button onClick={() => regenerate()}>
          <Icon name="dice" className="h-4 w-4" /> Generate
        </Button>
      </div>

      <StatusStrip status={`${pluralize(uuids.length, 'UUID')} · version ${version}`} tone="good" />

      <section
        aria-label="Generator options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<string>
          label="Version"
          options={[
            { value: '4', label: 'v4 · random' },
            { value: '7', label: 'v7 · time-ordered' },
          ]}
          value={String(version)}
          onChange={(v) => {
            const next = Number(v) as UuidVersion;
            setVersion(next);
            regenerate(next);
          }}
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          How many
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_COUNT}
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && regenerate()}
            className={`${INPUT} w-24`}
          />
        </label>
        <Checkbox label="Uppercase" checked={uppercase} onChange={setUppercase} />
        <Checkbox label="Hyphens" checked={hyphens} onChange={setHyphens} />
        <Checkbox label="Braces" checked={braces} onChange={setBraces} />
        {countText !== '' && Number(countText) !== count && (
          <p className="w-full text-sm text-amber-700 dark:text-amber-300">
            Count must be between 1 and {MAX_COUNT}; using {count}.
          </p>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <section
          aria-label="Generated UUIDs"
          className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="hash" className="h-4 w-4" /> UUIDs
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <CopyButton text={output} label="Copy all" />
              <SendToMenu text={output} kind="text" />
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon name="download" className="h-4 w-4" /> Download .txt
              </button>
            </div>
          </header>
          <div className="p-4">
            <CodeBlock className="max-h-[32rem] overflow-y-auto">{output}</CodeBlock>
          </div>
        </section>

        <Panel eyebrow="Inspect a UUID" icon="search" className="min-w-0">
          <label className="block">
            <span className="sr-only">UUID to inspect</span>
            <input
              type="text"
              value={inspectText}
              onChange={(e) => setInspectText(e.target.value)}
              placeholder="Paste a UUID"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="UUID to inspect"
              aria-invalid={info ? !info.ok : undefined}
              className={`${INPUT} w-full font-mono text-sm`}
            />
          </label>
          <div className="mt-4" aria-live="polite">
            {!info && (
              <p className="text-sm text-slate-500 dark:text-slate-400">See the version, variant and, for v1, v6 and v7, when it was created.</p>
            )}
            {info && !info.ok && <p className="text-sm font-medium text-red-700 dark:text-red-300">{info.error}</p>}
            {info?.ok && (
              <>
                <p className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="green">
                    <Icon name="check" className="h-3 w-3" /> Valid
                  </Badge>
                  <Badge>{info.kind}</Badge>
                </p>
                <DetailRows
                  rows={[
                    [
                      'Canonical',
                      <span key="Canonical" className="break-all font-mono text-sm">
                        {info.canonical}
                      </span>,
                    ],
                    ['Version', String(info.version)],
                    ['Variant', info.variant],
                    ...(info.timestampMs !== undefined
                      ? ([
                          [
                            'Created (UTC)',
                            Number.isFinite(new Date(info.timestampMs).getTime()) ? new Date(info.timestampMs).toISOString() : 'Out of range',
                          ],
                          ['Created (local)', new Date(info.timestampMs).toLocaleString()],
                          ['Unix ms', String(info.timestampMs)],
                        ] as [string, string][])
                      : []),
                  ]}
                />
              </>
            )}
          </div>
        </Panel>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        UUIDs are generated in your browser with the Web Crypto random generator. v7 UUIDs start with the current time in milliseconds, so they sort
        in creation order; several made in the same millisecond still increase.
      </p>
    </div>
  );
}
