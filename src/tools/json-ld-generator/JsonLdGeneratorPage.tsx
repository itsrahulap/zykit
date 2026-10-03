import { useDeferredValue, useMemo, useState } from 'react';
import jsonLdGenerator from './index';
import { FieldInput, ListEditor, NATIVE_SELECT } from './components/FormFields';
import { ReportView } from './components/ReportView';
import { buildJsonLd, SAMPLE_EXISTING, toScript, validateExisting } from './features/jsonld';
import { TYPES, TYPE_BY_ID, type Field, type Level, type ListDef } from './features/schemas';
import { restoreForm } from './features/state';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button } from '../../shared/ui/ui';

type Mode = 'build' | 'validate';

export default function JsonLdGeneratorPage() {
  const [mode, setMode] = useState<Mode>('build');
  const [typeId, setTypeId] = useState('article');
  const [sub, setSub] = useState('Article');
  const [values, setValues] = useState<Record<string, string>>({});
  const [lists, setLists] = useState<Record<string, Record<string, string>[]>>({});
  const [existing, setExisting] = useState('');
  const def = TYPE_BY_ID[typeId];
  const local = !!def.localSubtypes?.includes(sub);

  useShareState(
    { mode, typeId, sub, cfg: JSON.stringify({ values, lists }) },
    (r) => {
      const t = r.typeId && TYPE_BY_ID[r.typeId] ? r.typeId : undefined;
      if (t) {
        setTypeId(t);
        setSub(r.sub && TYPE_BY_ID[t].subtypes.includes(r.sub) ? r.sub : TYPE_BY_ID[t].subtypes[0]);
      }
      if (r.mode === 'build' || r.mode === 'validate') setMode(r.mode);
      try {
        const f = restoreForm(JSON.parse(r.cfg ?? '{}'));
        setValues(f.values);
        setLists(f.lists);
      } catch {
        /* ignore a malformed link */
      }
    },
    { mode: ['build', 'validate'] },
  );

  const built = useMemo(() => buildJsonLd(def, sub, { values, lists }), [def, sub, values, lists]);
  const script = toScript(built.data);
  const deferred = useDeferredValue(existing);
  const checked = useMemo(() => (mode === 'validate' && deferred.trim() ? validateExisting(deferred) : null), [mode, deferred]);
  useToolShortcuts({ getOutput: () => (mode === 'build' ? script : '') });

  const fieldLevel = (f: Field | ListDef): Level => (local && f.local ? f.local : f.level);
  const pickType = (id: string) => {
    setTypeId(id);
    setSub(TYPE_BY_ID[id].subtypes[0]);
  };
  const groups: { name: string; fields: Field[] }[] = [];
  for (const f of def.fields) {
    const name = f.group ?? '';
    const last = groups[groups.length - 1];
    if (last && last.name === name && name) last.fields.push(f);
    else groups.push({ name, fields: [f] });
  }

  const status =
    mode === 'validate'
      ? checked
        ? checked.error ?? `${checked.nodes.length} structured-data object${checked.nodes.length === 1 ? '' : 's'} checked.`
        : 'Paste JSON-LD or a page snippet to check it.'
      : built.report.missingRequired.length
        ? `${built.report.missingRequired.length} required item${built.report.missingRequired.length === 1 ? '' : 's'} still missing.`
        : 'All required properties are filled in.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jsonLdGenerator} />
      <Headline accent="data">Build structured </Headline>
      <StatusStrip status={status} tone={mode === 'build' && !built.report.missingRequired.length ? 'good' : 'neutral'} />
      <Segmented<Mode> label="Mode" value={mode} onChange={setMode} options={[{ value: 'build', label: 'Build' }, { value: 'validate', label: 'Validate existing' }]} />

      {mode === 'build' ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-label="Form" className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label htmlFor="schema-type" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Schema type
                </label>
                <select id="schema-type" value={typeId} onChange={(e) => pickType(e.target.value)} className={`${NATIVE_SELECT} dark:[color-scheme:dark]`}>
                  {TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {def.subtypes.length > 1 && (
                <div className="min-w-0">
                  <label htmlFor="schema-subtype" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">
                    @type
                  </label>
                  <select id="schema-subtype" value={sub} onChange={(e) => setSub(e.target.value)} className={`${NATIVE_SELECT} dark:[color-scheme:dark]`}>
                    {def.subtypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {def.note && <Notices items={[def.note]} />}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setValues(def.example.values);
                  setLists(def.example.lists ?? {});
                }}
              >
                Load example
              </Button>
              <Button variant="ghost" onClick={() => (setValues({}), setLists({}))}>
                Clear
              </Button>
            </div>
            {groups.map((g, gi) => {
              const body = (
                <div className="grid gap-4 sm:grid-cols-2">
                  {g.fields.map((f) => (
                    <div key={f.key} className={f.kind === 'textarea' || f.kind === 'urls' || f.kind === 'lines' ? 'sm:col-span-2' : ''}>
                      <FieldInput f={f} level={fieldLevel(f)} value={values[f.key] ?? ''} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />
                    </div>
                  ))}
                </div>
              );
              return g.name ? (
                <fieldset key={gi} className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <legend className="eyebrow px-1 text-slate-600 dark:text-slate-400">{g.name}</legend>
                  {body}
                </fieldset>
              ) : (
                <div key={gi}>{body}</div>
              );
            })}
            {def.lists.map((l) => (
              <ListEditor key={l.key} def={l} levelOf={fieldLevel} items={lists[l.key] ?? []} onChange={(items) => setLists((p) => ({ ...p, [l.key]: items }))} />
            ))}
          </section>

          <div className="min-w-0 space-y-6 lg:sticky lg:top-4">
            <section className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900" aria-label="Output">
              <div className="flex items-center justify-between gap-3">
                <h2 className="eyebrow text-slate-600 dark:text-slate-400">JSON-LD snippet</h2>
                <CopyButton text={script} label="Copy snippet" />
              </div>
              <CodeBlock label="JSON-LD snippet" className="max-h-[32rem] overflow-y-auto">
                {script}
              </CodeBlock>
              <p className="text-xs text-slate-600 dark:text-slate-400">Paste it into the page&apos;s head or body. Every &lt; is written as {'\\u003c'} so the data can never close the script tag early.</p>
            </section>
            <Panel eyebrow="Rich results check" icon="check">
              <ReportView r={built.report} />
            </Panel>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <CodeArea label="JSON-LD to check" hint="Raw JSON or an HTML snippet with ld+json scripts" rows={14} value={existing} onChange={(e) => setExisting(e.target.value)} placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Product"\n}'} className="break-all" />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setExisting(SAMPLE_EXISTING)}>
                Load sample
              </Button>
              <Button variant="ghost" disabled={!existing} onClick={() => setExisting('')}>
                Clear
              </Button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">The text is parsed as data only. Nothing is fetched or run.</p>
          </section>
          <div className="min-w-0 space-y-4">
            {checked?.error && (
              <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {checked.error}
              </p>
            )}
            {checked && !checked.error && checked.notes.length > 0 && <Notices items={checked.notes} />}
            {checked?.nodes.map((n, i) => (
              <Panel key={i} eyebrow={n.known ? n.type : `${n.type} (not checked)`} icon="braces">
                {n.known ? (
                  <>
                    <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                      Checked as <Badge tone="blue">{n.label}</Badge>
                    </p>
                    <ReportView r={n.report} />
                  </>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">This type isn&apos;t one of the types this tool knows. Its properties were not checked.</p>
                )}
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
