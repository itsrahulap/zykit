import { downloadText } from '../../../shared/utils/dom.utils';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import type { CleanResponse } from '../workers/worker.protocol';

function describe(report: ImageMetadataReport, name: string, declaredType?: string) {
  return {
    file: {
      name,
      size: report.fileSize,
      format: report.format,
      mimeType: report.mimeType,
      ...(declaredType !== undefined ? { declaredType } : {}),
      width: report.width,
      height: report.height,
      megapixels: report.width && report.height ? +((report.width * report.height) / 1e6).toFixed(3) : undefined,
      orientation: report.orientation,
      checksums: report.file.checksums,
      headHex: report.file.headHex,
    },
    technical: report.technical,
    metadata: report.entries.map((e) => ({
      category: e.category,
      key: e.key,
      value: e.value,
      location: e.location,
      tags: [e.sensitive && 'privacy', e.generatorRelated && 'generator', e.provenanceRelated && 'provenance'].filter(Boolean),
    })),
    containers: report.blocks,
    signals: report.signals,
    warnings: report.warnings,
  };
}

/** Everything shown in the UI as one JSON document. Generated locally. */
export function buildMetadataExport(fileName: string, declaredType: string, report: ImageMetadataReport, cleaned?: { name: string; result: CleanResponse }) {
  return {
    generator: 'CleanImage',
    exportedAt: new Date().toISOString(),
    original: describe(report, fileName, declaredType),
    ...(cleaned
      ? {
          cleaned: {
            ...describe(cleaned.result.cleaned, cleaned.name),
            removedFields: cleaned.result.diff.removed.length,
            retainedFields: cleaned.result.diff.retained.map((e) => `${e.category}:${e.key}`),
            verification: cleaned.result.validation,
            log: cleaned.result.log,
          },
        }
      : {}),
  };
}

export function downloadJson(data: unknown, fileName: string) {
  downloadText(JSON.stringify(data, null, 2), fileName, 'application/json');
}
