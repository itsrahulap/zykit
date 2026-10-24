// Visual Schema Builder UI component.
// Renders a property tree that maps to / from a JSON Schema draft 2020-12 document.
// Each property can be expanded to edit its constraints; nested objects and array
// items are handled recursively.

import { useState } from 'react';
import {
  type PropertyNode,
  type JsonType,
  emptyNode,
  addProperty,
  removeProperty,
  updateProperty,
  moveProperty,
  exportSchema,
} from '../features/schema-builder';
import { Button, Icon } from '../../../shared/ui/ui';
import { Checkbox } from '../../../shared/ui/convert';

// ---------------------------------------------------------------------------
// Constants

const JSON_TYPES: { value: JsonType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'integer', label: 'integer' },
  { value: 'boolean', label: 'boolean' },
  { value: 'null', label: 'null' },
  { value: 'object', label: 'object' },
  { value: 'array', label: 'array' },
];

const STRING_FORMATS = ['', 'date-time', 'date', 'time', 'email', 'ipv4', 'ipv6', 'uuid', 'uri', 'hostname'];

// ---------------------------------------------------------------------------
// Small helpers

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-start gap-2">
      <span className="pt-1.5 text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-500 ${className}`}
    />
  );
}

function NumericInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-500"
    />
  );
}

