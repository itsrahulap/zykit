import { useDeferredValue, useMemo, useState } from 'react';
import svgOptimizer from './index';
import { DEFAULT_OPTIONS, MAX_SVG_BYTES, optimizeSvg, XmlError, type SvgOptions } from './features/optimize';
import { RangeField, SizeChange } from '../../shared/ui/ImageBatch';
import { useObjectUrl, usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { formatBytes } from '../../shared/utils/format.utils';

const INPUT_ID = 'svg-input';

const OPTION_LABELS: [keyof SvgOptions, string][] = [
  ['sanitize', 'Sanitize (remove scripts, event handlers, javascript: links, foreignObject)'],
  ['removeComments', 'Remove comments'],
  ['removeMetadata', 'Remove metadata, DOCTYPE and XML declaration'],
  ['removeEditorData', 'Remove editor data (Inkscape, Illustrator, Sketch…)'],
  ['removeEmpty', 'Remove empty groups'],
  ['removeDefaults', 'Remove default values, shorten colours'],
  ['removeUnusedIds', 'Remove unused IDs'],
  ['roundNumbers', 'Round numbers'],
  ['pretty', 'Pretty-print output'],
];

const byteLength = (s: string) => new TextEncoder().encode(s).length;

function SvgPreview({ svg, label }: { svg: string; label: string }) {
  // Always shown through <img>: scripts inside an SVG never run in an image context.
  const blob = useMemo(() => (svg ? new Blob([svg], { type: 'image/svg+xml' }) : null), [svg]);
  const url = useObjectUrl(blob);
  return (
    <figure className="min-w-0">
      <div className="checkerboard flex h-56 items-center justify-center overflow-hidden rounded-2xl p-4">
        {url && <img src={url} alt={`${label} SVG preview`} className="block max-h-full max-w-full object-contain" />}
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        {label} · {formatBytes(byteLength(svg))}
      </figcaption>
    </figure>
  );
}

export default function SvgOptimizerPage() {
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('image.svg');
  const [options, setOptions] = useState<SvgOptions>(DEFAULT_OPTIONS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const deferred = useDeferredValue(input);

  const openFile = async (file: File) => {
    setLoadError(null);
    if (file.size > MAX_SVG_BYTES) return setLoadError(`This file is ${formatBytes(file.size)}. SVGs up to ${formatBytes(MAX_SVG_BYTES)} are supported.`);
    if (!/svg/i.test(file.type) && !/\.svg$/i.test(file.name)) return setLoadError(`${file.name} isn't an SVG file.`);
    setInput(await file.text());
    setFileName(file.name);
  };
  usePageFileIntake((files) => files[0] && void openFile(files[0]));

  const result = useMemo(() => {
    if (!deferred.trim()) return null;
    try {
      return { ok: true as const, ...optimizeSvg(deferred, options) };
    } catch (e) {
      if (e instanceof XmlError) return { ok: false as const, error: e.detail };
      return { ok: false as const, error: { message: 'Could not read this SVG.', line: 1, column: 1, offset: 0 } };
    }
  }, [deferred, options]);

  const before = byteLength(deferred);
  const after = result?.ok ? byteLength(result.output) : 0;
  const status = !result
    ? 'Paste SVG code, drop a file or open one.'
    : result.ok
      ? `Optimized: ${formatBytes(before)} → ${formatBytes(after)}.`
      : 'This SVG has a syntax error.';
  const outName = fileName.replace(/(\.min)?\.svg$/i, '') + '.min.svg';
  const changes = result?.ok ? Object.entries(result.changes) : [];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={svgOptimizer} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="SVGs">Smaller, safer </Headline>
        <OpenFileButton accept=".svg,image/svg+xml" onFile={openFile} label="Open SVG" />
      </div>
      <StatusStrip status={status} tone={result?.ok ? 'good' : 'neutral'} />
      {loadError && <ErrorAlert message={loadError} onDismiss={() => setLoadError(null)} />}

      <OptionsCard label="Optimizer options">
        {OPTION_LABELS.map(([k, label]) => (
          <Checkbox key={k} label={label} checked={options[k] as boolean} onChange={(v) => setOptions((o) => ({ ...o, [k]: v }))} />
        ))}
        <RangeField
          label="Decimals"
          min={0}
          max={6}
          value={options.precision}
          disabled={!options.roundNumbers}
          onChange={(precision) => setOptions((o) => ({ ...o, precision }))}
        />
      </OptionsCard>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label="SVG input"
          hint={input ? formatBytes(before) : undefined}
          rows={16}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='<svg xmlns="http://www.w3.org/2000/svg" …>'
        />
        <div className="min-w-0 space-y-4">
          {!result && (
            <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">The optimized SVG appears here.</p>
          )}
          {result && !result.ok && <ErrorPanel error={result.error} text={deferred} inputId={INPUT_ID} title="Invalid SVG" />}
          {result?.ok && (
            <>
              <p className="rounded-2xl bg-primary px-4 py-3 text-primary-ink" role="status">
                <SizeChange before={before} after={after} />
              </p>
              {result.security.length > 0 && <Notices items={result.security} />}
              <OutputPanel title="Optimized SVG" icon="code" text={result.output} fileName={outName} mime="image/svg+xml" />
            </>
          )}
        </div>
      </div>

      {result?.ok && (
        <>
          <section aria-label="Preview" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SvgPreview svg={deferred} label="Original" />
              <SvgPreview svg={result.output} label="Optimized" />
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Previews are rendered as images, so any scripts in the file can&rsquo;t run.</p>
          </section>
          {changes.length > 0 && (
            <Panel eyebrow="What changed" icon="check">
              <ul className="grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2 dark:text-slate-300">
                {changes.map(([k, n]) => (
                  <li key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5 dark:border-slate-800">
                    <span className="first-letter:uppercase">{k}</span>
                    <span className="font-mono tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}

      <Panel eyebrow="How it works" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>Your SVG is parsed as XML and cleaned with conservative passes; anything the optimizer doesn&rsquo;t fully understand (like stylesheets) is left as it is.</li>
          <li>Path data is rounded against the already-rounded position, so long relative paths don&rsquo;t drift. Lower the decimals for smaller files, raise them for tiny icons with fine detail.</li>
          <li>
            <strong>Sanitize</strong> removes scripts, <code>on…</code> event handlers, <code>javascript:</code> links, <code>&lt;foreignObject&gt;</code> and references to
            external files, so the SVG is safer to embed. Keep it on for SVGs from untrusted sources.
          </li>
          <li>Processing happens in your browser. The file is never uploaded.</li>
        </ul>
      </Panel>
    </div>
  );
}
