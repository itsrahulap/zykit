import { CATEGORY_LABELS, type ImageMetadataReport, type MetadataCategory } from '../features/metadata/metadata.types';
import type { ImageFormat } from '../types/image.types';
import { pluralize } from '../../../shared/utils/format.utils';
import { Icon } from '../../../shared/ui/ui';

const RELEVANT: Record<ImageFormat, MetadataCategory[]> = {
  jpeg: ['EXIF', 'XMP', 'IPTC', 'JPEG_COMMENT', 'C2PA', 'ICC', 'OTHER'],
  png: ['EXIF', 'XMP', 'PNG_TEXT', 'C2PA', 'ICC', 'OTHER'],
  webp: ['EXIF', 'XMP', 'C2PA', 'ICC', 'OTHER'],
};

export function MetadataSummary({ report }: { report: ImageMetadataReport }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {RELEVANT[report.format].map((cat) => {
        const blocks = report.blocks.filter((b) => b.category === cat && b.action !== 'keep');
        const count = report.summary.categoryCounts[cat];
        const found = blocks.length > 0;
        if (cat === 'OTHER' && !found) return null;
        return (
          <li
            key={cat}
            className={`rounded-lg border px-3 py-2.5 ${
              found
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
                : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{CATEGORY_LABELS[cat]}</p>
            <p className={`mt-0.5 flex items-center gap-1 text-sm font-semibold ${found ? 'text-amber-900 dark:text-amber-200' : 'text-slate-500'}`}>
              <Icon name={found ? 'info' : 'minus'} className="h-4 w-4" />
              {found ? (count ? pluralize(count, 'field') : 'Found') : 'Not found'}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
