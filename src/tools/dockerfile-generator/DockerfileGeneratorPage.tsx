import { useId, useMemo, useState } from 'react';
import dockerfileGenerator from './index';
import { defaultsFor, generate, PRESETS, VERSIONS_REVIEWED, type DockerOptions, type PackageManager, type Preset } from './features/dockerfile-generator';
import { Checkbox, Notices, OutputPanel } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';

const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const inputCls =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 aria-[invalid=true]:border-red-500 dark:bg-slate-950 dark:text-slate-100';

type TextKey = 'version' | 'build' | 'start' | 'output' | 'port' | 'workdir' | 'healthPath';

function Text({ label, value, error, hint, onChange }: { label: string; value: string; error?: string; hint?: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-n` : undefined} />
      {(error || hint) && (
        <p id={`${id}-n`} className={`text-xs ${error ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export default function DockerfileGeneratorPage() {
  const [o, setO] = useState<DockerOptions>(() => defaultsFor('node'));
  const set = <K extends keyof DockerOptions>(k: K, v: DockerOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => generate(o), [o]);
  const fam = PRESETS[o.preset].family;
  const node = fam === 'node' || fam === 'spa';
  const field = (k: TextKey, label: string, hint?: string) => <Text label={label} value={o[k]} error={r.errors[k]} hint={hint} onChange={(v) => set(k, v)} />;
  const bad = Object.keys(r.errors).length > 0;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={dockerfileGenerator} />
      <div className="space-y-3">
        <Headline accent="Dockerfile">Generate a </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">Pick your stack and answer a few questions. Every line is explained, and assumptions are listed so you know what to check.</p>
      </div>
      <StatusStrip status={bad ? 'Fix the highlighted fields to generate the Dockerfile.' : `${PRESETS[o.preset].label}: ${r.lines.filter((l) => l.text && !l.text.startsWith('#')).length} instructions.`} tone={bad ? 'neutral' : 'good'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Options" className={`min-w-0 space-y-5 ${card}`}>
          <Select<Preset> label="Stack" options={(Object.keys(PRESETS) as Preset[]).map((p) => ({ value: p, label: PRESETS[p].label }))} value={o.preset} onChange={(p) => setO({ ...defaultsFor(p), comments: o.comments })} />
          {node && (
            <Segmented<PackageManager>
              label="Package manager"
              options={[
                { value: 'npm', label: 'npm' },
                { value: 'pnpm', label: 'pnpm' },
                { value: 'yarn', label: 'Yarn' },
              ]}
              value={o.packageManager}
              onChange={(v) => set('packageManager', v)}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('version', fam === 'static' ? 'nginx version' : fam === 'spa' ? 'Node.js version (build)' : 'Runtime version', `Default last reviewed ${VERSIONS_REVIEWED}.`)}
            {field('port', 'Port')}
            {fam !== 'go' && fam !== 'static' && field('build', 'Build command', fam === 'java' ? undefined : 'Leave empty if there is no build step.')}
            {fam === 'go' && field('build', 'Package to build', 'For example ./cmd/app or .')}
            {(fam === 'node' || fam === 'python') && field('start', 'Start command', fam === 'python' ? '{port} is replaced with the port.' : undefined)}
            {(fam === 'spa' || fam === 'java') && field('output', 'Build output folder')}
            {fam === 'static' && field('output', 'Site folder', 'The folder with index.html.')}
            {fam !== 'go' && fam !== 'static' && field('workdir', 'Working directory')}
          </div>
          <div className="flex flex-col gap-1">
            {(fam === 'node' || fam === 'python') && <Checkbox label="Multi-stage build (smaller final image)" checked={o.multiStage} onChange={(v) => set('multiStage', v)} />}
            <Checkbox label="HEALTHCHECK" checked={o.healthcheck} onChange={(v) => set('healthcheck', v)} />
            <Checkbox label="Explain each line in comments" checked={o.comments} onChange={(v) => set('comments', v)} />
          </div>
          {o.healthcheck && fam !== 'java' && fam !== 'go' && field('healthPath', 'Health check path')}
        </section>

        <div className="min-w-0 space-y-6">
          {bad ? (
            <p className={`${card} text-sm text-slate-600 dark:text-slate-400`}>The Dockerfile appears here once every field is valid.</p>
          ) : (
            <OutputPanel title="Dockerfile" icon="layers" text={r.dockerfile} fileName="Dockerfile" mime="text/plain" kind="code" />
          )}
          <section aria-label=".dockerignore" className={`min-w-0 space-y-3 ${card}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">.dockerignore</h2>
              <div className="flex flex-wrap gap-1">
                <CopyButton text={r.dockerignore} />
                <Button variant="ghost" onClick={() => downloadText(r.dockerignore, 'dockerignore', 'application/octet-stream')}>
                  <Icon name="download" className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <CodeBlock label=".dockerignore contents" className="max-h-64 overflow-y-auto">
              {r.dockerignore}
            </CodeBlock>
            <p className="text-xs text-slate-500 dark:text-slate-400">Save it as .dockerignore next to the Dockerfile (browsers may drop the leading dot).</p>
          </section>
          {!bad && <Notices items={r.notes} />}
        </div>
      </div>

      {!bad && (
        <section aria-label="Line by line" className={card}>
          <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Line by line</h2>
          <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {r.lines
              .filter((l) => l.why)
              .map((l, i) => (
                <div key={i} className="grid gap-1 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
                  <dt className="min-w-0 whitespace-pre-wrap break-all font-mono text-xs text-slate-900 dark:text-slate-100">{l.text}</dt>
                  <dd className="min-w-0 text-slate-600 dark:text-slate-400">{l.why}</dd>
                </div>
              ))}
          </dl>
        </section>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">Generated in your browser; nothing is built, run or uploaded. Check the result with docker build before relying on it.</p>
    </div>
  );
}
