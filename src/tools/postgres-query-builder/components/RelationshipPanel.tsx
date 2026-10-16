// Relationships: list/edit/remove existing foreign keys, add a new one (prefilled when columns are
// connected on the canvas), and create a junction table for many-to-many.

import { useState } from 'react';
import { relationshipErrors } from '../features/ddl';
import { ON_DELETE, findColumn, findTable, newId, type Relationship, type RelationshipKind, type Schema, type Table } from '../features/model';
import { emptyDraft, junctionTable, type RelationshipDraft } from '../features/project';
import { Choice, IconButton, Problems, Section, SmallButton } from './fields';

const KINDS: { value: RelationshipKind; label: string }[] = [
  { value: 'one-to-many', label: 'One-to-many' },
  { value: 'one-to-one', label: 'One-to-one' },
];

interface Props {
  schema: Schema;
  draft: RelationshipDraft;
  onDraft: (d: RelationshipDraft) => void;
  onChange: (fn: (s: Schema) => Schema) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function RelationshipPanel({ schema, draft, onDraft, onChange, selectedId, onSelect }: Props) {
  const [junction, setJunction] = useState({ a: '', b: '', error: '' });
  const tableOpts = schema.tables.map((t) => ({ value: t.id, label: t.name || '(unnamed)' }));
  const colOpts = (t: Table | undefined) => (t?.columns ?? []).map((c) => ({ value: c.id, label: `${c.name || '(unnamed)'} (${c.type.toLowerCase()})` }));
  const label = (r: Pick<Relationship, 'fromTableId' | 'fromColumnId' | 'toTableId' | 'toColumnId'>) => {
    const ft = findTable(schema, r.fromTableId);
    const tt = findTable(schema, r.toTableId);
    return `${ft?.name}.${findColumn(ft, r.fromColumnId)?.name} → ${tt?.name}.${findColumn(tt, r.toColumnId)?.name}`;
  };
  const draftComplete = draft.fromTableId && draft.fromColumnId && draft.toTableId && draft.toColumnId;
  const draftErrors = draftComplete ? relationshipErrors(schema, { ...draft, id: 'draft' }) : [];
  const duplicate = schema.relationships.some((r) => r.fromTableId === draft.fromTableId && r.fromColumnId === draft.fromColumnId && r.toTableId === draft.toTableId && r.toColumnId === draft.toColumnId);
  const update = (id: string, patch: Partial<Relationship>) => onChange((s) => ({ ...s, relationships: s.relationships.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const addJunction = () => {
    const res = junctionTable(schema, junction.a, junction.b);
    if ('error' in res) return setJunction({ ...junction, error: res.error });
    onChange((s) => ({ tables: [...s.tables, res.table], relationships: [...s.relationships, ...res.relationships] }));
    setJunction({ a: '', b: '', error: '' });
  };

  return (
    <div className="space-y-4">
      <Section title="Relationships">
        {!schema.relationships.length && <p className="text-sm text-slate-500">No relationships yet. Add one below, or use the connect dots on the canvas.</p>}
        <ul className="space-y-2">
          {schema.relationships.map((r) => {
            const errs = relationshipErrors(schema, r);
            return (
              <li
                key={r.id}
                className={`space-y-2 rounded-xl border p-3 ${r.id === selectedId ? 'border-emerald-600' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button type="button" className="min-w-0 truncate text-left font-mono text-sm" onClick={() => onSelect(r.id === selectedId ? null : r.id)} aria-pressed={r.id === selectedId}>
                    {label(r)}
                  </button>
                  <IconButton label={`Remove relationship ${label(r)}`} icon="x" onClick={() => onChange((s) => ({ ...s, relationships: s.relationships.filter((x) => x.id !== r.id) }))} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Choice label="Kind" value={r.kind} options={KINDS} onChange={(kind) => update(r.id, { kind })} />
                  <Choice label="On delete" value={r.onDelete} options={ON_DELETE.map((o) => ({ value: o, label: `On delete: ${o}` }))} onChange={(onDelete) => update(r.id, { onDelete })} />
                </div>
                <Problems items={errs} title="This relationship can't be generated" />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Add a relationship">
        <p className="text-sm text-slate-600 dark:text-slate-400">The foreign key column (in the child table) references a primary key or unique column (in the parent table).</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice label="Child table" hideLabel={false} value={draft.fromTableId} options={tableOpts} onChange={(fromTableId) => onDraft({ ...draft, fromTableId, fromColumnId: '' })} />
          <Choice label="Foreign key column" hideLabel={false} value={draft.fromColumnId} options={colOpts(findTable(schema, draft.fromTableId))} onChange={(fromColumnId) => onDraft({ ...draft, fromColumnId })} />
          <Choice label="Parent table" hideLabel={false} value={draft.toTableId} options={tableOpts} onChange={(toTableId) => onDraft({ ...draft, toTableId, toColumnId: findTable(schema, toTableId)?.columns.find((c) => c.primaryKey)?.id ?? '' })} />
          <Choice label="Referenced column" hideLabel={false} value={draft.toColumnId} options={colOpts(findTable(schema, draft.toTableId))} onChange={(toColumnId) => onDraft({ ...draft, toColumnId })} />
          <Choice label="Kind" hideLabel={false} value={draft.kind} options={KINDS} onChange={(kind) => onDraft({ ...draft, kind })} />
          <Choice label="On delete" hideLabel={false} value={draft.onDelete} options={ON_DELETE} onChange={(onDelete) => onDraft({ ...draft, onDelete })} />
        </div>
        <Problems items={duplicate ? ['This relationship already exists.'] : draftErrors} title="Can't add this relationship yet" />
        <div className="flex gap-2">
          <SmallButton
            disabled={!draftComplete || duplicate || draftErrors.length > 0}
            onClick={() => {
              onChange((s) => ({ ...s, relationships: [...s.relationships, { ...draft, id: newId('r') }] }));
              onDraft(emptyDraft());
            }}
          >
            Add relationship
          </SmallButton>
          {draft.fromTableId && <SmallButton onClick={() => onDraft(emptyDraft())}>Clear</SmallButton>}
        </div>
      </Section>

      <Section title="Many-to-many">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          PostgreSQL stores many-to-many links in a junction table with a foreign key to each side. Pick two tables (each with a single-column primary key) to create one.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Choice label="First table" hideLabel={false} value={junction.a} options={tableOpts} onChange={(a) => setJunction({ ...junction, a, error: '' })} />
          <Choice label="Second table" hideLabel={false} value={junction.b} options={tableOpts} onChange={(b) => setJunction({ ...junction, b, error: '' })} />
          <SmallButton disabled={!junction.a || !junction.b} onClick={addJunction}>
            Create junction table
          </SmallButton>
        </div>
        {junction.error && <Problems items={[junction.error]} title="Can't create the junction table" />}
      </Section>
    </div>
  );
}
