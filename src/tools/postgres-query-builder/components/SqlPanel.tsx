// Generated SQL output for the query or the schema, with copy, download and an optional manual
// edit mode. Manual edits are never overwritten silently: if the visual design changes while
// editing, a notice offers to replace them.

import { useMemo, useState } from 'react';
import { generateDdl } from '../features/ddl';
import { explainQuery } from '../features/explain';
import type { Query, Schema } from '../features/model';
import { generateQuery } from '../features/query';
import { CodeArea, CodeBlock, CopyButton, Segmented } from '../../../shared/ui/tool';
import { Icon } from '../../../shared/ui/ui';
import { downloadText } from '../../../shared/utils/dom.utils';
import { Check, Problems, SmallButton } from './fields';

export type SqlView = 'query' | 'schema';

let formatterPromise: Promise<typeof import('sql-formatter').format> | null = null;
const loadFormatter = () => (formatterPromise ??= import('sql-formatter').then((m) => m.format));

export function SqlPanel({ schema, query, view, onView }: { schema: Schema; query: Query; view: SqlView; onView: (v: SqlView) => void }) {
  const [indexFks, setIndexFks] = useState(true);
  const [manual, setManual] = useState<{ view: SqlView; text: string; base: string } | null>(null);
  const [formatError, setFormatError] = useState('');

  const result = useMemo(() => (view === 'query' ? generateQuery(schema, query) : generateDdl(schema, { indexForeignKeys: indexFks })), [view, schema, query, indexFks]);
  const explanation = useMemo(() => (view === 'query' && !result.errors.length ? explainQuery(schema, query) : []), [view, schema, query, result.errors.length]);
  const editing = manual?.view === view ? manual : null;
  const stale = editing && editing.base !== result.sql;
  const text = editing ? editing.text : result.sql;
  const fileName = view === 'query' ? 'query.sql' : 'schema.sql';

  const format = async () => {
    if (!editing) return;
    try {
      const fmt = await loadFormatter();
      setManual({ ...editing, text: fmt(editing.text, { language: 'postgresql', keywordCase: 'upper', tabWidth: 4 }) });
      setFormatError('');
    } catch {
      setFormatError("The SQL couldn't be formatted. Check it for syntax errors.");
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="pqb-sql-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pqb-sql-heading" className="eyebrow text-slate-600 dark:text-slate-400">
          Generated SQL
        </h2>
        <Segmented
          label="SQL to show"
          value={view}
          onChange={onView}
          options={[
            { value: 'query', label: 'Query (SELECT)' },
            { value: 'schema', label: 'Schema (CREATE TABLE)' },
          ]}
        />
      </div>

      {view === 'schema' && <Check label="Add indexes for foreign key columns" checked={indexFks} onChange={setIndexFks} />}

      {!editing && <Problems items={result.errors} />}

      {editing ? (
        <>
          {stale && (
            <div role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <Icon name="warn" className="h-4 w-4" />
              <span className="flex-1">The visual design changed since you started editing. Your edits are kept.</span>
              <SmallButton onClick={() => setManual(null)}>Replace with generated SQL</SmallButton>
            </div>
          )}
          <CodeArea
            label={view === 'query' ? 'Query SQL (edited by you)' : 'Schema SQL (edited by you)'}
            hint="Not checked by the builder"
            rows={16}
            value={editing.text}
            maxLength={200_000}
            onChange={(e) => setManual({ ...editing, text: e.target.value })}
          />
          <p className="text-xs text-slate-500">Manual edits are not read back into the visual builder and are not saved with the project.</p>
          {formatError && <p className="text-sm text-red-700 dark:text-red-400">{formatError}</p>}
        </>
      ) : (
        text && <CodeBlock label={view === 'query' ? 'Generated query SQL' : 'Generated schema SQL'}>{text}</CodeBlock>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={text} label="Copy SQL" />
        <SmallButton disabled={!text} onClick={() => downloadText(text, fileName, 'application/sql')}>
          <Icon name="download" className="h-4 w-4" /> Download {fileName}
        </SmallButton>
        {editing ? (
          <>
            <SmallButton disabled={!editing.text.trim()} onClick={format}>
              Format SQL
            </SmallButton>
            <SmallButton onClick={() => (editing.text === editing.base || window.confirm('Discard your edits and show the generated SQL?')) && setManual(null)}>Back to generated</SmallButton>
          </>
        ) : (
          <SmallButton disabled={!result.sql} onClick={() => setManual({ view, text: result.sql, base: result.sql })}>
            Edit SQL by hand
          </SmallButton>
        )}
      </div>

      {explanation.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
          <p className="font-semibold">What this query does</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700 dark:text-slate-300">
            {explanation.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-500">This is generated SQL text. Nothing is run against a database; review it and run it in your own PostgreSQL client.</p>
    </section>
  );
}
