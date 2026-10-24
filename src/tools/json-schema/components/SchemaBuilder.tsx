// Visual Schema Builder UI component.
// Renders a property tree that maps to / from a JSON Schema draft 2020-12 document.
// Each property can be expanded to edit its constraints; nested objects and array
// items are handled recursively.

import { useId, useState } from 'react';
import {
  type PropertyNode,
  type JsonType,
  emptyNode,
  addProperty,
  removeProperty,
  updateProperty,
  moveProperty,
  exportSchema,
  fieldErrors,
  nameErrors,
  collectProblems,
} from '../features/schema-builder';
import { Button, Icon } from '../../../shared/ui/ui';
import { Checkbox } from '../../../shared/ui/convert';
import { Select } from '../../../shared/ui/Select';

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

const STRING_FORMATS = ['', 'date-time', 'date', 'time', 'email', 'ipv4', 'ipv6', 'uuid', 'uri', 'hostname'].map((f) => ({
  value: f,
  label: f || '(none)',
}));

const ICON_BUTTON =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:text-slate-500';
const FIELD =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 pointer-coarse:min-h-11 focus:border-slate-400 focus:outline-none aria-invalid:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-500';

// ---------------------------------------------------------------------------
// Small helpers

function FieldRow({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: React.ReactNode }) {
  const labelClass = 'pt-1.5 text-xs text-slate-500 dark:text-slate-400';
  return (
    <div className="grid grid-cols-[8rem_1fr] items-start gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      <div className="min-w-0">
        {children}
        {error && htmlFor && <FieldError id={`${htmlFor}-error`} message={error} />}
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1 break-words text-xs text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

/** Props that tie an input to the FieldError rendered under it. */
const invalidProps = (id: string, error?: string) =>
  error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  ariaLabel,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      {...invalidProps(id, error)}
      className={`${FIELD} ${className}`}
    />
  );
}

function NumericInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={FIELD}
    />
  );
}

function TypeSelect({ value, onChange }: { value: JsonType; onChange: (v: JsonType) => void }) {
  return <Select<JsonType> label="Type" options={JSON_TYPES} value={value} onChange={onChange} />;
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
  const uid = useId();
  const errors = fieldErrors(node);
  return (
    <div className="mt-2 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <FieldRow label="Description" htmlFor={`${uid}-description`}>
        <TextInput
          id={`${uid}-description`}
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
          <Select
            label="Format"
            options={STRING_FORMATS.some((f) => f.value === node.format) ? STRING_FORMATS : [...STRING_FORMATS, { value: node.format, label: node.format }]}
            value={node.format}
            onChange={(format) => onChange({ format })}
          />
          <FieldRow label="Min length" htmlFor={`${uid}-minLength`}>
            <NumericInput id={`${uid}-minLength`} value={node.minLength} onChange={(v) => onChange({ minLength: v })} placeholder="0" />
          </FieldRow>
          <FieldRow label="Max length" htmlFor={`${uid}-maxLength`}>
            <NumericInput id={`${uid}-maxLength`} value={node.maxLength} onChange={(v) => onChange({ maxLength: v })} placeholder="∞" />
          </FieldRow>
          <FieldRow label="Pattern" htmlFor={`${uid}-pattern`}>
            <TextInput
              id={`${uid}-pattern`}
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
          <FieldRow label="Minimum" htmlFor={`${uid}-minimum`}>
            <NumericInput id={`${uid}-minimum`} value={node.minimum} onChange={(v) => onChange({ minimum: v })} />
          </FieldRow>
          <FieldRow label="Maximum" htmlFor={`${uid}-maximum`}>
            <NumericInput id={`${uid}-maximum`} value={node.maximum} onChange={(v) => onChange({ maximum: v })} />
          </FieldRow>
          <FieldRow label="Excl. min" htmlFor={`${uid}-exclusiveMinimum`}>
            <NumericInput id={`${uid}-exclusiveMinimum`} value={node.exclusiveMinimum} onChange={(v) => onChange({ exclusiveMinimum: v })} />
          </FieldRow>
          <FieldRow label="Excl. max" htmlFor={`${uid}-exclusiveMaximum`}>
            <NumericInput id={`${uid}-exclusiveMaximum`} value={node.exclusiveMaximum} onChange={(v) => onChange({ exclusiveMaximum: v })} />
          </FieldRow>
          <FieldRow label="Multiple of" htmlFor={`${uid}-multipleOf`}>
            <NumericInput id={`${uid}-multipleOf`} value={node.multipleOf} onChange={(v) => onChange({ multipleOf: v })} />
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
          <FieldRow label="Min items" htmlFor={`${uid}-minItems`}>
            <NumericInput id={`${uid}-minItems`} value={node.minItems} onChange={(v) => onChange({ minItems: v })} placeholder="0" />
          </FieldRow>
          <FieldRow label="Max items" htmlFor={`${uid}-maxItems`}>
            <NumericInput id={`${uid}-maxItems`} value={node.maxItems} onChange={(v) => onChange({ maxItems: v })} placeholder="∞" />
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
      <FieldRow label="Enum values" htmlFor={`${uid}-enum`} error={errors.enumValues}>
        <textarea
          id={`${uid}-enum`}
          value={node.enumValues}
          onChange={(e) => onChange({ enumValues: e.target.value })}
          placeholder={'One JSON value per line:\n"red"\n"green"\n"blue"'}
          rows={3}
          {...invalidProps(`${uid}-enum`, errors.enumValues)}
          className={`${FIELD} resize-y font-mono text-xs`}
        />
      </FieldRow>

      <FieldRow label="Const" htmlFor={`${uid}-const`} error={errors.constValue}>
        <TextInput
          id={`${uid}-const`}
          value={node.constValue}
          onChange={(v) => onChange({ constValue: v })}
          placeholder='e.g. "admin" or 42'
          error={errors.constValue}
        />
      </FieldRow>

      <FieldRow label="Default" htmlFor={`${uid}-default`} error={errors.defaultValue}>
        <TextInput
          id={`${uid}-default`}
          value={node.defaultValue}
          onChange={(v) => onChange({ defaultValue: v })}
          placeholder='JSON value, e.g. "guest" or 0'
          error={errors.defaultValue}
        />
      </FieldRow>

      <ExtraKeywordsNote node={node} />
    </div>
  );
}

