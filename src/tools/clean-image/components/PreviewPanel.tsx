import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import { FORMAT_LABELS } from '../types/image.types';
import { formatBytes, formatDimensions } from '../../../shared/utils/format.utils';

export function PreviewPanel({ url, report, caption, label }: { url: string; report: ImageMetadataReport; caption: string; label: string }) {
  return (
    <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="dotted flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-8">
        <div className="checkerboard shadow-lg shadow-slate-900/10">
          <img src={url} alt={`${label} image preview`} className="block max-h-[28rem] w-auto max-w-full object-contain" decoding="async" />
        </div>
        <p className="text-center text-xs tracking-[0.18em] text-slate-500 dark:text-slate-400">{caption}</p>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-6 py-4 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
        <span>
          {FORMAT_LABELS[report.format]} · {formatBytes(report.fileSize)}
        </span>
        <span>{formatDimensions(report.width, report.height)} px</span>
      </figcaption>
    </figure>
  );
}
