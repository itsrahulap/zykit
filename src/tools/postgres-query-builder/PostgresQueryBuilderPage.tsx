import { useEffect, useRef, useState } from 'react';
import postgresQueryBuilder from './index';
import { RelationshipPanel } from './components/RelationshipPanel';
import { QueryBuilder } from './components/QueryBuilder';
import { Reference } from './components/Reference';
import { SchemaCanvas } from './components/SchemaCanvas';
import { SqlPanel, type SqlView } from './components/SqlPanel';
import { TableEditor } from './components/TableEditor';
import { Section, SmallButton } from './components/fields';
import { emptyProject, findTable, newColumn, newId, newTable, type Project, type Schema, type Table } from './features/model';
import { MAX_IMPORT_BYTES, draftFromConnect, emptyDraft, exportProject, importProject, type RelationshipDraft } from './features/project';
import { generateQuery } from './features/query';
import { SAMPLES } from './features/samples';
import { useProject } from './hooks/useProject';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Tabs } from '../../shared/ui/Tabs';
import { Breadcrumb } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';
import { pluralize } from '../../shared/utils/format.utils';

type Tab = 'query' | 'schema' | 'reference';
const TABS: { id: Tab; label: string }[] = [
  { id: 'query', label: 'Visual Query Builder' },
  { id: 'schema', label: 'Schema Designer' },
  { id: 'reference', label: 'SQL Reference' },
];

const isEmpty = (p: Project) => !p.schema.tables.length;

function duplicateTable(s: Schema, t: Table): Table {
  const ids = new Map(t.columns.map((c) => [c.id, newId('c')]));
  const taken = new Set(s.tables.map((x) => x.name));
  let name = `${t.name}_copy`;
  for (let i = 2; taken.has(name); i++) name = `${t.name}_copy${i}`;
  return {
    ...newTable(name, t.x + 40, t.y + 40),
    columns: t.columns.map((c) => ({ ...c, id: ids.get(c.id)! })),
    checks: [...t.checks],
    indexes: t.indexes.map((ix) => ({ id: newId('x'), unique: ix.unique, columnIds: ix.columnIds.map((c) => ids.get(c)!) })),
  };
}