function ExtraKeywordsNote({ node }: { node: PropertyNode }) {
  const keys = Object.keys(node.extra);
  if (keys.length === 0) return null;
  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      <strong>Edit as JSON only:</strong> {keys.join(', ')}. Kept as-is in the generated schema.
    </p>
  );
}

// ---------------------------------------------------------------------------
// Single property row

function PropertyRow({
  node,
  label,
  depth,
  showRequired,
  nameError,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  node: PropertyNode;
  /** Names the row in its buttons' accessible names, e.g. "Remove property email". */
  label: string;
  depth: number;
  showRequired: boolean;
  nameError?: string;
  onUpdate: (patch: Partial<PropertyNode>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const nameId = `prop-name-${node.id}`;
  const opaque = node.opaqueSchema !== undefined;

  const handleChildPropsChange = (next: PropertyNode[]) => onUpdate({ properties: next });
  const handleItemsChange = (next: PropertyNode | null) => onUpdate({ items: next });

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 ${depth > 0 ? 'ml-4' : ''}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Expand toggle */}
        {!opaque && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`Constraints for ${label}`}
            onClick={() => setExpanded((v) => !v)}
            className={`${ICON_BUTTON} hover:text-slate-700 dark:hover:text-slate-300`}
          >
            <Icon name="chevron-right" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}

        {/* Name (items schemas have none) */}
        {showRequired && (
          <TextInput
            id={nameId}
            value={node.name}
            onChange={(v) => onUpdate({ name: v })}
            placeholder="property name"
            ariaLabel="Property name"
            error={nameError}
            className="max-w-[12rem] flex-1"
          />
        )}

        {/* Type */}
        {opaque ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Edit as JSON only
          </span>
        ) : (
          <TypeSelect value={node.type} onChange={(v) => onUpdate({ type: v, items: null, properties: [] })} />
        )}

        {/* Required toggle */}
        {showRequired && (
          <button
            type="button"
            aria-pressed={node.required}
            aria-label={`Required ${label}`}
            onClick={() => onUpdate({ required: !node.required })}
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors pointer-coarse:min-h-11 ${
              node.required
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {node.required ? 'Required' : 'Optional'}
          </button>
        )}

        {/* Reorder + remove */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={`Move up ${label}`}
            onClick={onMoveUp}
            className={`${ICON_BUTTON} hover:text-slate-700 dark:hover:text-slate-300`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 15l7-7 7 7" /></svg>
          </button>
          <button
            type="button"
            aria-label={`Move down ${label}`}
            onClick={onMoveDown}
            className={`${ICON_BUTTON} hover:text-slate-700 dark:hover:text-slate-300`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button
            type="button"
            aria-label={`Remove ${showRequired ? 'property ' : ''}${label}`}
            onClick={onRemove}
            className={`${ICON_BUTTON} hover:text-red-600 dark:hover:text-red-400`}
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {nameError && <FieldError id={`${nameId}-error`} message={nameError} />}

      {/* Expandable detail */}
      {expanded && !opaque && (
        <PropertyDetail node={node} onChange={onUpdate} />
      )}

      {/* Nested object properties */}
      {node.type === 'object' && !opaque && (
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
      {node.type === 'array' && !opaque && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">items schema</p>
          {node.items ? (
            <div className="space-y-2">
              <PropertyRow
                node={node.items}
                label={`items of ${label}`}
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
  const errors = nameErrors(properties);
  return (
    <div className="space-y-2">
      {properties.map((p) => (
        <PropertyRow
          key={p.id}
          node={p}
          label={p.name || 'unnamed property'}
          depth={depth}
          showRequired={true}
          nameError={errors[p.id]}
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
  const descriptionId = useId();
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Root schema</h3>
      <div className="flex flex-wrap items-center gap-3">
        <TypeSelect value={node.type} onChange={(v) => onUpdate({ type: v, items: null, properties: [] })} />
        {node.type === 'object' && (
          <div className="flex items-center gap-2">
            <Checkbox
              label="Allow additional properties"
              checked={node.additionalProperties}
              onChange={(v) => onUpdate({ additionalProperties: v })}
            />
          </div>
        )}
      </div>
      <div>
        <label htmlFor={descriptionId} className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Description (optional)</label>
        <TextInput
          id={descriptionId}
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
              label="root items"
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
  const problems = collectProblems(root);

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
        {problems.length > 0 && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
            <p className="font-medium">Left out of the generated schema until fixed:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {problems.map((problem, i) => (
                <li key={i} className="break-words">{problem}</li>
              ))}
            </ul>
          </div>
        )}
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
