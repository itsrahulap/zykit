import { describe, expect, it } from 'vitest';
import { detectFormat } from '../../../../src/tools/clean-image/features/formats/detect';
import { classify } from '../../../../src/tools/clean-image/features/metadata/classify';
import type { MetadataEntry } from '../../../../src/tools/clean-image/features/metadata/metadata.types';
import { diffMetadata } from '../../../../src/tools/clean-image/features/validation/metadata.diff';
import { cleanFileName } from '../../../../src/tools/clean-image/utils/file.utils';
import { formatBytes } from '../../../../src/shared/utils/format.utils';
import { buildJpeg, buildPng, buildWebp } from '../fixtures/builders';

const entry = (key: string, value: string): MetadataEntry => ({
  category: 'EXIF', key, value, location: 'APP1 (EXIF)', sensitive: false, generatorRelated: false, provenanceRelated: false, removable: true,
});

describe('metadata diff', () => {
  it('splits entries into removed, retained and added', () => {
    const d = diffMetadata([entry('Make', 'A'), entry('Orientation', '6')], [entry('Orientation', '6'), entry('Software', 'X')]);
    expect(d.removed.map((e) => e.key)).toEqual(['Make']);
    expect(d.retained.map((e) => e.key)).toEqual(['Orientation']);
    expect(d.added.map((e) => e.key)).toEqual(['Software']);
  });
});

describe('classification', () => {
  it('labels privacy and generator fields without claiming detection', () => {
    expect(classify('EXIF', 'GPSLatitude', '1')).toMatchObject({ sensitive: true, generatorRelated: false });
    expect(classify('EXIF', 'Software', 'Adobe Photoshop')).toMatchObject({ generatorRelated: true });
    expect(classify('PNG_TEXT', 'Comment', 'made with Midjourney v6')).toMatchObject({ generatorRelated: true });
    expect(classify('PNG_TEXT', 'Comment', 'holiday at the beach')).toMatchObject({ generatorRelated: false });
    expect(classify('XMP', 'xmpMM:DocumentID', 'xmp.did:123')).toMatchObject({ sensitive: true, provenanceRelated: true });
  });
});

describe('utilities', () => {
  it('detects formats by magic bytes', () => {
    expect(detectFormat(buildJpeg())).toBe('jpeg');
    expect(detectFormat(buildPng())).toBe('png');
    expect(detectFormat(buildWebp())).toBe('webp');
  });

  it('builds download names that match the real format', () => {
    expect(cleanFileName('photo.JPG', 'jpeg')).toBe('photo-clean.jpg');
    expect(cleanFileName('photo.jpeg', 'jpeg')).toBe('photo-clean.jpeg');
    expect(cleanFileName('renamed.jpg', 'png')).toBe('renamed-clean.png');
    expect(cleanFileName('noext', 'webp')).toBe('noext-clean.webp');
    expect(cleanFileName('a/b:c.png', 'png')).toBe('a_b_c-clean.png');
  });

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });
});
