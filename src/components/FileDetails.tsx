import type { ReactNode } from 'react';
import { formatOrientation } from '../features/metadata/exif.parser';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import { FORMAT_LABELS } from '../types/image.types';
import { formatBytes, pluralize } from '../utils/format.utils';
import { Icon } from './ui';

export function Panel({ eyebrow, icon = 'info', children, className = '' }: { eyebrow: string; icon?: Parameters<typeof Icon>[0]['name']; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <h2 className="eyebrow mb-5 flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon name={icon} className="h-4 w-4" /> {eyebrow}
      </h2>
      {children}
    </section>
  );
}

export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm sm:text-base dark:divide-slate-800">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-6 py-2.5">
          <dt className="shrink-0 text-slate-600 dark:text-slate-400">{k}</dt>
          <dd className="min-w-0 break-words text-right text-slate-900 dark:text-slate-100">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FileDetails({ report }: { report: ImageMetadataReport }) {
  const mp = report.width && report.height ? ((report.width * report.height) / 1e6).toFixed(1) : null;
  const removable = report.entries.filter((e) => e.removable).length;
  const categories = new Set(report.blocks.filter((b) => b.action !== 'keep').map((b) => b.category)).size;
  const encoding = report.technical.find((t) => t.key === 'Encoding process' || t.key === 'Compression' || t.key === 'Color type');

  const rows: [string, ReactNode][] = [
    ['File size', formatBytes(report.fileSize)],
    ['Image size', report.width && report.height ? `${report.width.toLocaleString('en-US')} × ${report.height.toLocaleString('en-US')} px · ${mp} MP` : 'Unknown'],
    ['File type', `${FORMAT_LABELS[report.format]} image`],
  ];
  if (encoding) rows.push([encoding.key, encoding.value]);
  if (report.orientation) rows.push(['Orientation', formatOrientation(report.orientation)]);
  rows.push([
    'Embedded metadata',
    removable ? `${pluralize(removable, 'field')} in ${pluralize(categories, 'group')}` : 'None found',
  ]);
  rows.push(['Privacy-sensitive fields', report.summary.hasSensitiveData ? 'Yes' : 'None found']);
  rows.push(['AI / provenance markers', report.signals.length ? pluralize(report.signals.length, 'marker') : 'None found']);

  return (
    <Panel eyebrow="File details" icon="info">
      <DetailRows rows={rows} />
    </Panel>
  );
}
