import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import sqlSchemaVisualizer from './index';
import { SchemaDiagram } from './components/SchemaDiagram';
import { diagramToSvg, layoutDiagram, toMermaid } from './features/diagram';
import { parseSchema, suggestRelationships, tableLabel, MAX_INPUT_CHARS } from './features/parser';
import { QUERY_BUILDER_PATH, QUERY_BUILDER_STORAGE_KEY, toQueryBuilderProject } from './features/queryBuilder';
import { importProject } from '../postgres-query-builder/features/project';
import { AppError } from '../../shared/lib/errors';
import { ErrorPanel, OpenFileButton, OutputPanel } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { downloadBlob, downloadText, selectInTextarea } from '../../shared/utils/dom.utils';
import { pluralize } from '../../shared/utils/format.utils';
import { offsetOf } from '../../shared/lib/textpos';

const INPUT_ID = 'sql-schema-input';
// Keeps the PNG within what browsers reliably allocate for one canvas.
const MAX_PNG_SIDE = 16_384;
const MAX_PNG_PIXELS = 40_000_000;

const SAMPLE = `-- A small shop schema
CREATE TABLE customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  "Display Name" varchar(120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id serial PRIMARY KEY,
  sku varchar(32) NOT NULL UNIQUE,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  tags text[] DEFAULT '{}'
);

CREATE TABLE orders (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new; unpaid', -- the semicolon in the string is fine
  placed_at timestamptz
);

CREATE TABLE order_items (
  order_id bigint NOT NULL,
  product_id int NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  CONSTRAINT order_items_pkey PRIMARY KEY (order_id, product_id),
  CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES orders (id)
);

ALTER TABLE order_items ADD CONSTRAINT order_items_product_fk FOREIGN KEY (product_id) REFERENCES products (id);
CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE FUNCTION touch() RETURNS trigger AS $$ BEGIN NEW.placed_at := now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
`;

