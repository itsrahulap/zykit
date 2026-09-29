import { useEffect, useMemo, useState } from 'react';
import utmBuilder from './index';
import {
  addToHistory,
  buildBulk,
  buildUtmUrl,
  HISTORY_KEY,
  parseHistory,
  PRESETS,
  UTM_FIELDS,
  type HistoryItem,
  type SpaceMode,
  type UtmValues,
} from './features/utm';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Mode = 'single' | 'bulk';

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
  required,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  required?: boolean;
  id?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span>
          {label}
          {required && <span className="text-emerald-700 dark:text-emerald-400"> *</span>}
        </span>
        {help && <span className="truncate text-xs font-normal text-slate-500 dark:text-slate-400">{help}</span>}
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        className={inputClass}
      />
    </label>
  );
}

function loadHistory(): HistoryItem[] {
  try {
    return parseHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

function saveHistory(list: HistoryItem[]) {
  try {
    if (list.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    else localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Storage may be unavailable (private mode); history is a convenience only.
  }
}

export default function UtmBuilderPage() {
  const [mode, setMode] = useState<Mode>('single');
  const [base, setBase] = useState('');
  const [bulk, setBulk] = useState('');
  const [siteHost, setSiteHost] = useState('');
  const [values, setValues] = useState<UtmValues>({});
  const [lowercase, setLowercase] = useState(true);
  const [spaces, setSpaces] = useState<SpaceMode>('dash');
  const [showMore, setShowMore] = useState(false);
  const [presetNote, setPresetNote] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  useEffect(() => saveHistory(history), [history]);

  const single = useMemo(() => buildUtmUrl(base, values, { lowercase, spaces, siteHost }), [base, values, lowercase, spaces, siteHost]);
  const bulkRows = useMemo(() => (mode === 'bulk' ? buildBulk(bulk, values, { lowercase, spaces, siteHost }) : []), [mode, bulk, values, lowercase, spaces, siteHost]);
  const bulkOutput = bulkRows.filter((r) => r.result.ok).map((r) => r.result.url).join('\n');

  const setValue = (k: keyof UtmValues, v: string) => setValues((prev) => ({ ...prev, [k]: v }));
  const remember = (url: string) => url && setHistory((h) => addToHistory(h, url));

  const fields = showMore ? UTM_FIELDS : UTM_FIELDS.slice(0, 5);
  const hasInput = mode === 'single' ? !!base.trim() : !!bulk.trim();
  const status =
    mode === 'single'
      ? !base.trim()
        ? 'Enter a URL and campaign details to build a tracked link.'
        : single.ok
          ? single.warnings.length
            ? `Link built · ${pluralize(single.warnings.length, 'warning')}`
            : 'Link built · all required fields set'
          : (single.error ?? '')
      : !bulk.trim()
        ? 'Paste one base URL per line to tag them all with the same campaign.'
        : `${pluralize(bulkRows.filter((r) => r.result.ok).length, 'link')} built${bulkRows.some((r) => !r.result.ok) ? ` · ${bulkRows.filter((r) => !r.result.ok).length} invalid` : ''}`;

  const warnings = mode === 'single' ? single.warnings : [...new Set(bulkRows.flatMap((r) => r.result.warnings))];
  const tagged = mode === 'single' ? (single.ok ? single.url : '') : bulkOutput;
  useToolShortcuts({ getOutput: () => tagged });

  return (
    <div className="space-y-8">
      <Breadcrumb tool={utmBuilder} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="consistently">Tag campaign links </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setMode('single');
              setBase('https://example.com/pricing?plan=pro#faq');
              setValues({ utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'Spring Sale 2026', utm_content: 'hero button' });
            }}
          >
            Try an example
          </Button>
          <Button
            variant="ghost"
            disabled={!hasInput && !Object.values(values).some(Boolean)}
            onClick={() => {
              setBase('');
              setBulk('');
              setValues({});
              setPresetNote('');
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={mode === 'single' ? (single.ok ? 'good' : 'neutral') : bulkOutput ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section aria-label="Destination" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <Segmented<Mode>
              label="Mode"
              options={[
                { value: 'single', label: 'Single URL' },
                { value: 'bulk', label: 'Bulk' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {mode === 'single' ? (
              <Field label="Website URL" required value={base} onChange={setBase} placeholder="https://example.com/landing" />
            ) : (
              <CodeArea label="Base URLs" hint="one per line" value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} placeholder={'https://example.com/a\nhttps://example.com/b'} onFileText={(t) => setBulk(t)} />
            )}
            <Field
              label="Your site's domain"
              help="optional · flags internal links"
              value={siteHost}
              onChange={setSiteHost}
              placeholder="example.com"
            />
          </section>

          <section aria-label="Campaign parameters" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="link" className="h-4 w-4" /> Campaign
              </h2>
              <Select<string>
                label="Preset"
                placeholder="Choose a preset…"
                options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
                onChange={(id) => {
                  const p = PRESETS.find((x) => x.id === id);
                  if (!p) return;
                  setValues((prev) => ({ ...prev, ...p.values }));
                  setPresetNote(p.note ?? '');
                }}
              />
            </div>
            {presetNote && <p className="text-sm text-slate-600 dark:text-slate-400">{presetNote}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <Field
                  key={f.key}
                  label={`${f.label} (${f.key})`}
                  required={f.required}
                  value={values[f.key] ?? ''}
                  onChange={(v) => setValue(f.key, v)}
                  placeholder={f.placeholder}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              aria-expanded={showMore}
              className="text-sm font-semibold text-emerald-700 underline-offset-4 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400"
            >
              {showMore ? 'Hide GA4 extra fields' : 'Show more fields (utm_id, source platform, creative format, tactic)'}
            </button>
          </section>

          <section aria-label="Formatting options" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <Checkbox label="Lowercase values" checked={lowercase} onChange={setLowercase} />
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Spaces</span>
              <Segmented<SpaceMode>
                label="Spaces"
                options={[
                  { value: 'dash', label: '-' },
                  { value: 'underscore', label: '_' },
                  { value: 'encode', label: '%20' },
                ]}
                value={spaces}
                onChange={setSpaces}
              />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-label="Tagged URL" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="link" className="h-4 w-4" /> {mode === 'single' ? 'Tagged URL' : 'Tagged URLs'}
              </h2>
              <div className="flex flex-wrap items-center gap-1">
                <span onClick={() => (mode === 'single' ? single.ok && remember(single.url) : bulkRows.forEach((r) => r.result.ok && remember(r.result.url)))}>
                  <CopyButton text={tagged} label={mode === 'single' ? 'Copy' : 'Copy all'} />
                </span>
                <SendToMenu text={tagged} />
              </div>
            </header>
            <div className="p-4">
              {mode === 'single' ? (
                single.ok ? (
                  <CodeBlock>{single.url}</CodeBlock>
                ) : (
                  <p className="p-2 text-sm text-slate-500 dark:text-slate-400">{base.trim() ? single.error : 'Your link appears here.'}</p>
                )
              ) : bulkRows.length ? (
                <ul className="space-y-2">
                  {bulkRows.map((r) => (
                    <li key={r.line} className="min-w-0">
                      {r.result.ok ? (
                        <CodeBlock className="py-2!">{r.result.url}</CodeBlock>
                      ) : (
                        <p className="break-all rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                          Line {r.line}: {r.result.error} ({r.base})
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-2 text-sm text-slate-500 dark:text-slate-400">Your links appear here.</p>
              )}
            </div>
          </section>

          {hasInput && <Notices items={warnings} />}

          <section aria-label="History" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="clock" className="h-4 w-4" /> History
              </h2>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  disabled={mode !== 'single' || !single.ok}
                  onClick={() => remember(single.url)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon name="bookmark" className="h-4 w-4" /> Save
                </button>
                <button
                  type="button"
                  disabled={!history.length}
                  onClick={() => setHistory([])}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon name="x" className="h-4 w-4" /> Clear history
                </button>
              </div>
            </header>
            <div className="p-4">
              {history.length ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((h) => (
                    <li key={h.url} className="flex min-w-0 items-center justify-between gap-2 py-2">
                      <span className="min-w-0 break-all font-mono text-xs text-slate-700 dark:text-slate-300">{h.url}</span>
                      <CopyButton text={h.url} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-2 text-sm text-slate-500 dark:text-slate-400">Links you copy or save are kept here, in this browser only.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Existing query parameters and the #fragment are kept. Values are URL-encoded; history stays in this browser&rsquo;s local storage and is
        never uploaded.
      </p>
    </div>
  );
}
