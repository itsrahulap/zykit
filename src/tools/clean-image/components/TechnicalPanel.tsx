import type { ReactNode } from 'react';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import { FORMAT_LABELS } from '../types/image.types';
import { formatBytes } from '../../../shared/utils/format.utils';
import { DetailRows, Panel } from '../../../shared/ui/Panel';

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-slate-100 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-300">
      {children}
    </pre>
  );
}

function Group({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <details open className="group border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
      <summary className="cursor-pointer list-none font-semibold text-slate-900 dark:text-slate-100">
        <span className="mr-2 inline-block text-emerald-600 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true">
          ▸
        </span>
        {title} <span className="font-normal text-slate-500">({rows.length})</span>
      </summary>
      <div className="mt-2">
        <DetailRows rows={rows} />
      </div>
    </details>
  );
}

export function TechnicalPanel({
  report,
  name,
  declaredType,
  rawJson,
}: {
  report: ImageMetadataReport;
  name: string;
  declaredType?: string;
  rawJson: unknown;
}) {
  const groups = [...new Set(report.technical.map((t) => t.group))];
  const ext = name.match(/\.[^.]+$/)?.[0] ?? '—';
  const c = report.file.checksums;
  const mono = (v: string) => <span className="font-mono text-xs sm:text-sm">{v}</span>;

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <Panel eyebrow="Encoding" icon="info">
          {groups.map((g) => (
            <Group key={g} title={g} rows={report.technical.filter((t) => t.group === g).map((t) => [t.key, t.value])} />
          ))}
        </Panel>
      )}

      <Panel eyebrow="Technical file details & checksums" icon="lock">
        <DetailRows
          rows={[
            ['Name', name],
            ['Extension', ext],
            ...(declaredType !== undefined ? ([['Declared type', declaredType || 'None']] as [string, ReactNode][]) : []),
            ['Detected format', `${FORMAT_LABELS[report.format]} (${report.mimeType}), from file signature`],
            ['Size', `${formatBytes(report.fileSize)} (${report.fileSize.toLocaleString('en-US')} bytes)`],
            ['Signature', mono(report.file.headHex.split(' ').slice(0, 16).join(' '))],
            ['MD5', mono(c.md5)],
            ['SHA-1', mono(c.sha1)],
            ['SHA-256', mono(c.sha256)],
            ['SHA-512', mono(c.sha512)],
            ['CRC32', mono(c.crc32)],
            ['Adler32', mono(c.adler32)],
          ]}
        />
        <h3 className="mb-2 mt-6 font-semibold text-slate-800 dark:text-slate-200">First 64 bytes</h3>
        <Code>{report.file.headHex}</Code>
        <h3 className="mb-2 mt-6 font-semibold text-slate-800 dark:text-slate-200">ASCII preview</h3>
        <Code>{report.file.headAscii}</Code>
      </Panel>

      <Panel eyebrow="Raw JSON data" icon="info">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">Show everything as JSON</summary>
          <div className="mt-3 max-h-[32rem] overflow-auto rounded-2xl">
            <Code>{JSON.stringify(rawJson, null, 2)}</Code>
          </div>
        </details>
      </Panel>
    </div>
  );
}
