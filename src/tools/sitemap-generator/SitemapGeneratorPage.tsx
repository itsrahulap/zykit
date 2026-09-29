import { useDeferredValue, useMemo, useState } from 'react';
import sitemapGenerator from './index';
import { buildSitemaps, CHANGEFREQS, parseUrlList, validateSitemap, type ChangeFreq } from './features/sitemap';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Checkbox, Notices, OpenFileButton, OutputPanel } from '../../shared/ui/convert';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

type Tab = 'generate' | 'validate';

const SAMPLE = `https://example.com/
https://example.com/about 2026-01-15 0.8 monthly
https://example.com/blog?tag=news&page=2
https://example.com/blog/hello-world 2026-09-01
https://example.com/about
/relative-path`;

const inputClass =
  'block min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]';
const smallButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SitemapGeneratorPage() {
  const [tab, setTab] = useState<Tab>('generate');
  const [input, setInput] = useState('');
  const [extract, setExtract] = useState(false);
  const [lastmod, setLastmod] = useState('');
  const [changefreq, setChangefreq] = useState<ChangeFreq | ''>('');
  const [priority, setPriority] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [xml, setXml] = useState('');

  const text = useDeferredValue(input);
  const list = useMemo(() => parseUrlList(text, extract), [text, extract]);
  const autoBase = list.entries[0] ? new URL(list.entries[0].loc).origin : '';
  const built = useMemo(
    () =>
      list.entries.length
        ? buildSitemaps(list.entries, { lastmod: lastmod || undefined, changefreq: changefreq || undefined, priority: priority || undefined }, { baseUrl: baseUrl.trim() || autoBase, lastmodIndex: today() })
        : null,
    [list, lastmod, changefreq, priority, baseUrl, autoBase],
  );

  const xmlText = useDeferredValue(xml);
  const validation = useMemo(() => (xmlText.trim() ? validateSitemap(xmlText) : null), [xmlText]);

  const notices: string[] = [];
  for (const p of list.problems.slice(0, 20)) notices.push(`Line ${p.line}: ${p.reason} (${p.value.slice(0, 120)})`);
  if (list.problems.length > 20) notices.push(`…and ${list.problems.length - 20} more problems.`);
  if (list.duplicates) notices.push(`${pluralize(list.duplicates, 'duplicate URL')} removed.`);
  if (list.hosts.length > 1) notices.push(`URLs come from ${list.hosts.length} hosts (${list.hosts.slice(0, 3).join(', ')}…). A sitemap may only list URLs from the host it's served on, unless you verify cross-site submission.`);

  const status =
    tab === 'generate'
      ? !list.entries.length
        ? 'Paste your site URLs to generate a sitemap.xml.'
        : `${pluralize(list.entries.length, 'URL')} · ${built?.index ? `${built.files.length} sitemap files + index` : '1 sitemap file'}`
      : !validation
        ? 'Paste a sitemap.xml to check it.'
        : validation.kind
          ? `<${validation.kind}> · ${pluralize(validation.count, 'entry', 'entries')} · ${pluralize(validation.issues.filter((i) => i.severity === 'error').length, 'error')}`
          : 'Not a valid sitemap.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={sitemapGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="findable">Make every page </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setTab('generate');
              setExtract(false);
              setInput(SAMPLE);
            }}
          >
            Try an example
          </Button>
          {tab === 'generate' && <OpenFileButton accept=".txt,.csv,.tsv,.md,text/plain,text/csv" onText={setInput} />}
          <Button
            variant="ghost"
            disabled={tab === 'generate' ? !input : !xml}
            onClick={() => (tab === 'generate' ? setInput('') : setXml(''))}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={tab === 'generate' ? (built ? 'good' : 'neutral') : validation?.kind && !validation.issues.some((i) => i.severity === 'error') ? 'good' : 'neutral'} />

      <Segmented<Tab>
        label="Mode"
        options={[
          { value: 'generate', label: 'Generate' },
          { value: 'validate', label: 'Validate a sitemap' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'generate' ? (
        <>
          <section aria-label="Defaults" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>lastmod</span>
              <input type="date" aria-label="lastmod" className={inputClass} value={lastmod} onChange={(e) => setLastmod(e.target.value)} />
              <button type="button" className={smallButton} onClick={() => setLastmod(today())}>
                Today
              </button>
              {lastmod && (
                <button type="button" className={smallButton} onClick={() => setLastmod('')}>
                  None
                </button>
              )}
            </div>
            <Select<string>
              label="changefreq"
              options={[{ value: '', label: 'None' }, ...CHANGEFREQS.map((c) => ({ value: c, label: c }))]}
              value={changefreq}
              onChange={(v) => setChangefreq(v as ChangeFreq | '')}
            />
            <Select<string>
              label="priority"
              options={[{ value: '', label: 'None' }, ...Array.from({ length: 11 }, (_, i) => ({ value: (i / 10).toFixed(1), label: (i / 10).toFixed(1) }))]}
              value={priority}
              onChange={setPriority}
            />
            <Checkbox label="Find URLs in text" checked={extract} onChange={setExtract} />
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <CodeArea
                label="URLs"
                hint={extract ? 'any text' : 'one per line · optional date, priority, changefreq'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFileText={setInput}
                rows={16}
                placeholder={'https://example.com/\nhttps://example.com/about 2026-01-15 0.8 monthly'}
              />
              <Notices items={notices} />
            </div>

            <div className="min-w-0 space-y-6">
              {built && !built.index && <OutputPanel title="sitemap.xml" icon="code" text={built.files[0].content} fileName="sitemap.xml" mime="application/xml" busy={text !== input} />}
              {built?.index && (
                <>
                  <section aria-label="Sitemap files" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="eyebrow mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Icon name="layers" className="h-4 w-4" /> {built.files.length} files (over 50,000 URLs or 50 MB each)
                    </h2>
                    <label className="mb-3 block text-sm text-slate-600 dark:text-slate-400">
                      Where the files will live
                      <input className={`${inputClass} mt-1 w-full`} value={baseUrl} placeholder={autoBase} onChange={(e) => setBaseUrl(e.target.value)} />
                    </label>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {built.files.map((f) => (
                        <li key={f.name} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                          <span className="font-mono text-slate-900 dark:text-slate-100">{f.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {pluralize(f.urls, 'URL')} · {formatBytes(new Blob([f.content]).size)}
                          </span>
                          <button type="button" className={smallButton} onClick={() => downloadText(f.content, f.name, 'application/xml')}>
                            <Icon name="download" className="h-4 w-4" /> Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <OutputPanel title="sitemap-index.xml" icon="code" text={built.index.content} fileName="sitemap-index.xml" mime="application/xml" />
                </>
              )}
              {!built && (
                <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Your sitemap.xml appears here. URLs must be absolute (https://…); fragments are dropped and characters like &amp; are escaped.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="min-w-0 space-y-3">
            <CodeArea label="Sitemap XML" value={xml} onChange={(e) => setXml(e.target.value)} onFileText={setXml} rows={16} placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">…'} />
            <OpenFileButton accept=".xml,text/xml,application/xml" onText={setXml} />
          </div>
          <div className="min-w-0">
            {validation && (
              <section aria-label="Validation" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="eyebrow mb-3 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icon name="check" className="h-4 w-4" /> Validation
                </h2>
                {validation.issues.length ? (
                  <ul className="space-y-2 text-sm">
                    {validation.issues.slice(0, 200).map((iss, i) => (
                      <li key={i} className="flex min-w-0 flex-wrap items-baseline gap-2">
                        <Badge tone={iss.severity === 'error' ? 'red' : 'amber'}>{iss.line ? `Line ${iss.line}` : iss.severity}</Badge>
                        <span className="min-w-0 break-all text-slate-700 dark:text-slate-300">{iss.message}</span>
                      </li>
                    ))}
                    {validation.issues.length > 200 && <li className="text-slate-500">…and {validation.issues.length - 200} more.</li>}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    <Icon name="check" className="h-4 w-4" /> Well-formed, correct namespace, no duplicates.
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Everything runs in your browser. hreflang alternates (xhtml:link) aren&rsquo;t generated; add them with your CMS if you need them. Google ignores
        changefreq and priority, but uses an accurate lastmod.
      </p>
    </div>
  );
}
