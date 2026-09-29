import { useMemo, useState } from 'react';
import robotsTxtGenerator from './index';
import { generate, parse, PRESETS, testUrl, type Group, type RobotsDoc, type RuleType } from './features/robots';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';
import { pluralize } from '../../shared/utils/format.utils';

type Source = 'generated' | 'pasted';

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const smallButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

const TEST_AGENTS = ['Googlebot', 'Bingbot', 'GPTBot', 'ClaudeBot', 'Google-Extended', '*'];

function GroupEditor({ group, index, onChange, onRemove }: { group: Group; index: number; onChange: (g: Group) => void; onRemove: () => void }) {
  const setRule = (i: number, patch: Partial<Group['rules'][number]>) => onChange({ ...group, rules: group.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  return (
    <section aria-label={`Group ${index + 1}`} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Icon name="layers" className="h-4 w-4" /> Group {index + 1}
        </h2>
        <button type="button" onClick={onRemove} className={smallButton}>
          <Icon name="x" className="h-4 w-4" /> Remove group
        </button>
      </div>
      <CodeArea
        label="User-agents"
        hint="one per line · * = all"
        rows={Math.min(6, Math.max(2, group.userAgents.length))}
        value={group.userAgents.join('\n')}
        onChange={(e) => onChange({ ...group, userAgents: e.target.value.split('\n') })}
      />
      <div className="space-y-2">
        <span className="eyebrow block text-slate-600 dark:text-slate-400">Rules</span>
        {group.rules.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Segmented<RuleType>
              label={`Rule ${i + 1} type`}
              options={[
                { value: 'allow', label: 'Allow' },
                { value: 'disallow', label: 'Disallow' },
              ]}
              value={r.type}
              onChange={(type) => setRule(i, { type })}
            />
            <input
              aria-label={`Rule ${i + 1} path`}
              className={`${inputClass} flex-1 basis-40`}
              value={r.path}
              placeholder="/private/"
              spellCheck={false}
              autoCapitalize="off"
              onChange={(e) => setRule(i, { path: e.target.value })}
            />
            <button type="button" aria-label={`Remove rule ${i + 1}`} onClick={() => onChange({ ...group, rules: group.rules.filter((_, j) => j !== i) })} className={smallButton}>
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...group, rules: [...group.rules, { type: 'disallow', path: '' }] })} className={smallButton}>
          + Add rule
        </button>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        Crawl-delay (seconds, optional)
        <input className={`${inputClass} w-24`} inputMode="decimal" value={group.crawlDelay ?? ''} onChange={(e) => onChange({ ...group, crawlDelay: e.target.value })} />
      </label>
    </section>
  );
}

