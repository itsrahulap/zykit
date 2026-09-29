import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import { FORMAT_LABELS } from '../types/image.types';
import { formatBytes, formatDimensions } from '../utils/format.utils';

export function ImagePreview({ url, label, name, report }: { url: string; label: string; name: string; report: ImageMetadataReport }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="checkerboard flex aspect-[4/3] items-center justify-center">
        <img src={url} alt={`${label} image preview`} className="max-h-full max-w-full object-contain" decoding="async" />
      </div>
      <figcaption className="space-y-1 border-t border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate font-medium text-slate-900 dark:text-slate-100" title={name}>
          {name}
        </p>
        <dl className="grid grid-cols-3 gap-2 text-slate-600 dark:text-slate-400">
          <div>
            <dt className="sr-only">Format</dt>
            <dd>{FORMAT_LABELS[report.format]}</dd>
          </div>
          <div>
            <dt className="sr-only">Size</dt>
            <dd>{formatBytes(report.fileSize)}</dd>
          </div>
          <div>
            <dt className="sr-only">Dimensions</dt>
            <dd>{formatDimensions(report.width, report.height)}</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}