export default function PostgresQueryBuilderPage() {
  const { project, apply, applyLive, endGesture, undo, redo, canUndo, canRedo } = useProject();
  const { schema, query } = project;
  const [tab, setTab] = useState<Tab>('query');
  const [sqlView, setSqlView] = useState<SqlView>('query');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRel, setSelectedRel] = useState<string | null>(null);
  const [draft, setDraft] = useState<RelationshipDraft>(emptyDraft);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const setSchema = (fn: (s: Schema) => Schema, mergeKey?: string) => apply((p) => ({ ...p, schema: fn(p.schema) }), mergeKey);
  const table = selectedTable ? findTable(schema, selectedTable) : undefined;

  // Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (or Ctrl+Y), except while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!(e.ctrlKey || e.metaKey) || el.closest('input, textarea, select, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) undo();
      else if ((k === 'z' && e.shiftKey) || k === 'y') redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const replace = (next: Project, what: string) => {
    if (!isEmpty(project) && !window.confirm(`${what} replaces your current tables and query. Continue?`)) return;
    apply(() => next);
    setSelectedTable(null);
    setSelectedRel(null);
    setDraft(emptyDraft());
  };
  const loadSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id);
    if (s) replace(s.build(), 'Loading a sample');
  };
  const importFile = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) return setError('The file is larger than 2 MB.');
    const res = importProject(await f.text());
    if (!res.ok) return setError(`Couldn't import ${f.name}: ${res.error}`);
    setError('');
    replace(res.project, 'Importing a project');
  };
  const addTable = () => {
    const taken = new Set(schema.tables.map((t) => t.name));
    let i = schema.tables.length + 1;
    while (taken.has(`table_${i}`)) i++;
    const n = schema.tables.length;
    const t = newTable(`table_${i}`, 40 + (n % 3) * 320, 40 + Math.floor(n / 3) * 300, [newColumn('id', 'BIGINT', { primaryKey: true, identity: true })]);
    setSchema((s) => ({ ...s, tables: [...s.tables, t] }));
    setSelectedTable(t.id);
  };
  const deleteTable = (t: Table) => {
    const linked = schema.relationships.filter((r) => r.fromTableId === t.id || r.toTableId === t.id).length;
    if (!window.confirm(`Delete table "${t.name}"${linked ? ` and its ${pluralize(linked, 'relationship')}` : ''}? You can undo this.`)) return;
    setSchema((s) => ({ ...s, tables: s.tables.filter((x) => x.id !== t.id) }));
    setSelectedTable(null);
  };

  const queryErrors = generateQuery(schema, query).errors;
  const status = isEmpty(project)
    ? 'Start with a sample schema or add your first table.'
    : `${pluralize(schema.tables.length, 'table')} · ${pluralize(schema.relationships.length, 'relationship')} · ${query.sources.length ? (queryErrors.length ? `query has ${pluralize(queryErrors.length, 'issue')}` : 'query SQL ready') : 'no query yet'}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={postgresQueryBuilder} />
      <div className="space-y-3">
        <Headline accent="visually">Build PostgreSQL queries </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Design tables and relationships, then pick tables, columns, joins and filters to generate PostgreSQL SQL. The tool only writes SQL text: it never connects to a database or runs
          anything. Your project is saved in this browser.
        </p>
      </div>
      <StatusStrip status={status} tone={isEmpty(project) ? 'neutral' : 'busy'} />

      <div className="flex flex-wrap items-center gap-2">
        <Select label="Sample" placeholder="Load a sample schema…" options={SAMPLES.map((s) => ({ value: s.id, label: s.label }))} onChange={loadSample} />
        <SmallButton onClick={undo} disabled={!canUndo}>
          Undo
        </SmallButton>
        <SmallButton onClick={redo} disabled={!canRedo}>
          Redo
        </SmallButton>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            importFile(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <SmallButton onClick={() => fileInput.current?.click()}>
          <Icon name="upload" className="h-4 w-4" /> Import JSON
        </SmallButton>
        <SmallButton disabled={isEmpty(project)} onClick={() => downloadText(exportProject(project), 'postgres-project.json', 'application/json')}>
          <Icon name="download" className="h-4 w-4" /> Export JSON
        </SmallButton>
        <SmallButton
          tone="danger"
          disabled={isEmpty(project) && !query.sources.length}
          onClick={() => {
            if (!window.confirm('Remove all tables, relationships and the query? You can undo this.')) return;
            apply(() => emptyProject());
            setSelectedTable(null);
          }}
        >
          Reset
        </SmallButton>
      </div>
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <div className="space-y-6">
        <Tabs
          tabs={TABS}
          active={tab}
          label="Builder views"
          onChange={(t) => {
            setTab(t);
            if (t !== 'reference') setSqlView(t === 'query' ? 'query' : 'schema');
          }}
        />

        {tab === 'query' && (
          <div role="tabpanel" id="panel-query" aria-labelledby="tab-query" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {isEmpty(project) ? (
              <EmptyState onSample={loadSample} onDesign={() => {
                  setTab('schema');
                  setSqlView('schema');
                }} />
            ) : (
              <QueryBuilder schema={schema} query={query} onChange={(fn, k) => apply((p) => ({ ...p, query: fn(p.query) }), k)} />
            )}
            <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
              <SqlPanel schema={schema} query={query} view={sqlView} onView={setSqlView} />
            </div>
          </div>
        )}

        {tab === 'schema' && (
          <div role="tabpanel" id="panel-schema" aria-labelledby="tab-schema" className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={addTable}>+ Add table</Button>
            </div>
            <SchemaCanvas
              schema={schema}
              selectedTableId={selectedTable}
              selectedRelationshipId={selectedRel}
              onSelectTable={setSelectedTable}
              onSelectRelationship={(id) => setSelectedRel(id)}
              onMove={(id, x, y, done) => {
                applyLive((p) => ({ ...p, schema: { ...p.schema, tables: p.schema.tables.map((t) => (t.id === id ? { ...t, x, y } : t)) } }));
                if (done) endGesture();
              }}
              onConnect={(a, b) => setDraft(draftFromConnect(schema, a, b))}
            />
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="min-w-0 space-y-6">
                <Section
                  title={table ? `Edit table: ${table.name || '(unnamed)'}` : 'Table editor'}
                  action={
                    schema.tables.length > 0 && (
                      <Select
                        label="Table"
                        value={table?.id}
                        placeholder="Choose a table…"
                        options={schema.tables.map((t) => ({ value: t.id, label: t.name || '(unnamed)' }))}
                        onChange={setSelectedTable}
                      />
                    )
                  }
                >
                  {table ? (
                    <TableEditor
                      schema={schema}
                      table={table}
                      onChange={(fn, k) => setSchema((s) => ({ ...s, tables: s.tables.map((t) => (t.id === table.id ? fn(t) : t)) }), k)}
                      onDuplicate={() => {
                        const copy = duplicateTable(schema, table);
                        setSchema((s) => ({ ...s, tables: [...s.tables, copy] }));
                        setSelectedTable(copy.id);
                      }}
                      onDelete={() => deleteTable(table)}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">{schema.tables.length ? 'Click a table on the canvas or choose one above to edit it.' : 'Add a table or load a sample schema.'}</p>
                  )}
                </Section>
                <RelationshipPanel schema={schema} draft={draft} onDraft={setDraft} onChange={setSchema} selectedId={selectedRel} onSelect={setSelectedRel} />
              </div>
              <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
                <SqlPanel schema={schema} query={query} view={sqlView} onView={setSqlView} />
              </div>
            </div>
          </div>
        )}

        {tab === 'reference' && (
          <div role="tabpanel" id="panel-reference" aria-labelledby="tab-reference">
            <Reference />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onSample, onDesign }: { onSample: (id: string) => void; onDesign: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 p-6 dark:border-slate-700">
      <p className="font-semibold text-slate-900 dark:text-white">No schema yet</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">Queries are built from your tables. Load a sample to explore, or design your own tables first.</p>
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <SmallButton key={s.id} onClick={() => onSample(s.id)}>
            {s.label}
          </SmallButton>
        ))}
      </div>
      <Button variant="secondary" onClick={onDesign}>
        Design tables
      </Button>
    </div>
  );
}
