import { useEffect, useId, useMemo, useState } from 'react';
import mockApiGenerator from './index';
import { exportProject, fixtureFiles, importProject, jsonServerDb, METHODS, newId, openApiDocument, SAMPLES, validateProject, type Endpoint, type Method, type Project } from './features/mock-api-generator';
import { jsonToYaml } from '../yaml-json/features/convert';
import { createStore } from '../../shared/lib/store';
import { createZip } from '../../shared/lib/zip';
import { OpenFileButton } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';
import { pluralize } from '../../shared/utils/format.utils';

// Saved in this browser only, so a project survives a reload.
const projectStore = createStore<Project>('zykit-mock-api-project', SAMPLES.users());

type Output = 'openapi-yaml' | 'openapi-json' | 'json-server';
const card = 'min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const inputCls =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 aria-[invalid=true]:border-red-500 dark:bg-slate-950 dark:text-slate-100';

function Field({ label, error, children }: { label: string; error?: string; children: (id: string, describedBy?: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children(id, error ? `${id}-e` : undefined)}
      {error && (
        <p id={`${id}-e`} className="text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default function MockApiGeneratorPage() {
  const project = projectStore.use();
  const setProject = (p: Project) => projectStore.set(p);
  const [selectedId, setSelectedId] = useState<string | null>(project.endpoints[0]?.id ?? null);
  const [output, setOutput] = useState<Output>('openapi-yaml');
  const [error, setError] = useState('');
  const [yamlText, setYamlText] = useState('');

  const problems = useMemo(() => validateProject(project), [project]);
  const valid = problems.size === 0 && project.endpoints.length > 0;
  const selected = project.endpoints.find((e) => e.id === selectedId) ?? project.endpoints[0];
  const sel = selected ? problems.get(selected.id) : undefined;

  const openApi = useMemo(() => (valid ? openApiDocument(project) : null), [valid, project]);
  const db = useMemo(() => (valid ? jsonServerDb(project) : null), [valid, project]);
  useEffect(() => {
    if (!openApi) return;
    let live = true;
    void jsonToYaml(JSON.stringify(openApi), { indent: 2, lineWidth: 0, quote: 'plain' }).then((r) => live && r.ok && setYamlText(r.output));
    return () => {
      live = false;
    };
  }, [openApi]);
  const outText = output === 'openapi-json' ? (openApi ? `${JSON.stringify(openApi, null, 2)}\n` : '') : output === 'json-server' ? (db?.text ?? '') : yamlText;
  const outName = output === 'openapi-json' ? 'openapi.json' : output === 'json-server' ? 'db.json' : 'openapi.yaml';

  const update = (id: string, patch: Partial<Endpoint>) => setProject({ ...project, endpoints: project.endpoints.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const add = (from?: Endpoint) => {
    const e: Endpoint = from ? { ...from, id: newId() } : { id: newId(), method: 'GET', path: '/items', status: 200, description: '', body: '[]' };
    setProject({ ...project, endpoints: [...project.endpoints, e] });
    setSelectedId(e.id);
  };
  const remove = (id: string) => {
    const rest = project.endpoints.filter((e) => e.id !== id);
    setProject({ ...project, endpoints: rest });
    setSelectedId(rest[0]?.id ?? null);
  };
  const load = (p: Project) => {
    setProject(p);
    setSelectedId(p.endpoints[0]?.id ?? null);
    setError('');
  };
  const downloadFixtures = () => {
    const zip = createZip(fixtureFiles(project).map((f) => ({ name: f.name, data: new TextEncoder().encode(f.text) })));
    downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), 'fixtures.zip');
  };

  const status = !project.endpoints.length
    ? 'Add an endpoint or load a sample to start.'
    : problems.size
      ? `${pluralize(problems.size, 'endpoint')} need${problems.size === 1 ? 's' : ''} fixing before export.`
      : `${pluralize(project.endpoints.length, 'endpoint')} ready to export.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={mockApiGenerator} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="mock API">Design a </Headline>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <Select<keyof typeof SAMPLES>
              label="Load a sample"
              placeholder="Choose…"
              options={[
                { value: 'users', label: 'Users API' },
                { value: 'products', label: 'Products API' },
                { value: 'tasks', label: 'Tasks API' },
              ]}
              onChange={(k) => load(SAMPLES[k]())}
            />
          </div>
          <OpenFileButton
            accept=".json,application/json"
            label="Import project"
            onText={(t) => {
              try {
                load(importProject(t));
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          <Button variant="secondary" onClick={() => downloadText(exportProject(project), 'mock-api-project.json', 'application/json')}>
            <Icon name="download" className="h-4 w-4" /> Export project
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={valid ? 'good' : 'neutral'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <section aria-label="Endpoints" className={`${card} space-y-3`}>
          <Field label="API name">{(id) => <input id={id} className={inputCls} value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />}</Field>
          <ul className="space-y-1">
            {project.endpoints.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  aria-current={e.id === selected?.id ? 'true' : undefined}
                  onClick={() => setSelectedId(e.id)}
                  className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-left font-mono text-sm pointer-coarse:min-h-11 ${e.id === selected?.id ? 'bg-emerald-50 ring-1 ring-emerald-500 dark:bg-emerald-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span className="w-14 shrink-0 font-semibold text-slate-700 dark:text-slate-300">{e.method}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-900 dark:text-slate-100">{e.path}</span>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">{e.status}</span>
                  {problems.has(e.id) && <Badge tone="red">fix</Badge>}
                </button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" onClick={() => add()}>
            <Icon name="plus" className="h-4 w-4" /> Add endpoint
          </Button>
        </section>

        {selected ? (
          <section aria-label="Endpoint" className={`${card} space-y-4`}>
            <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)_7rem]">
              <Select<Method> label="Method" options={METHODS.map((m) => ({ value: m, label: m }))} value={selected.method} onChange={(method) => update(selected.id, { method })} />
              <Field label="Path" error={sel?.path ?? sel?.duplicate}>
                {(id, d) => <input id={id} className={inputCls} value={selected.path} onChange={(e) => update(selected.id, { path: e.target.value })} spellCheck={false} aria-invalid={sel?.path || sel?.duplicate ? true : undefined} aria-describedby={d} />}
              </Field>
              <Field label="Status" error={sel?.status}>
                {(id, d) => <input id={id} type="number" min={100} max={599} className={inputCls} value={selected.status} onChange={(e) => update(selected.id, { status: Number(e.target.value) })} aria-invalid={sel?.status ? true : undefined} aria-describedby={d} />}
              </Field>
            </div>
            <Field label="Description">{(id) => <input id={id} className={inputCls.replace('font-mono ', '')} value={selected.description} onChange={(e) => update(selected.id, { description: e.target.value })} />}</Field>
            <CodeArea label="Response body (JSON)" hint="empty = no body" value={selected.body} onChange={(e) => update(selected.id, { body: e.target.value })} rows={12} aria-invalid={sel?.body ? true : undefined} />
            {sel?.body && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {'line' in sel.body ? `Line ${sel.body.line}, column ${sel.body.column}: ` : ''}
                {sel.body.message}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => add(selected)}>
                <Icon name="copy" className="h-4 w-4" /> Duplicate
              </Button>
              <Button variant="ghost" onClick={() => remove(selected.id)}>
                <Icon name="x" className="h-4 w-4" /> Remove endpoint
              </Button>
            </div>
          </section>
        ) : (
          <p className={`${card} text-sm text-slate-600 dark:text-slate-400`}>No endpoints yet.</p>
        )}
      </div>

      <section aria-label="Export" className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<Output>
            label="Export as"
            options={[
              { value: 'openapi-yaml', label: 'OpenAPI YAML' },
              { value: 'openapi-json', label: 'OpenAPI JSON' },
              { value: 'json-server', label: 'json-server db.json' },
            ]}
            value={output}
            onChange={setOutput}
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={outText} />
            <Button variant="secondary" disabled={!outText} onClick={() => downloadText(outText, outName, 'application/octet-stream')}>
              <Icon name="download" className="h-4 w-4" /> Download {outName}
            </Button>
            <Button variant="secondary" disabled={!valid} onClick={downloadFixtures}>
              <Icon name="download" className="h-4 w-4" /> Fixtures (ZIP)
            </Button>
          </div>
        </div>
        {valid ? (
          <>
            <CodeBlock label="Export preview" className="max-h-[28rem] overflow-y-auto">
              {outText}
            </CodeBlock>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {output === 'json-server'
                ? `Serve it with npx json-server db.json. Made from ${pluralize(db!.collections.length, 'collection')} (GET /name endpoints returning an array)${db!.skipped ? `; ${pluralize(db!.skipped, 'other endpoint')} can’t be expressed in db.json` : ''}.`
                : 'Serve it with npx @stoplight/prism-cli mock openapi.yaml: Prism answers each route with the example body.'}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">Fix the endpoints marked “fix” to see the export.</p>
        )}
      </section>
      <p className="text-sm text-slate-500 dark:text-slate-400">Nothing is hosted or sent: this tool writes files for a mock server you run yourself. Your project is saved only in this browser.</p>
    </div>
  );
}
