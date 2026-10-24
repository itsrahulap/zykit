// Edits the selected node, edge or group without a pointer: label, kind, size and new edges.

import { useId, type ReactNode } from 'react';
import type { Selection } from '../features/diagram';
import { KIND_LABELS, LIMITS, NODE_KINDS, type Diagram, type NodeKind } from '../features/model';
import { Select } from '../../../shared/ui/Select';
import { Button, Icon } from '../../../shared/ui/ui';

const inputClass =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children(id)}
    </div>
  );
}

export function PropertiesPanel({
  diagram,
  selection,
  onSelect,
  onNodeChange,
  onEdgeChange,
  onGroupChange,
  onConnect,
  onDelete,
}: {
  diagram: Diagram;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onNodeChange: (id: string, patch: { label?: string; kind?: NodeKind }) => void;
  onEdgeChange: (id: string, label: string) => void;
  onGroupChange: (id: string, patch: { label?: string; width?: number; height?: number }) => void;
  onConnect: (from: string, to: string) => void;
  onDelete: (s: NonNullable<Selection>) => void;
}) {
  const nameOf = (id: string) => diagram.nodes.find((n) => n.id === id)?.label || id;
  const node = selection?.type === 'node' ? diagram.nodes.find((n) => n.id === selection.id) : undefined;
  const edge = selection?.type === 'edge' ? diagram.edges.find((e) => e.id === selection.id) : undefined;
  const group = selection?.type === 'group' ? diagram.groups.find((g) => g.id === selection.id) : undefined;

  const deleteButton = (s: NonNullable<Selection>, what: string) => (
    <Button variant="secondary" onClick={() => onDelete(s)} className="w-full">
      <Icon name="x" className="h-4 w-4" /> Delete {what}
    </Button>
  );

  let body: ReactNode;
  if (node) {
    const connected = diagram.edges.filter((e) => e.from === node.id || e.to === node.id);
    const targets = diagram.nodes.filter((n) => n.id !== node.id && !diagram.edges.some((e) => e.from === node.id && e.to === n.id));
    body = (
      <>
        <Field label="Node label">
          {(id) => <input id={id} className={inputClass} value={node.label} maxLength={LIMITS.label} onChange={(e) => onNodeChange(node.id, { label: e.target.value })} />}
        </Field>
        <Select label="Kind" options={NODE_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))} value={node.kind} onChange={(kind) => onNodeChange(node.id, { kind })} />
        {targets.length > 0 && (
          <Select label="Add an edge to" placeholder="Choose a node…" options={targets.map((n) => ({ value: n.id, label: n.label || n.id }))} onChange={(to) => onConnect(node.id, to)} />
        )}
        {connected.length > 0 && (
          <div>
            <h3 className={labelClass}>Edges</h3>
            <ul className="space-y-1">
              {connected.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onSelect({ type: 'edge', id: e.id })}
                    className="w-full break-words rounded-lg px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-100 pointer-coarse:min-h-11 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {nameOf(e.from)} → {nameOf(e.to)}
                    {e.label ? ` (${e.label})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {deleteButton({ type: 'node', id: node.id }, 'node')}
      </>
    );
  } else if (edge) {
    body = (
      <>
        <p className="break-words text-sm text-slate-700 dark:text-slate-300">
          {nameOf(edge.from)} → {nameOf(edge.to)}
        </p>
        <Field label="Edge label">
          {(id) => <input id={id} className={inputClass} value={edge.label} maxLength={LIMITS.label} onChange={(e) => onEdgeChange(edge.id, e.target.value)} />}
        </Field>
        {deleteButton({ type: 'edge', id: edge.id }, 'edge')}
      </>
    );
  } else if (group) {
    const size = (key: 'width' | 'height') => (
      <Field label={key === 'width' ? 'Width' : 'Height'}>
        {(id) => (
          <input
            id={id}
            type="number"
            min={LIMITS.minGroupSize}
            max={LIMITS.maxGroupSize}
            step={10}
            className={inputClass}
            // Committed on blur/Enter: clamping each keystroke would turn "3" (of "300") into the minimum.
            key={`${group.id}-${group[key]}`}
            defaultValue={group[key]}
            onBlur={(e) => e.target.valueAsNumber !== group[key] && Number.isFinite(e.target.valueAsNumber) && onGroupChange(group.id, { [key]: e.target.valueAsNumber })}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        )}
      </Field>
    );
    body = (
      <>
        <Field label="Group label">
          {(id) => <input id={id} className={inputClass} value={group.label} maxLength={LIMITS.label} onChange={(e) => onGroupChange(group.id, { label: e.target.value })} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {size('width')}
          {size('height')}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Nodes whose centre is inside the group move with it. Deleting the group keeps its nodes.</p>
        {deleteButton({ type: 'group', id: group.id }, 'group')}
      </>
    );
  } else {
    body = (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Select a node, edge or group (click it, or Tab to it on the canvas) to edit it here. Edges can be added from a node’s properties or with Connect mode.
      </p>
    );
  }

  return (
    <section aria-label="Properties" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="eyebrow text-slate-600 dark:text-slate-400">Properties</h2>
      {body}
    </section>
  );
}
