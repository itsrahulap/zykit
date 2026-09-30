import { useDeferredValue, useMemo, useState } from 'react';
import jsonSchema from './index';
import { inferSchema, type Draft } from './features/json-schema';
import { TIMEOUT_MS, useValidation } from './hooks/useValidation';
import { parseJson } from '../json-formatter/features/json';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type DraftChoice = Draft | 'auto';
const SCHEMA_ID = 'json-schema-schema';
const JSON_ID = 'json-schema-instance';

const SAMPLE_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": { "type": "integer", "minimum": 1 },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "tags": { "type": "array", "items": { "type": "string" }, "uniqueItems": true },
    "address": { "$ref": "#/$defs/address" }
  },
  "required": ["id", "name", "email"],
  "additionalProperties": false,
  "$defs": {
    "address": {
      "type": "object",
      "properties": { "city": { "type": "string" }, "zip": { "type": "string", "pattern": "^[0-9]{5}$" } },
      "required": ["city"]
    }
  }
}`;

const SAMPLE_JSON = `{
  "id": 0,
  "name": "Ada",
  "email": "ada.example.com",
  "tags": ["math", "math"],
  "address": { "zip": "1234" },
  "nickname": "Countess"
}`;

const pathLabel = (p: string) => (p === '' ? '(root)' : p);

export default function JsonSchemaPage() {
  const [schemaText, setSchemaText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [draft, setDraft] = useState<DraftChoice>('auto');
  const [assertFormat, setAssertFormat] = useState(true);
  const [generated, setGenerated] = useState(false);

  const schemaDeferred = useDeferredValue(schemaText);
  const jsonDeferred = useDeferredValue(jsonText);
  const schemaParsed = useMemo(() => (schemaDeferred.trim() ? parseJson(schemaDeferred) : null), [schemaDeferred]);
  const jsonParsed = useMemo(() => (jsonDeferred.trim() ? parseJson(jsonDeferred) : null), [jsonDeferred]);
  const state = useValidation(schemaParsed?.ok ? schemaDeferred : null, jsonParsed?.ok ? jsonDeferred : null, draft, assertFormat);
  const result = state.status === 'done' ? state.result : null;

  const errorsText = useMemo(
    () => (result && !result.valid ? result.errors.map((e) => `${pathLabel(e.instancePath)}: ${e.message} (${e.schemaPath})`).join('\n') : ''),
    [result],
  );

  useIncomingText(jsonSchema.id, (t) => setJsonText(t));
  useToolShortcuts({ getOutput: () => errorsText });
  useShareState(
    { schema: schemaText, json: jsonText, draft, assertFormat },
    (s) => {
      if (s.schema !== undefined) setSchemaText(s.schema);
      if (s.json !== undefined) setJsonText(s.json);
      if (s.draft) setDraft(s.draft);
      if (s.assertFormat !== undefined) setAssertFormat(s.assertFormat);
    },
    { draft: ['auto', '2020-12', 'draft-07'] },
  );

  const generate = () => {
    const parsed = parseJson(jsonText);
    if (!parsed.ok) return;
    const schema = inferSchema(JSON.parse(jsonText), draft === 'draft-07' ? 'draft-07' : '2020-12');
    setSchemaText(JSON.stringify(schema, null, 2));
    setGenerated(true);
  };

  const status = !schemaParsed || !jsonParsed
    ? 'Paste a JSON Schema and a JSON document to validate it, or generate a schema from JSON.'
    : !schemaParsed.ok
      ? `The schema isn’t valid JSON: ${schemaParsed.error.message}`
      : !jsonParsed.ok
        ? `The document isn’t valid JSON: ${jsonParsed.error.message}`
        : state.status === 'running' || state.status === 'idle'
          ? 'Validating…'
          : state.status === 'timeout'
            ? `Stopped after ${TIMEOUT_MS / 1000} s — a "pattern" in the schema may be backtracking.`
            : state.status === 'crash'
              ? state.message
              : result!.valid
                ? `Valid against draft ${result!.draft}`
                : `Invalid: ${pluralize(result!.errors.length, 'error')}${result!.truncated ? ' (first ones shown)' : ''}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonSchema} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="schema">Check JSON against a </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setSchemaText(SAMPLE_SCHEMA);
              setJsonText(SAMPLE_JSON);
              setGenerated(false);
            }}
          >
            Try an example
          </Button>
          <Button
            variant="ghost"
            disabled={!schemaText && !jsonText}
            onClick={() => {
              setSchemaText('');
              setJsonText('');
              setGenerated(false);
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={state.status === 'running' ? 'busy' : result?.valid ? 'good' : 'neutral'} />

      <OptionsCard label="Validation options">
        <Segmented<DraftChoice>
          label="Draft"
          options={[
            { value: 'auto', label: 'Auto ($schema)' },
            { value: '2020-12', label: '2020-12' },
            { value: 'draft-07', label: 'Draft-07' },
          ]}
          value={draft}
          onChange={setDraft}
        />
        <Checkbox label="Check formats (date-time, email, ipv4, uuid, uri…)" checked={assertFormat} onChange={setAssertFormat} />
        <Button variant="secondary" disabled={!jsonParsed?.ok} onClick={generate}>
          <Icon name="sparkle" className="h-4 w-4" /> Generate schema from JSON
        </Button>
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <CodeArea
            id={SCHEMA_ID}
            label="JSON Schema"
            hint={generated ? 'Generated from the JSON' : undefined}
            value={schemaText}
            onChange={(e) => {
              setSchemaText(e.target.value);
              setGenerated(false);
            }}
            rows={18}
            placeholder='{"type": "object", "required": ["id"]}'
            aria-invalid={schemaParsed ? !schemaParsed.ok : undefined}
            onFileText={(t) => setSchemaText(t)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <OpenFileButton accept=".json,application/json,application/schema+json" onText={(t) => setSchemaText(t)} label="Open schema" />
            <CopyButton text={schemaText} label="Copy schema" />
          </div>
          {schemaParsed && !schemaParsed.ok && <ErrorPanel title="Schema syntax error" error={schemaParsed.error} text={schemaDeferred} inputId={SCHEMA_ID} />}
        </div>
        <div className="min-w-0 space-y-4">
          <CodeArea
            id={JSON_ID}
            label="JSON document"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            placeholder='{"id": 1}'
            aria-invalid={jsonParsed ? !jsonParsed.ok : undefined}
            onFileText={(t) => setJsonText(t)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <OpenFileButton accept=".json,application/json" onText={(t) => setJsonText(t)} label="Open JSON" />
          </div>
          {jsonParsed && !jsonParsed.ok && <ErrorPanel title="JSON syntax error" error={jsonParsed.error} text={jsonDeferred} inputId={JSON_ID} />}
        </div>
      </div>

      {result && <Notices items={result.notices} />}

      {result?.valid && (
        <div className="flex items-center gap-3 rounded-3xl bg-primary p-6 text-primary-ink">
          <Icon name="check" className="h-7 w-7 shrink-0" />
          <p className="text-lg font-semibold">The document is valid against this schema.</p>
        </div>
      )}

      {result && !result.valid && (
        <section aria-label="Validation errors" className="min-w-0 rounded-3xl border border-red-200 bg-white dark:border-red-900 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-red-700 dark:text-red-400">
              <Icon name="warn" className="h-4 w-4" /> {pluralize(result.errors.length, 'error')}
            </h2>
            <CopyButton text={errorsText} label="Copy errors" />
          </header>
          <ol className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.errors.map((e, i) => (
              <li key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-4 sm:px-6">
                <code className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{pathLabel(e.instancePath)}</code>
                <div className="min-w-0">
                  <p className="break-words text-sm text-red-800 dark:text-red-300">{e.message}</p>
                  <p className="mt-0.5 break-all font-mono text-xs text-slate-500 dark:text-slate-400">{e.schemaPath}</p>
                </div>
              </li>
            ))}
          </ol>
          {result.truncated && <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-6 dark:border-slate-800">Only the first errors are listed.</p>}
        </section>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Supports the core, applicator and validation keywords of draft 2020-12 and draft-07. <code>$ref</code> resolves within this schema only
        (JSON Pointers, <code>$defs</code>/<code>definitions</code>, <code>$anchor</code>, <code>$id</code>); remote schemas are never fetched.
        Everything runs in your browser.
      </p>
    </div>
  );
}