export default function RobotsTxtGeneratorPage() {
  const [doc, setDoc] = useState<RobotsDoc>(PRESETS[0].doc());
  const [sitemaps, setSitemaps] = useState('');
  const [source, setSource] = useState<Source>('generated');
  const [pasted, setPasted] = useState('');
  const [agent, setAgent] = useState('Googlebot');
  const [url, setUrl] = useState('/');

  const generated = useMemo(() => generate({ ...doc, sitemaps: sitemaps.split('\n') }), [doc, sitemaps]);
  const download = () => downloadText(generated, 'robots.txt', 'text/plain');
  useToolShortcuts({ getOutput: () => generated, onDownload: () => generated && download() });
  const testedText = source === 'generated' ? generated : pasted;
  const parsed = useMemo(() => parse(testedText), [testedText]);
  const result = useMemo(() => (url.trim() ? testUrl(parsed.doc, agent, url) : null), [parsed, agent, url]);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    const d = p.doc();
    setDoc({ ...d, sitemaps: [] });
    if (d.sitemaps.length) setSitemaps(d.sitemaps.join('\n'));
  };

  const errors = parsed.issues.filter((i) => i.severity === 'error').length;
  const status = `${pluralize(parsed.doc.groups.length, 'group')} · ${pluralize(parsed.doc.groups.reduce((n, g) => n + g.rules.length, 0), 'rule')}${
    source === 'pasted' ? ` · ${pluralize(parsed.issues.length, 'lint note')}` : ''
  }`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={robotsTxtGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="crawlers">Tell the </Headline>
        <div className="flex flex-wrap items-center gap-3">
          <Select<string> label="Preset" placeholder="Start from…" options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} onChange={applyPreset} />
        </div>
      </div>

      <StatusStrip status={status} tone={errors ? 'neutral' : 'good'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          {doc.groups.map((g, i) => (
            <GroupEditor
              key={i}
              index={i}
              group={g}
              onChange={(ng) => setDoc((d) => ({ ...d, groups: d.groups.map((x, j) => (j === i ? ng : x)) }))}
              onRemove={() => setDoc((d) => ({ ...d, groups: d.groups.filter((_, j) => j !== i) }))}
            />
          ))}
          <Button variant="secondary" onClick={() => setDoc((d) => ({ ...d, groups: [...d.groups, { userAgents: [''], rules: [{ type: 'disallow', path: '/' }] }] }))}>
            + Add group
          </Button>
          <CodeArea label="Sitemaps" hint="absolute URLs, one per line" rows={3} value={sitemaps} onChange={(e) => setSitemaps(e.target.value)} onFileText={setSitemaps} placeholder="https://example.com/sitemap.xml" />
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-label="robots.txt" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="file" className="h-4 w-4" /> robots.txt
              </h2>
              <div className="flex flex-wrap gap-1">
                <CopyButton text={generated} />
                <SendToMenu text={generated} kind="text" />
                <button type="button" disabled={!generated} onClick={download} className={smallButton}>
                  <Icon name="download" className="h-4 w-4" /> Download robots.txt
                </button>
              </div>
            </header>
            <div className="p-4">
              <CodeBlock className="max-h-[28rem] overflow-y-auto">{generated || '# Add a group to start.'}</CodeBlock>
            </div>
          </section>

          <section aria-label="Tester" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="search" className="h-4 w-4" /> Test a URL
            </h2>
            <Segmented<Source>
              label="Test against"
              options={[
                { value: 'generated', label: 'Generated file' },
                { value: 'pasted', label: 'Paste a robots.txt' },
              ]}
              value={source}
              onChange={setSource}
            />
            {source === 'pasted' && (
              <CodeArea label="Robots.txt to test" rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} onFileText={setPasted} placeholder={'User-agent: *\nDisallow: /admin/'} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">User-agent</span>
                <input className={inputClass} value={agent} onChange={(e) => setAgent(e.target.value)} spellCheck={false} autoCapitalize="off" />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">URL or path</span>
                <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} autoCapitalize="off" />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEST_AGENTS.map((a) => (
                <button key={a} type="button" onClick={() => setAgent(a)} className={`${smallButton} ring-1 ring-inset ring-slate-200 dark:ring-slate-700`}>
                  {a}
                </button>
              ))}
            </div>
            {result && (
              <div
                role="status"
                aria-label="Test result"
                className={`rounded-2xl p-4 ${result.allowed ? 'bg-primary text-primary-ink' : 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200'}`}
              >
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <Icon name={result.allowed ? 'check' : 'x'} className="h-5 w-5" /> {result.allowed ? 'Allowed' : 'Blocked'}
                </p>
                <p className="mt-1 break-words text-sm">{result.reason}</p>
                {result.group && (
                  <p className="mt-1 break-words text-sm">
                    Group used: <span className="font-mono">{result.group}</span>
                    {result.rule?.line ? ` · line ${result.rule.line}` : ''}
                  </p>
                )}
              </div>
            )}
          </section>

          {source === 'pasted' && pasted.trim() && (
            <section aria-label="Lint" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="eyebrow mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="warn" className="h-4 w-4" /> Lint
              </h2>
              {parsed.issues.length ? (
                <ul className="space-y-2 text-sm">
                  {parsed.issues.map((iss, i) => (
                    <li key={i} className="flex min-w-0 flex-wrap items-baseline gap-2">
                      <Badge tone={iss.severity === 'error' ? 'red' : iss.severity === 'warning' ? 'amber' : 'blue'}>Line {iss.line}</Badge>
                      <span className="min-w-0 break-words text-slate-700 dark:text-slate-300">{iss.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">No problems found.</p>
              )}
            </section>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        The tester follows RFC 9309: the most specific user-agent group applies, the longest matching path wins, Allow wins a tie, and * and $ work as
        wildcards. robots.txt is a request, not access control: well-behaved crawlers obey it, others may not.
      </p>
    </div>
  );
}
