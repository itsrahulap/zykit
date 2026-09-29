import { useState } from 'react';
import { useImageProcessor } from './app/useImageProcessor';
import { BeforeAfter } from './components/BeforeAfter';
import { ImagePreview } from './components/ImagePreview';
import { ImageUploader } from './components/ImageUploader';
import { MetadataSummary } from './components/MetadataSummary';
import { MetadataTable } from './components/MetadataTable';
import { ProcessingProgress } from './components/ProcessingProgress';
import { SanitizeOptions } from './components/SanitizeOptions';
import { SignalsPanel } from './components/SignalsPanel';
import { DetectorNote, ErrorAlert, Footer, Header, Hero, HowItWorks } from './components/StaticSections';
import { Badge, Button, Card, Icon } from './components/ui';
import { ValidationReport } from './components/ValidationReport';
import { cleanFileName } from './utils/file.utils';
import { pluralize } from './utils/format.utils';

export default function App() {
  const { state, error, dismissError, selectFile, clean, cancel, reset } = useImageProcessor();
  const [showCleanedFields, setShowCleanedFields] = useState(false);
  const hasFile = state.status !== 'idle';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header
        right={
          hasFile && state.status !== 'analyzing' ? (
            <>
              <ImageUploader onFile={selectFile} compact />
              <Button variant="ghost" onClick={reset}>
                Start over
              </Button>
            </>
          ) : null
        }
      />

      <main id="main" className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        {error && <ErrorAlert message={error} onDismiss={dismissError} />}

        {(state.status === 'idle' || state.status === 'analyzing') && (
          <div className="space-y-10">
            <Hero />
            <div className="mx-auto max-w-2xl">
              {state.status === 'analyzing' ? (
                <ProcessingProgress stage={state.stage} stages={['reading', 'analyzing']} onCancel={cancel} />
              ) : (
                <ImageUploader onFile={selectFile} />
              )}
            </div>
            <HowItWorks />
          </div>
        )}

        {(state.status === 'ready' || state.status === 'sanitizing' || state.status === 'completed') && (
          <>
            {state.report.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-medium">Notes about this file</p>
                <ul className="mt-1 list-disc pl-5">
                  {state.report.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {state.status === 'completed' ? (
              <>
                <div
                  className={`flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between ${
                    state.result.validation.ok
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100'
                  }`}
                  role="status"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={state.result.validation.ok ? 'check' : 'warn'} className="h-7 w-7 shrink-0" />
                    <div>
                      <p className="text-lg font-semibold">
                        {state.result.validation.ok ? 'Your clean image is ready' : 'Cleaned with warnings'}
                      </p>
                      <p className="text-sm opacity-90">
                        {pluralize(state.result.diff.removed.length, 'metadata field')} removed and verified.
                      </p>
                    </div>
                  </div>
                  <a
                    href={state.cleanedUrl}
                    download={cleanFileName(state.file.name, state.report.format)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
                  >
                    <Icon name="download" className="h-4 w-4" /> Download {cleanFileName(state.file.name, state.report.format)}
                  </a>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ImagePreview url={state.previewUrl} label="Original" name={state.file.name} report={state.report} />
                  <ImagePreview url={state.cleanedUrl} label="Cleaned" name={cleanFileName(state.file.name, state.report.format)} report={state.result.cleaned} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <BeforeAfter original={state.report} cleaned={state.result.cleaned} diff={state.result.diff} />
                  <ValidationReport report={state.result.validation} log={state.result.log} />
                </div>

                <DetectorNote />

                <Card
                  title="Remaining metadata"
                  subtitle="Fields still present in the cleaned file."
                  action={
                    <Button variant="secondary" onClick={() => setShowCleanedFields((v) => !v)} aria-expanded={showCleanedFields}>
                      {showCleanedFields ? 'Hide' : 'Show'} ({state.result.cleaned.entries.length})
                    </Button>
                  }
                >
                  {showCleanedFields ? (
                    <MetadataTable entries={state.result.cleaned.entries} />
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {state.result.cleaned.entries.length === 0
                        ? 'None — no readable metadata remains.'
                        : state.result.cleaned.entries.map((e) => e.key).join(', ')}
                    </p>
                  )}
                </Card>

                <details className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <summary className="cursor-pointer font-semibold">Original metadata ({state.report.entries.length} fields)</summary>
                  <div className="mt-4">
                    <MetadataTable entries={state.report.entries} />
                  </div>
                </details>
              </>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="space-y-6">
                  <ImagePreview url={state.previewUrl} label="Original" name={state.file.name} report={state.report} />
                  <SignalsPanel signals={state.report.signals} />
                </div>
                <div className="space-y-6">
                  <Card
                    title="Metadata found"
                    action={
                      state.report.summary.hasSensitiveData ? <Badge tone="red">Contains privacy-sensitive data</Badge> : undefined
                    }
                  >
                    <MetadataSummary report={state.report} />
                  </Card>

                  {state.status === 'sanitizing' ? (
                    <ProcessingProgress stage={state.stage} stages={['reading', 'analyzing', 'sanitizing', 'validating']} onCancel={cancel} />
                  ) : (
                    <SanitizeOptions report={state.report} onClean={clean} busy={false} />
                  )}

                  <Card title="All fields" subtitle="Everything readable in the file. Values are shown as plain text.">
                    <MetadataTable entries={state.report.entries} />
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