function TypeSelect({ value, onChange }: { value: JsonType; onChange: (v: JsonType) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as JsonType)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      {JSON_TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Property constraints panel (expanded detail)

function PropertyDetail({
  node,
  onChange,
}: {
  node: PropertyNode;
  onChange: (patch: Partial<PropertyNode>) => void;
}) {
  return (
    <div className="mt-2 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <FieldRow label="Description">
        <TextInput
          value={node.description}
          onChange={(v) => onChange({ description: v })}
          placeholder="Optional description"
        />
      </FieldRow>

      <FieldRow label="Nullable">
        <Checkbox
          label="Allow null in addition to the type above"
          checked={node.nullable}
          onChange={(v) => onChange({ nullable: v })}
        />
      </FieldRow>

      {/* String-specific */}
      {(node.type === 'string') && (
        <>
          <FieldRow label="Format">
            <select
              value={node.format}
              onChange={(e) => onChange({ format: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {STRING_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f || '(none)'}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Min length">
            <NumericInput value={node.minLength} onChange={(v) => onChange({ minLength: v })} placeholder="0" />
          </FieldRow>
          <FieldRow label="Max length">
            <NumericInput value={node.maxLength} onChange={(v) => onChange({ maxLength: v })} placeholder="∞" />
          </FieldRow>
          <FieldRow label="Pattern">
            <TextInput
              value={node.pattern}
              onChange={(v) => onChange({ pattern: v })}
              placeholder="^[A-Z].*$"
            />
          </FieldRow>
        </>
      )}

      {/* Number / integer */}
      {(node.type === 'number' || node.type === 'integer') && (
        <>
          <FieldRow label="Minimum">
            <NumericInput value={node.minimum} onChange={(v) => onChange({ minimum: v })} />
          </FieldRow>
          <FieldRow label="Maximum">
            <NumericInput value={node.maximum} onChange={(v) => onChange({ maximum: v })} />
          </FieldRow>
          <FieldRow label="Excl. min">
            <NumericInput value={node.exclusiveMinimum} onChange={(v) => onChange({ exclusiveMinimum: v })} />
          </FieldRow>
          <FieldRow label="Excl. max">
            <NumericInput value={node.exclusiveMaximum} onChange={(v) => onChange({ exclusiveMaximum: v })} />
          </FieldRow>
          <FieldRow label="Multiple of">
            <NumericInput value={node.multipleOf} onChange={(v) => onChange({ multipleOf: v })} />
          </FieldRow>
        </>
      )}

      {/* Object */}
      {node.type === 'object' && (
        <FieldRow label="Extra props">
          <Checkbox
            label="Allow additional properties"
            checked={node.additionalProperties}
            onChange={(v) => onChange({ additionalProperties: v })}
          />
        </FieldRow>
      )}

      {/* Array */}
      {node.type === 'array' && (
        <>
          <FieldRow label="Min items">
            <NumericInput value={node.minItems} onChange={(v) => onChange({ minItems: v })} placeholder="0" />
          </FieldRow>
          <FieldRow label="Max items">
            <NumericInput value={node.maxItems} onChange={(v) => onChange({ maxItems: v })} placeholder="∞" />
          </FieldRow>
          <FieldRow label="Unique items">
            <Checkbox
              label="Require unique items"
              checked={node.uniqueItems}
              onChange={(v) => onChange({ uniqueItems: v })}
            />
          </FieldRow>
        </>
      )}

      {/* Enum / const */}
      <FieldRow label="Enum values">
        <textarea
          value={node.enumValues}
          onChange={(e) => onChange({ enumValues: e.target.value })}
          placeholder={'One JSON value per line:\n"red"\n"green"\n"blue"'}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </FieldRow>

      <FieldRow label="Const">
        <TextInput
          value={node.constValue}
          onChange={(v) => onChange({ constValue: v })}
          placeholder='e.g. "admin" or 42'
        />
      </FieldRow>

      {node.unsupportedKeys.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <strong>Edit as JSON only:</strong> {node.unsupportedKeys.join(', ')}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single property row

function PropertyRow({
  node,
  depth,
  showRequired,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  node: PropertyNode;
  depth: number;
  showRequired: boolean;
  onUpdate: (patch: Partial<PropertyNode>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleChildPropsChange = (next: PropertyNode[]) => onUpdate({ properties: next });
  const handleItemsChange = (next: PropertyNode | null) => onUpdate({ items: next });

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 ${depth > 0 ? 'ml-4' : ''}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Expand toggle */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse constraints' : 'Expand constraints'}
          onClick={() => setExpanded((v) => !v)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <Icon name="chevron-right" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Name */}
        <TextInput
          id={`prop-name-${node.id}`}
          value={node.name}
          onChange={(v) => onUpdate({ name: v })}
          placeholder="property name"
          className="max-w-[12rem] flex-1"
        />

        {/* Type */}
        <TypeSelect value={node.type} onChange={(v) => onUpdate({ type: v, items: null, properties: [] })} />

        {/* Required toggle */}
        {showRequired && (
          <button
            type="button"
            title={node.required ? 'Required — click to make optional' : 'Optional — click to make required'}
            onClick={() => onUpdate({ required: !node.required })}
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
              node.required
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {node.required ? 'required' : 'optional'}
          </button>
        )}

        {/* Reorder + remove */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Move up"
            onClick={onMoveUp}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 15l7-7 7 7" /></svg>
          </button>
          <button
            type="button"
            aria-label="Move down"
            onClick={onMoveDown}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button
            type="button"
            aria-label="Remove property"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable detail */}
      {expanded && (
        <PropertyDetail node={node} onChange={onUpdate} />
      )}

      {/* Nested object properties */}
      {node.type === 'object' && (
        <div className="mt-3 space-y-2">
          <PropertyList
            properties={node.properties}
            depth={depth + 1}
            onChange={handleChildPropsChange}
          />
          <Button
            variant="ghost"
            onClick={() => onUpdate({ properties: addProperty(node.properties) })}
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Add property
          </Button>
        </div>
      )}

      {/* Array items schema */}
      {node.type === 'array' && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">items schema</p>
          {node.items ? (
            <div className="space-y-2">
              <PropertyRow
                node={node.items}
                depth={depth + 1}
                showRequired={false}
                onUpdate={(patch) => handleItemsChange({ ...node.items!, ...patch })}
                onRemove={() => handleItemsChange(null)}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => handleItemsChange(emptyNode('', 'string'))}
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              Set items schema
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property list (recurse)

function PropertyList({
  properties,
  depth = 0,
  onChange,
}: {
  properties: PropertyNode[];
  depth?: number;
  onChange: (next: PropertyNode[]) => void;
}) {
  if (properties.length === 0) return null;
  return (
    <div className="space-y-2">
      {properties.map((p) => (
        <PropertyRow
          key={p.id}
          node={p}
          depth={depth}
          showRequired={true}
          onUpdate={(patch) => onChange(updateProperty(properties, p.id, patch))}
          onRemove={() => onChange(removeProperty(properties, p.id))}
          onMoveUp={() => onChange(moveProperty(properties, p.id, 'up'))}
          onMoveDown={() => onChange(moveProperty(properties, p.id, 'down'))}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root schema settings (type, additionalProperties, description of the whole schema)

function RootSettings({
  node,
  onUpdate,
}: {
  node: PropertyNode;
  onUpdate: (patch: Partial<PropertyNode>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Root schema</h3>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Type</label>
          <TypeSelect value={node.type} onChange={(v) => onUpdate({ type: v, items: null, properties: [] })} />
        </div>
        {node.type === 'object' && (
          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              label="Allow additional properties"
              checked={node.additionalProperties}
              onChange={(v) => onUpdate({ additionalProperties: v })}
            />
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Description (optional)</label>
        <TextInput
          value={node.description}
          onChange={(v) => onUpdate({ description: v })}
          placeholder="Describe the schema"
        />
      </div>

      {node.type === 'string' && <PropertyDetail node={node} onChange={onUpdate} />}
      {(node.type === 'number' || node.type === 'integer') && <PropertyDetail node={node} onChange={onUpdate} />}
      {node.type === 'array' && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">items schema</p>
          {node.items ? (
            <PropertyRow
              node={node.items}
              depth={0}
              showRequired={false}
              onUpdate={(patch) => onUpdate({ items: { ...node.items!, ...patch } })}
              onRemove={() => onUpdate({ items: null })}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
            />
          ) : (
            <Button variant="ghost" onClick={() => onUpdate({ items: emptyNode('', 'string') })}>
              <span aria-hidden="true" className="text-base leading-none">+</span>
              Set items schema
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component

export interface SchemaBuilderProps {
  root: PropertyNode;
  onRootChange: (next: PropertyNode) => void;
}

export function SchemaBuilder({ root, onRootChange }: SchemaBuilderProps) {
  const update = (patch: Partial<PropertyNode>) => onRootChange({ ...root, ...patch });

  // Derive the live JSON output
  const schemaJson = JSON.stringify(exportSchema(root), null, 2);

  return (
    <div className="space-y-4">
      <RootSettings node={root} onUpdate={update} />

      {root.type === 'object' && (
        <section aria-label="Properties">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Properties</h3>
            <Button variant="secondary" onClick={() => update({ properties: addProperty(root.properties) })}>
              <Icon name="plus" className="h-3.5 w-3.5" />
              Add property
            </Button>
          </div>
          {root.properties.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
              No properties yet. Click <strong>Add property</strong> to start.
            </p>
          ) : (
            <PropertyList
              properties={root.properties}
              onChange={(next) => update({ properties: next })}
            />
          )}
        </section>
      )}

      {/* Live schema output */}
      <section aria-label="Generated schema" className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Generated schema</h3>
        <pre
          tabIndex={0}
          role="region"
          aria-label="Generated JSON Schema"
          className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {schemaJson}
        </pre>
      </section>
    </div>
  );
}
