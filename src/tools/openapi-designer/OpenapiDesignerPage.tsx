import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import openapiDesigner from './index';
import { DocsPreview } from './components/DocsPreview';
import { AddButton, AddKeyRow, RemoveButton, TextField } from './components/fields';
import { OperationEditor, type UpdateDoc } from './components/OperationEditor';
import { SchemasEditor } from './components/SchemasEditor';
import { child, list, listOperations, normalizePath, produce, removeAt, setField } from './features/editing';
import { HTTP_METHODS, asObject, findUnsupported, isMethod, isObject, parseSpec, pathParams, toJsonText, toYamlText, validateSpec, type JsonObject } from './features/openapi';
import { sampleDocument } from './features/sample';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { sendText } from '../../shared/lib/handoff';
import { createStore } from '../../shared/lib/store';
import type { TextError } from '../../shared/lib/textpos';
import { ErrorPanel, Notices, OpenFileButton, OutputPanel } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Tabs } from '../../shared/ui/Tabs';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Badge, Button, Card } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const MAPPER_ID = 'openapi-dependency-mapper';
// The document survives reloads; a stored value that isn't a document falls back to the sample.
const docStore = createStore<unknown>('zykit-openapi-designer', null);
const isDocument = (v: unknown): v is JsonObject => isObject(v) && typeof v.openapi === 'string';
const SAMPLE = sampleDocument();

type OutputTab = 'json' | 'yaml' | 'docs';

