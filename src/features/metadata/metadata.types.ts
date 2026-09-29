import type { FileChecksums } from '../../lib/hash';
import type { ImageFormat } from '../../types/image.types';

/** Structural facts about the encoding (not removable metadata). */
export interface TechnicalField {
  group: string;
  key: string;
  value: string;
}

export type MetadataCategory =
  | 'EXIF'
  | 'XMP'
  | 'IPTC'
  | 'PNG_TEXT'
  | 'JPEG_COMMENT'
  | 'ICC'
  | 'C2PA'
  | 'OTHER';

export const CATEGORY_ORDER: MetadataCategory[] = [
  'EXIF',
  'XMP',
  'IPTC',
  'PNG_TEXT',
  'JPEG_COMMENT',
  'C2PA',
  'ICC',
  'OTHER',
];

export const CATEGORY_LABELS: Record<MetadataCategory, string> = {
  EXIF: 'EXIF',
  XMP: 'XMP',
  IPTC: 'IPTC / Photoshop',
  PNG_TEXT: 'PNG text',
  JPEG_COMMENT: 'JPEG comment',
  ICC: 'ICC color profile',
  C2PA: 'C2PA / Content Credentials',
  OTHER: 'Other embedded data',
};

export type SanitizeMode = 'privacy' | 'all';

/**
 * What the sanitizer does with a container:
 * - remove: removed in every mode
 * - keep-in-privacy: kept by "Clean privacy metadata", removed by "Remove all supported"
 * - keep: never removed (required for correct decoding)
 */
export type BlockAction = 'remove' | 'keep-in-privacy' | 'keep';

/** A physical metadata container inside the file (JPEG segment, PNG chunk, RIFF chunk…). */
export interface MetadataBlock {
  category: MetadataCategory;
  /** Human-readable container name, e.g. "APP1 (EXIF)" or "tEXt chunk". */
  location: string;
  size: number;
  action: BlockAction;
  note?: string;
}

export interface MetadataEntry {
  category: MetadataCategory;
  key: string;
  value: string;
  /** Container the entry came from. */
  location: string;
  sensitive: boolean;
  generatorRelated: boolean;
  provenanceRelated: boolean;
  removable: boolean;
}

export type SignalLevel = 'declared' | 'present' | 'hint';

/** A notable AI/provenance observation. Never a verdict. */
export interface ProvenanceSignal {
  level: SignalLevel;
  title: string;
  detail: string;
}

export interface ImageMetadataReport {
  format: ImageFormat;
  mimeType: string;
  width?: number;
  height?: number;
  fileSize: number;
  orientation?: number;
  entries: MetadataEntry[];
  blocks: MetadataBlock[];
  signals: ProvenanceSignal[];
  warnings: string[];
  technical: TechnicalField[];
  file: {
    checksums: FileChecksums;
    headHex: string;
    headAscii: string;
  };
  summary: {
    hasExif: boolean;
    hasXmp: boolean;
    hasIptc: boolean;
    hasPngText: boolean;
    hasC2pa: boolean;
    hasGeneratorRelatedData: boolean;
    hasSensitiveData: boolean;
    categoryCounts: Record<MetadataCategory, number>;
  };
}

/** Raw entry produced by a format parser before classification. */
export interface RawEntry {
  category: MetadataCategory;
  key: string;
  value: string;
  location: string;
}

/** Output of a format-specific scan. */
export interface FormatScan {
  width?: number;
  height?: number;
  orientation?: number;
  blocks: MetadataBlock[];
  entries: RawEntry[];
  warnings: string[];
  technical: TechnicalField[];
  c2pa?: { generator?: string; declaresAi: boolean };
}

export function shouldRemove(action: BlockAction, mode: SanitizeMode): boolean {
  return action === 'remove' || (action === 'keep-in-privacy' && mode === 'all');
}