function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  const scale = Math.min(2, Math.sqrt(MAX_PNG_PIXELS / (width * height)), MAX_PNG_SIDE / width, MAX_PNG_SIDE / height);
  if (scale < 0.25) return Promise.reject(new AppError('TOO_MANY_PIXELS', 'The diagram is too large for a PNG. Download the SVG instead.'));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new AppError('TOO_LARGE', 'The browser couldn’t create an image this large. Download the SVG instead.'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new AppError('TOO_LARGE', 'The browser couldn’t encode the PNG. Download the SVG instead.'))), 'image/png');
    };
    img.onerror = () => reject(new AppError('CORRUPT', 'The diagram couldn’t be drawn as an image. Download the SVG instead.'));
    // A data: URL (not blob:) keeps this a purely local operation with no request to watch.
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export default function SqlSchemaVisualizerPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const text = useDeferredValue(input);
  const schema = useMemo(() => parseSchema(text), [text]);
  const diagram = useMemo(() => layoutDiagram(schema), [schema]);
  const mermaid = useMemo(() => toMermaid(schema), [schema]);
  const suggestions = useMemo(() => suggestRelationships(schema), [schema]);
  const handoff = useMemo(() => toQueryBuilderProject(schema), [schema]);
  const hasTables = schema.tables.length > 0;
  const byId = new Map(schema.tables.map((t) => [t.id, t]));

  const downloadSvg = () => downloadText(diagramToSvg(diagram).text, 'schema.svg', 'image/svg+xml');
  const downloadPng = async () => {
    const svg = diagramToSvg(diagram);
    try {
      downloadBlob(await svgToPng(svg.text, svg.width, svg.height), 'schema.png');
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      setError(e.message);
    }
  };
  const openInQueryBuilder = () => {
    if (!handoff.ok) return;
    try {
      const saved = localStorage.getItem(QUERY_BUILDER_STORAGE_KEY);
      const current = saved ? importProject(saved) : null;
      if (current?.ok && current.project.schema.tables.length && !window.confirm('This replaces the tables and query saved in the PostgreSQL Query Builder. Continue?')) return;
      localStorage.setItem(QUERY_BUILDER_STORAGE_KEY, handoff.json);
    } catch {
      setError('Your browser blocked local storage, so the schema can’t be handed over. Download the project JSON and import it in the Query Builder instead.');
      return;
    }
    navigate(QUERY_BUILDER_PATH);
  };

  const status = !text.trim()
    ? 'Paste PostgreSQL CREATE TABLE statements, or try the example.'
    : schema.error
      ? `Couldn’t read the SQL: ${schema.error.message} (line ${schema.error.line})`
      : `${pluralize(schema.tables.length, 'table')} · ${pluralize(schema.foreignKeys.length, 'foreign key')}${schema.issues.length ? ` · ${pluralize(schema.issues.length, 'note')}` : ''}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={sqlSchemaVisualizer} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="ER diagrams">Turn SQL into </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".sql,.txt,.ddl,text/plain,application/sql" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={hasTables && !schema.error ? 'good' : 'neutral'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <CodeArea
        id={INPUT_ID}
        label="PostgreSQL DDL"
        hint={`CREATE TABLE, CREATE INDEX, ALTER TABLE … ADD · up to ${(MAX_INPUT_CHARS / 1_000_000).toLocaleString('en-US')} million characters`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFileText={(t) => setInput(t)}
        rows={10}
        placeholder="CREATE TABLE users (id bigint PRIMARY KEY, email text NOT NULL UNIQUE);"
        aria-invalid={schema.error ? true : undefined}
      />

      {schema.error && <ErrorPanel error={schema.error} text={text} inputId={INPUT_ID} />}

      {schema.issues.length > 0 && (
        <section aria-label="Skipped or ignored SQL" className="rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-6 dark:border-amber-900 dark:bg-amber-950/40">
          <h2 className="eyebrow mb-3 flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Icon name="warn" className="h-4 w-4" /> Skipped or ignored
          </h2>
          <ul className="space-y-1.5 text-sm text-amber-900 dark:text-amber-200">
            {schema.issues.map((issue, i) => (
              <li key={i} className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <button
                  type="button"
                  onClick={() => selectInTextarea(INPUT_ID, offsetOf(text, issue.line, issue.column))}
                  className="shrink-0 font-semibold underline underline-offset-4 pointer-coarse:min-h-11"
                >
                  Line {issue.line}
                </button>
                <span className="min-w-0 break-words">{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasTables && (
        <>
          <section aria-label="Diagram" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="database" className="h-4 w-4" /> ER diagram
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={downloadSvg}>
                  <Icon name="download" className="h-4 w-4" /> SVG
                </Button>
                <Button variant="secondary" onClick={downloadPng}>
                  <Icon name="download" className="h-4 w-4" /> PNG
                </Button>
              </div>
            </header>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Lines are explicit foreign keys only, drawn from the referencing column to the referenced table. Markers: PK primary key, FK foreign key, UQ unique.
            </p>
            <SchemaDiagram schema={schema} diagram={diagram} />
          </section>

          {suggestions.length > 0 && (
            <section aria-label="Relationship suggestions" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Possible relationships</h2>
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Guessed from column names only. They aren’t foreign keys and aren’t drawn on the diagram.</p>
              <ul className="space-y-1.5 text-sm">
                {suggestions.map((sg) => (
                  <li key={`${sg.fromTable}.${sg.fromColumn}`} className="flex min-w-0 flex-wrap items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Badge tone="amber">suggestion</Badge>
                    <code className="min-w-0 break-all font-mono">
                      {tableLabel(byId.get(sg.fromTable)!)}.{sg.fromColumn} → {tableLabel(byId.get(sg.toTable)!)}.{sg.toColumn}
                    </code>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <OutputPanel title="Mermaid erDiagram" icon="code" text={mermaid.text} fileName="schema.mmd" mime="text/plain" />
              {mermaid.renamed > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {pluralize(mermaid.renamed, 'name')} had characters Mermaid doesn’t allow and were changed; renamed columns keep the original in their comment.
                </p>
              )}
            </div>
            <section aria-label="Open in Query Builder" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="layers" className="h-4 w-4" /> PostgreSQL Query Builder
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Build queries against this schema. The tables and foreign keys are copied into the Query Builder in this browser.</p>
              {handoff.ok ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={openInQueryBuilder}>
                      <Icon name="arrow" className="h-4 w-4" /> Open in Query Builder
                    </Button>
                    <Button variant="secondary" onClick={() => downloadText(handoff.json, 'schema.query-builder.json', 'application/json')}>
                      <Icon name="download" className="h-4 w-4" /> Project JSON
                    </Button>
                  </div>
                  {handoff.notes.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-sm break-words text-slate-600 dark:text-slate-400">
                      {handoff.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-sm text-red-800 dark:text-red-300">{handoff.error}</p>
              )}
            </section>
          </div>
        </>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">The SQL is parsed in your browser. Nothing connects to a database or leaves your device.</p>
    </div>
  );
}
