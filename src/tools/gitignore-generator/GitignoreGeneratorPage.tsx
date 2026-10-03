import { useEffect, useId, useMemo, useState } from 'react';
import gitignoreGenerator from './index';
import { GROUPS, merge, MAX_PATHS, parseRules, SAMPLE_PATHS, searchTemplates, templateById, testPath, type PathResult } from './features/gitignore-generator';
import { Checkbox, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full rounded-xl border border-field-edge bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

export default function GitignoreGeneratorPage() {
  const [selected, setSelected] = useState<string[]>(['node', 'macos', 'vscode']);
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');
  const [paths, setPaths] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const searchId = useId();

  const merged = useMemo(() => merge(selected, custom), [selected, custom]);
  const visible = useMemo(() => searchTemplates(query), [query]);
  const effective = rulesText.trim() ? rulesText : merged.text;

  // Test results are computed after a short pause so typing in a long list stays responsive.
  const [results, setResults] = useState<PathResult[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const rules = parseRules(effective, ignoreCase);
      const out: PathResult[] = [];
      for (const line of paths.split(/\r?\n/).slice(0, MAX_PATHS)) {
        const r = testPath(rules, line);
        if (r) out.push(r);
      }
      setResults(out);
    }, 100);
    return () => clearTimeout(timer);
  }, [effective, paths, ignoreCase]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  useIncomingText(gitignoreGenerator.id, (t) => setCustom(t));
  useShareState({ selected, custom, paths, rulesText, ignoreCase }, (s) => {
    if (s.selected) setSelected(s.selected.filter((x): x is string => typeof x === 'string' && !!templateById(x)));
    if (s.custom !== undefined) setCustom(s.custom);
    if (s.paths !== undefined) setPaths(s.paths);
    if (s.rulesText !== undefined) setRulesText(s.rulesText);
    if (s.ignoreCase !== undefined) setIgnoreCase(s.ignoreCase);
  });

  const lines = merged.text ? merged.text.split('\n').filter((l) => l && !l.startsWith('#')).length : 0;
  const status =
    selected.length || custom.trim()
      ? `${pluralize(selected.length, 'template')} merged into ${pluralize(lines, 'pattern')}${merged.duplicates ? `, ${pluralize(merged.duplicates, 'duplicate')} removed` : ''}.`
      : 'Choose templates to build a .gitignore.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={gitignoreGenerator} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent=".gitignore">Generate a </Headline>
        <Button variant="ghost" disabled={!selected.length && !custom} onClick={() => (setSelected([]), setCustom(''))}>
          <Icon name="x" className="h-4 w-4" /> Clear all
        </Button>
      </div>
      <StatusStrip status={status} tone={lines ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section aria-label="Templates" className={card}>
            <label htmlFor={searchId} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Search templates
            </label>
            <input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Python, Next.js, JetBrains…" className={field} autoComplete="off" />
            {selected.length > 0 && (
              <ul aria-label="Selected templates" className="mt-3 flex flex-wrap gap-2">
                {selected.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={`Remove ${templateById(id)?.name ?? id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 pointer-coarse:min-h-11 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900"
                    >
                      {templateById(id)?.name ?? id} <Icon name="x" className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div role="group" aria-label="Available templates" className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
              {GROUPS.map((g) => {
                const items = visible.filter((t) => t.group === g);
                if (!items.length) return null;
                return (
                  <fieldset key={g} className="min-w-0">
                    <legend className="eyebrow mb-1 text-slate-600 dark:text-slate-400">{g}</legend>
                    <div className="grid gap-x-4 sm:grid-cols-2">
                      {items.map((t) => (
                        <label key={t.id} className="flex min-w-0 cursor-pointer items-center gap-2 py-1.5 text-sm text-slate-800 pointer-coarse:min-h-11 dark:text-slate-200">
                          <input type="checkbox" className="h-4 w-4 shrink-0 accent-emerald-600" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
                          <span className="min-w-0 break-words">{t.name}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
              {!visible.length && <p className="text-sm text-slate-600 dark:text-slate-400">No template matches “{query}”.</p>}
            </div>
          </section>
          <CodeArea label="Custom lines" hint="added at the end" value={custom} onChange={(e) => setCustom(e.target.value)} rows={4} placeholder={'my-secret.txt\n/scratch/'} />
        </div>

        <div className="min-w-0">
          {merged.text ? (
            <OutputPanel title=".gitignore" icon="code" text={merged.text} fileName=".gitignore" mime="text/plain" kind="text" />
          ) : (
            <p className={`${card} text-sm text-slate-600 dark:text-slate-400`}>Your .gitignore will appear here.</p>
          )}
        </div>
      </div>

      <section aria-label="Path tester" className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Test paths</h2>
          <Button variant="secondary" onClick={() => setPaths(SAMPLE_PATHS)}>
            Example paths
          </Button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Paste file paths, one per line (end a directory with <code>/</code>). They are tested against the generated file, or against your own rules below.
        </p>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <CodeArea label="Paths" value={paths} onChange={(e) => setPaths(e.target.value)} rows={8} placeholder={'src/index.ts\nnode_modules/react/index.js'} />
            <CodeArea label="Rules to test against (optional)" hint="empty = generated file" value={rulesText} onChange={(e) => setRulesText(e.target.value)} rows={4} placeholder={'*.log\n!keep.log'} />
            <Checkbox label="Ignore case (core.ignorecase)" checked={ignoreCase} onChange={setIgnoreCase} />
          </div>
          <div className="min-w-0">
            <h3 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Results</h3>
            {results.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Add some paths to see which are ignored.</p>
            ) : (
              <ul aria-label="Test results" tabIndex={0} className="max-h-96 space-y-2 overflow-y-auto">
                {results.map((r, i) => (
                  <li key={i} className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={r.ignored ? 'red' : 'green'}>{r.ignored ? 'Ignored' : 'Not ignored'}</Badge>
                      <span className="min-w-0 break-all font-mono text-xs text-slate-900 dark:text-slate-100">
                        {r.path}
                        {r.isDir ? '/' : ''}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-400">
                      {r.rule
                        ? r.parent
                          ? `Parent directory ${r.parent}/ is excluded by line ${r.rule.line}: ${r.rule.text}`
                          : r.rule.negated
                            ? `Re-included by line ${r.rule.line}: ${r.rule.text}`
                            : `Matched line ${r.rule.line}: ${r.rule.text}`
                        : 'No rule matches.'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <p className="text-sm text-slate-500 dark:text-slate-400">Everything runs in your browser. Templates are bundled with the page; nothing is fetched or uploaded.</p>
    </div>
  );
}
