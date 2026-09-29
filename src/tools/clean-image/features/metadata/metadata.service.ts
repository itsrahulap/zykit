import { LIMITS } from '../../config/limits';
import { ParseError } from '../../../../shared/lib/bytes';
import { AppError } from '../../../../shared/lib/errors';
import { computeChecksums, headAscii, headHex } from '../../../../shared/lib/hash';
import { FORMAT_LABELS, MIME_TYPES, type ImageFormat } from '../../types/image.types';
import { detectFormat } from '../formats/detect';
import { buildSignals, classify } from './classify';
import { scanJpeg } from './jpeg.parser';
import {
  CATEGORY_ORDER,
  type FormatScan,
  type ImageMetadataReport,
  type MetadataCategory,
  type MetadataEntry,
} from './metadata.types';
import { scanPng } from './png.parser';
import { scanWebp } from './webp.parser';

// Strip control characters (keep tab/newline) so hostile metadata can't mess with layout.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function normalizeValue(value: string): string {
  const clean = value.replace(CONTROL_CHARS, '');
  if (clean.length <= LIMITS.MAX_VALUE_LENGTH) return clean;
  return `${clean.slice(0, LIMITS.MAX_VALUE_LENGTH)}… (${clean.length.toLocaleString('en-US')} characters total)`;
}

export function requireSupportedFormat(bytes: Uint8Array): ImageFormat {
  const format = detectFormat(bytes);
  if (format === 'jpeg' || format === 'png' || format === 'webp') return format;
  if (format === 'unknown')
    throw new AppError('UNSUPPORTED_FORMAT', "This file doesn't look like a JPEG, PNG or WebP image.");
  throw new AppError('UNSUPPORTED_FORMAT', `${FORMAT_LABELS[format]} images aren't supported yet. Supported formats: JPEG, PNG, WebP.`);
}

async function scan(format: ImageFormat, bytes: Uint8Array): Promise<FormatScan> {
  try {
    if (format === 'jpeg') return scanJpeg(bytes);
    if (format === 'png') return await scanPng(bytes);
    return scanWebp(bytes);
  } catch (err) {
    if (err instanceof ParseError)
      throw new AppError('CORRUPT', `The ${FORMAT_LABELS[format]} file appears to be damaged: ${err.message}.`);
    throw err;
  }
}

export async function analyzeImage(bytes: Uint8Array): Promise<ImageMetadataReport> {
  if (bytes.length > LIMITS.MAX_FILE_SIZE) throw new AppError('TOO_LARGE', 'This file is larger than the supported limit.');
  const format = requireSupportedFormat(bytes);
  const result = await scan(format, bytes);

  if (result.width && result.height && result.width * result.height > LIMITS.MAX_PIXELS) {
    throw new AppError(
      'TOO_MANY_PIXELS',
      `This image is ${result.width.toLocaleString('en-US')} × ${result.height.toLocaleString('en-US')} pixels, which exceeds the ${(LIMITS.MAX_PIXELS / 1e6).toFixed(0)}-megapixel safety limit.`,
    );
  }

  const blockAction = new Map(result.blocks.map((b) => [b.location, b.action]));
  const entries: MetadataEntry[] = result.entries.slice(0, LIMITS.MAX_ENTRIES).map((e) => {
    const value = normalizeValue(e.value);
    const key = normalizeValue(e.key).slice(0, 200);
    return {
      category: e.category,
      key,
      value,
      location: e.location,
      ...classify(e.category, key, value),
      removable: blockAction.get(e.location) !== 'keep',
    };
  });
  if (result.entries.length > LIMITS.MAX_ENTRIES) result.warnings.push('Only the first 5,000 metadata fields are shown.');

  // Hidden copies of the picture can reveal what was cropped out or edited away.
  const hiddenImages = [
    ...(entries.some((e) => e.key === 'EmbeddedThumbnail') ? ['an EXIF thumbnail'] : []),
    ...(entries.some((e) => e.key === 'PhotoshopThumbnail') ? ['a Photoshop thumbnail'] : []),
    ...(result.blocks.some((b) => b.location === 'APP0 (JFIF thumbnail)') ? ['a JFIF thumbnail'] : []),
    ...(result.blocks.some((b) => b.location === 'Data after end of image' && b.note?.includes('embedded image'))
      ? ['an extra image appended to the file']
      : []),
  ];
  if (hiddenImages.length) {
    result.warnings.push(
      `This file contains ${hiddenImages.join(', ')}. Embedded previews can show the original, uncropped or unedited picture. Cleaning removes them.`,
    );
  }

  const categoryCounts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])) as Record<MetadataCategory, number>;
  for (const e of entries) categoryCounts[e.category]++;
  const hasBlock = (c: MetadataCategory) => result.blocks.some((b) => b.category === c);

  return {
    format,
    mimeType: MIME_TYPES[format],
    width: result.width,
    height: result.height,
    fileSize: bytes.length,
    orientation: result.orientation,
    entries,
    blocks: result.blocks,
    signals: buildSignals(result.entries, result.c2pa, hasBlock('C2PA')),
    warnings: [...new Set(result.warnings)],
    technical: result.technical,
    file: { checksums: await computeChecksums(bytes), headHex: headHex(bytes), headAscii: headAscii(bytes) },
    summary: {
      hasExif: hasBlock('EXIF'),
      hasXmp: hasBlock('XMP'),
      hasIptc: hasBlock('IPTC'),
      hasPngText: hasBlock('PNG_TEXT'),
      hasC2pa: hasBlock('C2PA'),
      hasGeneratorRelatedData: entries.some((e) => e.generatorRelated),
      hasSensitiveData: entries.some((e) => e.sensitive),
      categoryCounts,
    },
  };
}
