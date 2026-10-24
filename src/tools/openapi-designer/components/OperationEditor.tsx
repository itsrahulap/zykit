// Form for one operation: summary, id, tags, parameters, request body and responses.
// Anything it doesn't edit (custom schemas, $ref'd parameters, extra fields) is kept as is.

import { useState } from 'react';
import { Select } from '../../../shared/ui/Select';
import { Checkbox } from '../../../shared/ui/convert';
import { Badge } from '../../../shared/ui/ui';
import { child, choiceToSchema, list, schemaChoices, schemaToChoice, setField, type SchemaChoice } from '../features/editing';
import { firstMedia } from '../features/examples';
import { PARAMETER_LOCATIONS, asObject, isObject, type HttpMethod, type JsonObject } from '../features/openapi';
import { AddButton, AddKeyRow, RemoveButton, TextField, smallLabel } from './fields';

export type UpdateDoc = (recipe: (draft: JsonObject) => void) => void;

const STATUS = /^([1-5](\d\d|XX)|default)$/;

function SchemaSelect({ label, schema, names, allowNone, onChange }: { label: string; schema: unknown; names: string[]; allowNone?: boolean; onChange: (s: JsonObject | undefined) => void }) {
  const current = schemaToChoice(schema);
  return (
    <div className="min-w-0 flex-1 basis-40">
      <Select<SchemaChoice>
        label={label}
        options={schemaChoices(names, current, !!allowNone)}
        value={current}
        onChange={(choice) => choice !== 'custom' && onChange(choiceToSchema(choice))}
      />
    </div>
  );
}

/** Sets the schema of the first media type in `content` (creating `fallbackType` when there is none). */
function setMediaSchema(owner: JsonObject, schema: JsonObject | undefined, fallbackType = 'application/json') {
  if (!schema) {
    delete owner.content;
    return;
  }
  const media = firstMedia(owner.content);
  const content = child(owner, 'content');
  child(content, media?.type ?? fallbackType).schema = schema;
}

function renameMedia(owner: JsonObject, from: string, to: string) {
  const content = asObject(owner.content);
  owner.content = Object.fromEntries(Object.entries(content).map(([k, v]) => [k === from ? to : k, v]));
}

