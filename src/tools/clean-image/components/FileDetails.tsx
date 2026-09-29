import type { ReactNode } from 'react';
import { DetailRows, Panel } from '../../../shared/ui/Panel';
import { formatBytes, pluralize } from '../../../shared/utils/format.utils';
import { formatOrientation } from '../features/metadata/exif.parser';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import { FORMAT_LABELS } from '../types/image.types';

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
