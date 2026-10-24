// Reusable component schemas, each edited as JSON Schema text. A draft that isn't valid JSON (or
// isn't an object) stays local and shows its error; the document only changes on valid input.

import { useId, useState } from 'react';
import { parseJsonText } from '../../../shared/lib/textpos';
import { CodeArea } from '../../../shared/ui/tool';
import { child } from '../features/editing';
import { COMPONENT_NAME, asObject, isObject, type JsonObject } from '../features/openapi';
import { AddKeyRow, RemoveButton } from './fields';
import type { UpdateDoc } from './OperationEditor';

function SchemaJson({ name, schema, update }: { name: string; schema: unknown; update: UpdateDoc }) {
  const [draft, setDraft] = useState(() => JSON.stringify(schema, null, 2));
  const [error, setError] = useState<string | null>(null);
  const errorId = `${useId()}-error`;
  const onChange = (text: string) => {
    setDraft(text);
    const parsed = parseJsonText(text);
    if (!parsed.ok) return setError(`Line ${parsed.error.line}: ${parsed.error.message}`);
    if (!isObject(parsed.value)) return setError('A schema must be a JSON object.');
    setError(null);
    const value = parsed.value;
    update((d) => (child(child(d, 'components'), 'schemas')[name] = value));
  };
  return (
    <div className="space-y-1.5">
      <CodeArea
        label={`Schema ${name}`}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(14, Math.max(4, draft.split('\n').length))}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          Not applied: {error}
        </p>
      )}
    </div>
  );
}

export function SchemasEditor({ doc, update, version }: { doc: JsonObject; update: UpdateDoc; version: number }) {
  const [name, setName] = useState('');
  const schemas = asObject(asObject(doc.components).schemas);
  const trimmed = name.trim();
  const nameError = !COMPONENT_NAME.test(trimmed) ? 'Use letters, digits, ".", "-" or "_".' : Object.hasOwn(schemas, trimmed) ? `${trimmed} already exists.` : null;
  return (
    <div className="space-y-5">
      {Object.entries(schemas).map(([key, schema]) => (
        <div key={`${key}-${version}`} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <SchemaJson name={key} schema={schema} update={update} />
          </div>
          <div className="pt-6">
            <RemoveButton
              label={`Remove schema ${key}`}
              onClick={() =>
                update((d) => {
                  delete child(child(d, 'components'), 'schemas')[key];
                })
              }
            />
          </div>
        </div>
      ))}
      <AddKeyRow
        label="New schema name"
        value={name}
        onChange={setName}
        error={nameError}
        button="Add schema"
        onAdd={() => {
          update((d) => (child(child(d, 'components'), 'schemas')[trimmed] = { type: 'object', properties: {} }));
          setName('');
        }}
      />
    </div>
  );
}