export function OperationEditor({
  path,
  method,
  operation,
  tagNames,
  schemaNames,
  update,
}: {
  path: string;
  method: HttpMethod;
  operation: JsonObject;
  tagNames: string[];
  schemaNames: string[];
  update: UpdateDoc;
}) {
  const [status, setStatus] = useState('');
  const label = `${method.toUpperCase()} ${path}`;
  const edit = (recipe: (op: JsonObject) => void) => update((d) => recipe(child(child(child(d, 'paths'), path), method)));

  const opTags = Array.isArray(operation.tags) ? operation.tags.filter((t): t is string => typeof t === 'string') : [];
  const allTags = [...new Set([...tagNames, ...opTags])];
  const params = Array.isArray(operation.parameters) ? operation.parameters : [];
  const bodyIsRef = isObject(operation.requestBody) && typeof operation.requestBody.$ref === 'string';
  const body = asObject(operation.requestBody);
  const bodyMedia = firstMedia(body.content);
  const responses = asObject(operation.responses);
  const statusError = Object.hasOwn(responses, status.trim()) ? `Response ${status.trim()} already exists.` : STATUS.test(status.trim()) ? null : 'Use a status like 200, 4XX or default.';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <TextField label="Summary" value={operation.summary} onChange={(v) => edit((op) => setField(op, 'summary', v))} />
        <TextField label="operationId" value={operation.operationId} onChange={(v) => edit((op) => setField(op, 'operationId', v))} mono />
      </div>
      <TextField label="Description" value={operation.description} onChange={(v) => edit((op) => setField(op, 'description', v))} className="block" />
      {allTags.length > 0 && (
        <fieldset>
          <legend className={smallLabel}>Tags</legend>
          <div className="flex flex-wrap gap-x-5">
            {allTags.map((t) => (
              <Checkbox
                key={t}
                label={t}
                checked={opTags.includes(t)}
                onChange={(on) => edit((op) => setField(op, 'tags', on ? [...opTags, t] : opTags.filter((x) => x !== t).length ? opTags.filter((x) => x !== t) : undefined))}
              />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200">Parameters</legend>
        {params.map((raw, i) => {
          const p = asObject(raw);
          const remove = <RemoveButton label={`Remove parameter ${String(p.name ?? p.$ref ?? i + 1)} from ${label}`} onClick={() => edit((op) => list(op, 'parameters').splice(i, 1))} />;
          if (typeof p.$ref === 'string')
            return (
              <div key={i} className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="min-w-0 break-all font-mono">$ref {p.$ref}</span>
                {remove}
              </div>
            );
          const set = (recipe: (param: JsonObject) => void) => edit((op) => recipe(asObject(list(op, 'parameters')[i])));
          return (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
              <TextField label="Name" value={p.name} onChange={(v) => set((param) => (param.name = v))} mono className="min-w-0 flex-1 basis-28" />
              <div className="w-28">
                <Select
                  label="In"
                  options={PARAMETER_LOCATIONS.map((l) => ({ value: l, label: l }))}
                  value={String(p.in)}
                  onChange={(v) =>
                    set((param) => {
                      param.in = v;
                      if (v === 'path') param.required = true;
                    })
                  }
                />
              </div>
              <SchemaSelect label="Schema" schema={p.schema} names={schemaNames} onChange={(s) => set((param) => setField(param, 'schema', s))} />
              <Checkbox label="Required" checked={p.required === true} onChange={(on) => set((param) => setField(param, 'required', on || undefined))} />
              {remove}
            </div>
          );
        })}
        <AddButton onClick={() => edit((op) => list(op, 'parameters').push({ name: '', in: 'query', schema: { type: 'string' } }))}>Add parameter</AddButton>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200">Request body</legend>
        {bodyIsRef ? (
          <p className="break-all font-mono text-sm text-slate-700 dark:text-slate-300">$ref {String(body.$ref)} (kept as is)</p>
        ) : (
          <>
            <Checkbox
              label="Has a request body"
              checked={operation.requestBody !== undefined}
              onChange={(on) => edit((op) => setField(op, 'requestBody', on ? { content: { 'application/json': { schema: { type: 'object' } } } } : undefined))}
            />
            {operation.requestBody !== undefined && (
              <div className="flex flex-wrap items-end gap-2">
                <TextField label="Media type" value={bodyMedia?.type ?? ''} onChange={(v) => edit((op) => renameMedia(child(op, 'requestBody'), bodyMedia?.type ?? '', v))} mono />
                <SchemaSelect label="Body schema" schema={bodyMedia?.schema} names={schemaNames} onChange={(s) => edit((op) => setMediaSchema(child(op, 'requestBody'), s))} />
                <Checkbox label="Required body" checked={body.required === true} onChange={(on) => edit((op) => setField(child(op, 'requestBody'), 'required', on || undefined))} />
              </div>
            )}
          </>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200">Responses</legend>
        {Object.entries(responses).map(([code, raw]) => {
          const r = asObject(raw);
          const remove = (
            <RemoveButton
              label={`Remove response ${code} from ${label}`}
              onClick={() =>
                edit((op) => {
                  delete child(op, 'responses')[code];
                })
              }
            />
          );
          const media = firstMedia(r.content);
          return (
            <div key={code} className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
              <Badge tone={code.startsWith('2') ? 'green' : code.startsWith('4') || code.startsWith('5') ? 'red' : 'neutral'}>{code}</Badge>
              {typeof r.$ref === 'string' ? (
                <span className="min-w-0 flex-1 break-all font-mono text-sm text-slate-700 dark:text-slate-300">$ref {r.$ref}</span>
              ) : (
                <>
                  <TextField label={`Description (${code})`} value={r.description} onChange={(v) => edit((op) => (child(child(op, 'responses'), code).description = v))} />
                  <SchemaSelect label={`Body (${code})`} schema={media?.schema} names={schemaNames} allowNone onChange={(s) => edit((op) => setMediaSchema(child(child(op, 'responses'), code), s))} />
                </>
              )}
              {remove}
            </div>
          );
        })}
        <AddKeyRow
          label="New response status"
          value={status}
          onChange={setStatus}
          error={statusError}
          button="Add response"
          onAdd={() => {
            const code = status.trim();
            edit((op) => (child(op, 'responses')[code] = { description: code === 'default' ? 'Unexpected error' : 'Response' }));
            setStatus('');
          }}
        />
      </fieldset>
    </div>
  );
}
