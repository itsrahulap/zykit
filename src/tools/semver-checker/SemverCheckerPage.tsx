import { useMemo, useState } from 'react';
import semverChecker from './index';
import { bump, BUMPS, check, explainRange, formatVersion, maxSatisfying, minSatisfying, parseRange, parseVersion, sortVersions } from './features/semver-checker';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Checkbox } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Button, Icon } from '../../shared/ui/ui';

const SAMPLE_RANGE = '^1.2.0 || >=3.0.0-beta.1 <3.1';
const SAMPLE_VERSIONS = ['1.1.9', '1.2.0', '1.4.7', '1.5.0-rc.1', '2.0.0', '3.0.0-beta.2', '3.0.1', 'v1.10.0', '1.2'].join('\n');

const inputClass =
  'block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 pointer-coarse:min-h-11 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

function TextField({ label, value, onChange, placeholder, id }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; id?: string }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={inputClass}
      />
    </label>
  );
}

export default function SemverCheckerPage() {
  const [range, setRange] = useState('');
  const [versionsText, setVersionsText] = useState('');
  const [includePrerelease, setIncludePrerelease] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [bumpFrom, setBumpFrom] = useState('');
  const [preid, setPreid] = useState('');

  const opts = useMemo(() => ({ includePrerelease }), [includePrerelease]);
  const versions = useMemo(() => versionsText.split(/[\s,]+/).filter(Boolean), [versionsText]);

  const parsedRange = useMemo(() => {
    if (!range.trim()) return null;
    try {
      parseRange(range, opts);
      return { ok: true as const, bounds: explainRange(range, opts) };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : 'Invalid range' };
    }
  }, [range, opts]);

  const rows = useMemo(
    () => (parsedRange?.ok ? versions.map((v) => ({ version: v, ...check(v, range, opts) })) : versions.map((v) => ({ version: v, ok: false, reason: '' }))),
    [versions, range, opts, parsedRange],
  );
  const invalid = versions.filter((v) => !parseVersion(v));
  const sorted = useMemo(() => sortVersions(versions, order === 'desc'), [versions, order]);
  const best = parsedRange?.ok ? maxSatisfying(versions, range, opts) : null;
  const lowest = parsedRange?.ok ? minSatisfying(versions, range, opts) : null;
  const matching = rows.filter((r) => r.ok).length;

  const bumpBase = bumpFrom.trim() || sorted[0] || '';
  const bumpBaseValid = parseVersion(bumpBase);
  const bumps = BUMPS.map((k) => [k, bump(bumpBase, k, preid)] as const);

  const summary = parsedRange?.ok ? rows.map((r) => `${r.ok ? '✓' : '✗'} ${r.version} — ${r.reason}`).join('\n') : sorted.join('\n');

  useIncomingText(semverChecker.id, (t) => setVersionsText(t));
  useToolShortcuts({ getOutput: () => summary });
  useShareState(
    { range, versions: versionsText, includePrerelease },
    (s) => {
      if (s.range !== undefined) setRange(s.range);
      if (s.versions !== undefined) setVersionsText(s.versions);
      if (s.includePrerelease !== undefined) setIncludePrerelease(s.includePrerelease);
    },
  );

  const status = parsedRange && !parsedRange.ok
    ? `Invalid range: ${parsedRange.error}`
    : !versions.length
      ? parsedRange?.ok
        ? `${range.trim()} means ${parsedRange.bounds}`
        : 'Enter an npm-style range like ^1.2.0 and some versions to check.'
      : parsedRange?.ok
        ? `${matching} of ${versions.length} version${versions.length === 1 ? '' : 's'} satisfy ${range.trim()}`
        : `${versions.length - invalid.length} valid version${versions.length - invalid.length === 1 ? '' : 's'}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={semverChecker} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="range">Check versions against a </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setRange(SAMPLE_RANGE);
              setVersionsText(SAMPLE_VERSIONS);
            }}
          >
            Try an example
          </Button>
          <Button
            variant="ghost"
            disabled={!range && !versionsText}
            onClick={() => {
              setRange('');
              setVersionsText('');
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={parsedRange?.ok && matching > 0 ? 'good' : 'neutral'} />

      <section aria-label="Range" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <TextField id="semver-range" label="Range" value={range} onChange={setRange} placeholder="^1.2.0 || >=2.1 <3" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Checkbox label="Include prereleases" checked={includePrerelease} onChange={setIncludePrerelease} />
          <p className="min-w-0 text-sm text-slate-500 dark:text-slate-400">
            Supports <code>^</code> <code>~</code> <code>1.x</code> <code>*</code> <code>1.2.3 - 2.3</code> <code>&gt;=</code> <code>&lt;</code> and{' '}
            <code>||</code>, like npm.
          </p>
        </div>
        {parsedRange?.ok && (
          <div>
            <p className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Means</p>
            <ul aria-label="Range bounds" className="space-y-1">
              {parsedRange.bounds.split(' || ').map((b, i) => (
                <li key={i} className="break-all rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {i > 0 && <span className="text-slate-500">or </span>}
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
        {parsedRange && !parsedRange.ok && (
          <p role="alert" className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
            <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{parsedRange.error}</span>
          </p>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          label="Versions"
          hint="one per line"
          value={versionsText}
          onChange={(e) => setVersionsText(e.target.value)}
          rows={12}
          placeholder={'1.2.3\n2.0.0-beta.1'}
          onFileText={(t) => setVersionsText(t)}
        />

        <div className="min-w-0 space-y-6">
          {versions.length > 0 && parsedRange?.ok && (
            <section aria-label="Check results" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
                <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="check" className="h-4 w-4" /> Results
                </h2>
                <CopyButton text={summary} />
              </header>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3 sm:px-6">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${r.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}`}
                    >
                      <Icon name={r.ok ? 'check' : 'x'} className="h-3.5 w-3.5" />
                      <span className="sr-only">{r.ok ? 'Satisfies' : 'Does not satisfy'}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{r.version}</p>
                      <p className="break-words text-sm text-slate-600 dark:text-slate-400">{r.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {versions.length > 0 && (
            <Panel eyebrow="Summary" icon="layers">
              <DetailRows
                rows={[
                  ...(parsedRange?.ok
                    ? ([
                        ['Highest match', best ?? 'none'],
                        ['Lowest match', lowest ?? 'none'],
                      ] as [string, string][])
                    : []),
                  ['Valid versions', String(versions.length - invalid.length)],
                  ...(invalid.length ? ([['Not valid SemVer', invalid.join(', ')]] as [string, string][]) : []),
                ]}
              />
            </Panel>
          )}

          {sorted.length > 1 && (
            <section aria-label="Sorted versions" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="eyebrow text-slate-600 dark:text-slate-400">Sorted by precedence</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented<'asc' | 'desc'>
                    label="Order"
                    options={[
                      { value: 'desc', label: 'Newest first' },
                      { value: 'asc', label: 'Oldest first' },
                    ]}
                    value={order}
                    onChange={setOrder}
                  />
                  <CopyButton text={sorted.join('\n')} />
                </div>
              </div>
              <CodeBlock className="max-h-72 overflow-y-auto">{sorted.join('\n')}</CodeBlock>
            </section>
          )}
        </div>
      </div>

      <section aria-label="Bump preview" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="eyebrow text-slate-600 dark:text-slate-400">Bump preview</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <TextField label="Version" value={bumpFrom} onChange={setBumpFrom} placeholder={sorted[0] ?? '1.2.3'} />
          <TextField label="Prerelease id" value={preid} onChange={setPreid} placeholder="beta" />
        </div>
        {bumpBase && !bumpBaseValid ? (
          <p className="text-sm text-red-700 dark:text-red-400">“{bumpBase}” isn’t a valid version.</p>
        ) : bumpBaseValid ? (
          <ul aria-label="Bumped versions" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {bumps.map(([kind, next]) => (
              <li key={kind} className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-950">
                <p className="eyebrow text-slate-500 dark:text-slate-400">{kind}</p>
                <p className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{next ?? 'invalid prerelease id'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter a version to see what npm version major/minor/patch/pre* would produce.</p>
        )}
        {bumpBaseValid && bumpBaseValid.build.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Build metadata (+{bumpBaseValid.build.join('.')}) is dropped when bumping {formatVersion(bumpBaseValid)}.</p>
        )}
      </section>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Follows SemVer 2.0.0 precedence and node-semver’s range rules: prereleases only match ranges that mention a prerelease on the same
        major.minor.patch unless “Include prereleases” is on. Runs entirely in your browser.
      </p>
    </div>
  );
}
