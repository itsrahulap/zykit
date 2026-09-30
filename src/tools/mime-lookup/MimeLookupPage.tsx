import { useDeferredValue, useMemo, useState } from 'react';
import mimeLookup from './index';
import { extensionOf, lookupExtension, MIME_TYPES, searchMime, type Category, type MimeType } from './features/mimeTypes';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { DropZone } from '../../shared/ui/DropZone';
import { Breadcrumb, CopyButton } from '../../shared/ui/tool';
import { Badge, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

/** Rows shown before "Show all" to keep the page light. */
const PAGE = 60;

const CATEGORY_TONE: Record<Category, Parameters<typeof Badge>[0]['tone']> = {
  image: 'violet',
  audio: 'blue',
  video: 'blue',
  text: 'green',
  code: 'green',
  data: 'green',
  document: 'amber',
  font: 'neutral',
  archive: 'amber',
  application: 'neutral',
  model: 'violet',
};

function MimeRow({ t }: { t: MimeType }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{t.mime}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {t.extensions.length ? (
            t.extensions.map((e) => (
              <code key={e} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                .{e}
              </code>
            ))
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">No usual extension</span>
          )}
          <Badge tone={CATEGORY_TONE[t.category]}>{t.category}</Badge>
          {t.compressible && <Badge tone="green">compressible</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-1">
        <CopyButton text={t.mime} label="Copy MIME" />
        {t.extensions.length > 0 && <CopyButton text={`.${t.extensions[0]}`} label="Copy ext" />}
      </div>
    </li>
  );
}

function FileCheck() {
  const [file, setFile] = useState<{ name: string; type: string } | null>(null);
  const match = file ? lookupExtension(file.name) : undefined;
  const ext = file ? extensionOf(file.name) : '';
  return (
    <DropZone onFile={(f) => setFile({ name: f.name, type: f.type })} label="Drop a file to check it">
      <Panel eyebrow="Check a file" icon="file">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Only the file&rsquo;s name and the type your browser reports are used. Its contents are not read.
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800">
          <Icon name="upload" className="h-4 w-4" /> Choose a file
          <input
            type="file"
            className="sr-only"
            aria-label="Choose a file to check"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ? { name: f.name, type: f.type } : null);
            }}
          />
        </label>
        {file && (
          <div className="mt-5">
            <DetailRows
              rows={[
                ['File name', <span key="n" className="break-all">{file.name}</span>],
                ['Extension', ext ? `.${ext}` : 'none'],
                ['Type from extension', <span key="e" className="break-all font-mono">{match?.mime ?? 'unknown'}</span>],
                ['Browser-reported type', <span key="b" className="break-all font-mono">{file.type || '(empty)'}</span>],
              ]}
            />
            {match && file.type && match.mime !== file.type && (
              <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">
                These differ. Browsers guess from the extension using the operating system&rsquo;s own table, so both can be valid aliases.
              </p>
            )}
          </div>
        )}
      </Panel>
    </DropZone>
  );
}

export default function MimeLookupPage() {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const q = useDeferredValue(query);
  const results = useMemo(() => searchMime(q), [q]);
  const shown = showAll ? results : results.slice(0, PAGE);

  const status = q.trim()
    ? results.length
      ? `${pluralize(results.length, 'match', 'matches')} for “${q.trim()}”`
      : `No MIME type matches “${q.trim()}”`
    : `${MIME_TYPES.length} common MIME types`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={mimeLookup} />
      <Headline accent="type">Find the right MIME </Headline>
      <StatusStrip status={status} tone={q.trim() && results.length ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-4">
          <label className="block">
            <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Extension, MIME type or file name</span>
            <span className="relative block">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowAll(false);
                }}
                placeholder=".png, image/, report.final.pdf"
                spellCheck={false}
                autoCapitalize="off"
                className="block w-full rounded-xl border border-field-edge bg-white py-2.5 pl-9 pr-3 font-mono text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100"
              />
            </span>
          </label>

          {results.length > 0 && (
            <section aria-label="Results" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {shown.map((t) => (
                  <MimeRow key={t.mime} t={t} />
                ))}
              </ul>
              {shown.length < results.length && (
                <div className="border-t border-slate-100 p-4 text-center dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline pointer-coarse:min-h-11 dark:text-emerald-400"
                  >
                    Show all {results.length}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <FileCheck />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mappings follow the IANA registry and common server defaults (Apache, nginx). &ldquo;Compressible&rdquo; means gzip or Brotli usually shrinks it;
            already-compressed formats like PNG, MP4 or ZIP gain nothing.
          </p>
        </div>
      </div>
    </div>
  );
}
