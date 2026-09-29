import { useState } from 'react';
import { useImageProcessor } from './app/useImageProcessor';
import { BeforeAfter } from './components/BeforeAfter';
import { Faq } from './components/Faq';
import { FileDetails, Panel } from './components/FileDetails';
import { ImageUploader } from './components/ImageUploader';
import { MetadataSummary } from './components/MetadataSummary';
import { MetadataTable } from './components/MetadataTable';
import { PreviewPanel } from './components/PreviewPanel';
import { ProcessingProgress } from './components/ProcessingProgress';
import { SanitizeOptions } from './components/SanitizeOptions';
import { SignalsPanel } from './components/SignalsPanel';
import { DetectorNote, ErrorAlert, Footer, Header, Headline, HowItWorks, StatusStrip } from './components/StaticSections';
import { Tabs } from './components/Tabs';
import { TechnicalPanel } from './components/TechnicalPanel';
import { Button, Icon } from './components/ui';
import { ValidationReport } from './components/ValidationReport';
import { buildMetadataExport, downloadJson } from './utils/export.utils';
import { cleanFileName } from './utils/file.utils';
import { pluralize } from './utils/format.utils';

type Tab = 'overview' | 'metadata' | 'technical';
type Version = 'original' | 'cleaned';

function VersionToggle({ value, onChange }: { value: Version; onChange: (v: Version) => void }) {
  return (
    <div role="group" aria-label="Show file" className="inline-flex rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800">
      {(['original', 'cleaned'] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`rounded-lg px-4 py-1.5 font-medium capitalize ${
            value === v ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {v} file
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { state, error, dismissError, selectFile, clean, cancel, reset } = useImageProcessor();
  const [tab, setTab] = useState<Tab>('overview');
  const [version, setVersion] = useState<Version>('original');

  // Reset the view when the processing status changes (adjusting state during render).
  const [prevStatus, setPrevStatus] = useState(state.status);
  if (prevStatus !== state.status) {
    setPrevStatus(state.status);
    if (state.status === 'analyzing' || state.status === 'completed') setTab('overview');
    if (state.status === 'ready' || state.status === 'analyzing') setVersion('original');
    if (state.status === 'completed') setVersion('cleaned');
  }

  const hasFile = state.status === 'ready' || state.status === 'sanitizing' || state.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header />

      <main id="main" className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        {error && <ErrorAlert message={error} onDismiss={dismissError} />}

        {!hasFile && (
          <>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <Headline accent="reveal">See what your images </Headline>
              <ImageUploader onFile={selectFile} variant="button" label="Choose a file" />
            </div>
            <StatusStrip
              status={state.status === 'analyzing' ? 'Reading metadata…' : 'Ready when you are. Drop, paste or choose an image.'}
              tone={state.status === 'analyzing' ? 'busy' : 'neutral'}
            />
            {state.status === 'analyzing' ? (
              <ProcessingProgress stage={state.stage} stages={['reading', 'analyzing']} onCancel={cancel} />
            ) : (
              <ImageUploader onFile={selectFile} />
            )}
            <HowItWorks />
          </>
        )}

        {hasFile && (() => {
          const { file, report } = state;
          const done = state.status === 'completed' ? state : null;
          const cleanName = cleanFileName(file.name, report.format);
          const shown = done && version === 'cleaned' ? done.result.cleaned : report;
          const shownName = done && version === 'cleaned' ? cleanName : file.name;
          const exportData = buildMetadataExport(file.name, file.type, report, done ? { name: cleanName, result: done.result } : undefined);
          const status =
            state.status === 'sanitizing'
              ? 'Cleaning and verifying…'
              : done
                ? done.result.validation.ok
                  ? 'Cleaned and verified. Your file is ready to download.'
                  : 'Cleaned with warnings. Review the verification below.'
                : `Full metadata ready. ${pluralize(report.entries.length, 'field')} found.`;

          return (
            <>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className="eyebrow text-emerald-700 dark:text-emerald-400">Your file, explained</p>
                  <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">{file.name}</h1>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => downloadJson(exportData, `${file.name.replace(/\.[^.]+$/, '') || 'image'}-metadata.json`)}
                  >
                    Export metadata
                  </Button>
                  <ImageUploader onFile={selectFile} variant="secondary" label="New image" />
                  <Button variant="secondary" onClick={reset}>
                    Start over
                  </Button>
                </div>
              </div>

              <StatusStrip status={status} tone={state.status === 'sanitizing' ? 'busy' : done ? 'good' : 'neutral'} />

              <Tabs<Tab>
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'metadata', label: `All metadata (${shown.entries.length})` },
                  { id: 'technical', label: 'Technical' },
                ]}
                active={tab}
                onChange={setTab}
              />

              {tab === 'overview' && (
                <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-6">
                  {report.warnings.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <p className="font-medium">Notes about this file</p>
                      <ul className="mt-1 list-disc pl-5">
                        {report.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {done ? (
                    <>
                      <div
                        className={`flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 ${
                          done.result.validation.ok ? 'bg-primary text-primary-ink' : 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100'
                        }`}
                        role="status"
                      >
                        <div className="flex items-center gap-3">
                          <Icon name={done.result.validation.ok ? 'check' : 'warn'} className="h-8 w-8 shrink-0" />
                          <div>
                            <p className="text-xl font-semibold">{done.result.validation.ok ? 'Your clean image is ready' : 'Cleaned with warnings'}</p>
                            <p className="opacity-90">{pluralize(done.result.diff.removed.length, 'metadata field')} removed and verified.</p>
                          </div>
                        </div>
                        <a
                          href={done.cleanedUrl}
                          download={cleanName}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
                        >
                          <Icon name="download" className="h-4 w-4" /> Download {cleanName}
                        </a>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <PreviewPanel url={done.previewUrl} report={report} label="Original" caption="Original · unchanged" />
                        <PreviewPanel url={done.cleanedUrl} report={done.result.cleaned} label="Cleaned" caption="Cleaned · metadata removed" />
                      </div>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <BeforeAfter original={report} cleaned={done.result.cleaned} diff={done.result.diff} />
                        <ValidationReport report={done.result.validation} log={done.result.log} />
                      </div>
                      <DetectorNote />
                    </>
                  ) : (
                    <>
                      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                        <PreviewPanel url={state.previewUrl} report={report} label="Original" caption="Original image preview · Original file unchanged" />
                        <div className="space-y-6">
                          <FileDetails report={report} />
                          <SignalsPanel signals={report.signals} />
                        </div>
                      </div>
                      <Panel eyebrow="Metadata found" icon="info">
                        <MetadataSummary report={report} />
                        <button type="button" onClick={() => setTab('metadata')} className="mt-5 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
                          View all {report.entries.length} fields ↗
                        </button>
                      </Panel>
                      {state.status === 'sanitizing' ? (
                        <ProcessingProgress stage={state.stage} stages={['reading', 'analyzing', 'sanitizing', 'validating']} onCancel={cancel} />
                      ) : (
                        <SanitizeOptions report={report} onClean={clean} busy={false} />
                      )}
                    </>
                  )}
                </div>
              )}

              {tab === 'metadata' && (
                <div role="tabpanel" id="panel-metadata" aria-labelledby="tab-metadata" className="space-y-4">
                  {done && <VersionToggle value={version} onChange={setVersion} />}
                  <Panel eyebrow={`All metadata · ${shownName}`} icon="info">
                    <p className="mb-5 text-slate-600 dark:text-slate-400">
                      {done && version === 'cleaned' ? 'Tags still present in the cleaned file.' : 'The original tags and values saved in your file.'}
                    </p>
                    <MetadataTable entries={shown.entries} />
                  </Panel>
                </div>
              )}

              {tab === 'technical' && (
                <div role="tabpanel" id="panel-technical" aria-labelledby="tab-technical" className="space-y-4">
                  {done && <VersionToggle value={version} onChange={setVersion} />}
                  <TechnicalPanel
                    report={shown}
                    name={shownName}
                    declaredType={done && version === 'cleaned' ? undefined : file.type}
                    rawJson={done && version === 'cleaned' ? exportData.cleaned : exportData.original}
                  />
                </div>
              )}
            </>
          );
        })()}

        <Faq />
      </main>
      <Footer />
    </div>
  );
}