export default function OpenapiDesignerPage() {
  const stored = docStore.use();
  const doc = isDocument(stored) ? stored : SAMPLE;
  const update: UpdateDoc = (recipe) => {
    const current = docStore.get();
    docStore.set(produce(isDocument(current) ? current : SAMPLE, recipe));
  };

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<TextError | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<OutputTab>('yaml');
  const [newPath, setNewPath] = useState('');
  const [alert, setAlert] = useState<string | null>(null);
  const importId = useId();
  const navigate = useNavigate();

  const replace = (next: JsonObject, messages: string[] = []) => {
    docStore.set(next);
    setVersion((v) => v + 1);
    setNotices(messages);
    setImportError(null);
  };

  const importSpec = async (text: string) => {
    const r = await parseSpec(text);
    if (!r.ok) {
      setImportError(r.error);
      return;
    }
    const messages = [...r.warnings, ...findUnsupported(r.doc).map((u) => `${u}: kept as imported, but not editable in the forms.`)];
    if (String(r.doc.openapi).startsWith('3.0')) messages.push(`OpenAPI ${String(r.doc.openapi)} document: the version is kept and 3.0 keywords such as "nullable" aren’t converted to 3.1.`);
    replace(r.doc, messages);
  };

  useIncomingText(openapiDesigner.id, (text) => {
    setImportText(text);
    void importSpec(text);
  });

  const json = useMemo(() => toJsonText(doc), [doc]);
  const issues = useMemo(() => validateSpec(doc), [doc]);
  const [yaml, setYaml] = useState('');
  useEffect(() => {
    let live = true;
    toYamlText(doc).then(
      (text) => live && setYaml(text),
      (err: unknown) => live && setAlert(`Couldn’t write YAML: ${err instanceof Error ? err.message : 'unknown error'}.`),
    );
    return () => {
      live = false;
    };
  }, [doc]);

  const info = asObject(doc.info);
  const servers = Array.isArray(doc.servers) ? doc.servers : [];
  const tags = Array.isArray(doc.tags) ? doc.tags : [];
  const tagNames = tags.map((t) => asObject(t).name).filter((n): n is string => typeof n === 'string' && !!n);
  const schemaNames = Object.keys(asObject(asObject(doc.components).schemas));
  const paths = asObject(doc.paths);
  const operationCount = listOperations(doc).length;
  const errors = issues.filter((i) => i.level === 'error').length;
  const normalizedPath = normalizePath(newPath);
  const pathError = !normalizedPath ? 'Enter a path such as /pets/{id}.' : Object.hasOwn(paths, normalizedPath) ? `${normalizedPath} already exists.` : null;

  const mapDependencies = () => {
    if (sendText({ to: MAPPER_ID, from: openapiDesigner.id, text: json, kind: 'json' })) navigate(`/tools/${MAPPER_ID}`);
    else setAlert('Couldn’t hand the document over because this browser blocks session storage. Copy the JSON and paste it into the OpenAPI Dependency Mapper instead.');
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={openapiDesigner} />
      <Headline accent="forms">OpenAPI specs from </Headline>
      <StatusStrip
        status={`${pluralize(operationCount, 'operation')} · ${pluralize(schemaNames.length, 'schema')} · ${errors ? pluralize(errors, 'error') : 'valid'}`}
        tone={errors ? 'neutral' : 'good'}
      />
      {alert && <ErrorAlert message={alert} onDismiss={() => setAlert(null)} />}

      <Card title="Import" subtitle="Paste or open an OpenAPI 3.0 or 3.1 document. Remote $refs are never fetched.">
        <div className="space-y-3">
          <CodeArea
            id={importId}
            label="OpenAPI document to import (JSON or YAML)"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            onFileText={(text) => {
              setImportText(text);
              void importSpec(text);
            }}
            rows={6}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void importSpec(importText)} disabled={!importText.trim()}>
              Import
            </Button>
            <OpenFileButton
              accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
              onText={(text) => {
                setImportText(text);
                void importSpec(text);
              }}
            />
            <Button variant="secondary" onClick={() => replace(sampleDocument())}>
              Load example
            </Button>
            <Button variant="ghost" onClick={() => replace({ openapi: '3.1.0', info: { title: 'My API', version: '1.0.0' }, paths: {} })}>
              Start blank
            </Button>
          </div>
          {importError && <ErrorPanel error={importError} text={importText} inputId={importId} title="Couldn’t import" />}
          <Notices items={notices} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card title="Info" action={<Badge>openapi {String(doc.openapi)}</Badge>}>
            <div className="flex flex-wrap gap-3">
              <TextField label="Title" value={info.title} onChange={(v) => update((d) => (child(d, 'info').title = v))} />
              <TextField label="Version" value={info.version} onChange={(v) => update((d) => (child(d, 'info').version = v))} className="w-32" />
              <TextField label="API description" value={info.description} onChange={(v) => update((d) => setField(child(d, 'info'), 'description', v))} className="block w-full" />
            </div>
          </Card>

          <Card title="Servers">
            <div className="space-y-3">
              {servers.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <TextField label={`Server ${i + 1} URL`} value={asObject(s).url} onChange={(v) => update((d) => (asObject(list(d, 'servers')[i]).url = v))} mono />
                  <TextField label={`Server ${i + 1} description`} value={asObject(s).description} onChange={(v) => update((d) => setField(asObject(list(d, 'servers')[i]), 'description', v))} />
                  <RemoveButton label={`Remove server ${i + 1}`} onClick={() => update((d) => removeAt(d, 'servers', i))} />
                </div>
              ))}
              <AddButton onClick={() => update((d) => list(d, 'servers').push({ url: 'https://api.example.com' }))}>Add server</AddButton>
            </div>
          </Card>

          <Card title="Tags">
            <div className="space-y-3">
              {tags.map((t, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <TextField label={`Tag ${i + 1} name`} value={asObject(t).name} onChange={(v) => update((d) => (asObject(list(d, 'tags')[i]).name = v))} />
                  <TextField label={`Tag ${i + 1} description`} value={asObject(t).description} onChange={(v) => update((d) => setField(asObject(list(d, 'tags')[i]), 'description', v))} />
                  <RemoveButton label={`Remove tag ${i + 1}`} onClick={() => update((d) => removeAt(d, 'tags', i))} />
                </div>
              ))}
              <AddButton onClick={() => update((d) => list(d, 'tags').push({ name: `tag${tags.length + 1}` }))}>Add tag</AddButton>
            </div>
          </Card>

          <Card title="Paths and operations">
            <div className="space-y-6">
              {Object.entries(paths).map(([path, rawItem]) => {
                const item = asObject(rawItem);
                const methods = Object.keys(item).filter(isMethod);
                const missing = HTTP_METHODS.filter((m) => !methods.includes(m));
                return (
                  <section key={path} aria-label={`Path ${path}`} className="space-y-3 rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="min-w-0 break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{path}</h3>
                      <RemoveButton
                        label={`Remove path ${path}`}
                        onClick={() =>
                          update((d) => {
                            delete child(d, 'paths')[path];
                          })
                        }
                      />
                    </div>
                    {methods.map((method) => {
                      const operation = asObject(item[method]);
                      return (
                        <details key={method} className="min-w-0 rounded-xl border border-slate-100 dark:border-slate-800">
                          <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 pointer-coarse:min-h-11">
                            <Badge tone="blue">{method.toUpperCase()}</Badge>
                            <span className="min-w-0 break-words text-sm text-slate-700 dark:text-slate-300">{typeof operation.summary === 'string' && operation.summary ? operation.summary : 'Edit operation'}</span>
                          </summary>
                          <div className="space-y-4 border-t border-slate-100 p-3 dark:border-slate-800">
                            <OperationEditor path={path} method={method} operation={operation} tagNames={tagNames} schemaNames={schemaNames} update={update} />
                            <Button
                              variant="ghost"
                              onClick={() =>
                                update((d) => {
                                  delete child(child(d, 'paths'), path)[method];
                                })
                              }
                            >
                              Delete {method.toUpperCase()} {path}
                            </Button>
                          </div>
                        </details>
                      );
                    })}
                    {missing.length > 0 && (
                      <Select
                        label={`Add operation to ${path}`}
                        placeholder="Method…"
                        options={missing.map((m) => ({ value: m, label: m.toUpperCase() }))}
                        onChange={(m) =>
                          update((d) => {
                            const params = pathParams(path).map((name) => ({ name, in: 'path', required: true, schema: { type: 'string' } }));
                            child(child(d, 'paths'), path)[m] = { ...(params.length ? { parameters: params } : {}), responses: { '200': { description: 'OK' } } };
                          })
                        }
                      />
                    )}
                  </section>
                );
              })}
              <AddKeyRow
                label="New path"
                value={newPath}
                onChange={setNewPath}
                error={pathError}
                button="Add path"
                onAdd={() => {
                  update((d) => (child(d, 'paths')[normalizedPath] = {}));
                  setNewPath('');
                }}
              />
            </div>
          </Card>

          <Card title="Component schemas" subtitle="JSON Schema for each reusable model. Pick them in the forms above as $ref.">
            <SchemasEditor doc={doc} update={update} version={version} />
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-label="Validation" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Validation</h2>
            <div aria-live="polite">
              {issues.length === 0 ? (
                <p className="text-sm text-emerald-800 dark:text-emerald-300">No problems found.</p>
              ) : (
                <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm">
                  {issues.slice(0, 100).map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 break-words">
                      <Badge tone={issue.level === 'error' ? 'red' : 'amber'}>{issue.level}</Badge>
                      <span className="min-w-0 text-slate-800 dark:text-slate-200">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={mapDependencies}>
                Map dependencies
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">Opens this spec in the OpenAPI Dependency Mapper.</span>
            </div>
          </section>

          <div>
            <Tabs<OutputTab>
              label="Output format"
              tabs={[
                { id: 'yaml', label: 'YAML' },
                { id: 'json', label: 'JSON' },
                { id: 'docs', label: 'Docs preview' },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-4">
              {tab === 'yaml' && <OutputPanel title="openapi.yaml" text={yaml} fileName="openapi.yaml" mime="application/yaml" kind="yaml" />}
              {tab === 'json' && <OutputPanel title="openapi.json" text={json} fileName="openapi.json" mime="application/json" kind="json" />}
              {tab === 'docs' && (
                <section aria-label="Docs preview" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                  <DocsPreview doc={doc} />
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
