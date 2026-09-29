import { describe, expect, it } from 'vitest';
import { compressJob, compressedName, compressedType, DEFAULT_SETTINGS, pickOutput } from '../../../src/tools/image-compressor/features/compress';

const ALL = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

describe('Image Compressor', () => {
  it('auto keeps lossy formats and turns lossless ones into WebP', () => {
    expect(compressedType('image/jpeg', 'auto', ALL)).toBe('image/jpeg');
    expect(compressedType('image/jpg', 'auto', ALL)).toBe('image/jpeg');
    expect(compressedType('image/avif', 'auto', ALL)).toBe('image/avif');
    expect(compressedType('image/png', 'auto', ALL)).toBe('image/webp');
    expect(compressedType('image/gif', 'auto', ALL)).toBe('image/webp');
  });

  it('falls back to JPEG when WebP or AVIF cannot be encoded', () => {
    const safari = ['image/png', 'image/jpeg'];
    expect(compressedType('image/png', 'auto', safari)).toBe('image/jpeg');
    expect(compressedType('image/avif', 'auto', safari)).toBe('image/jpeg');
    expect(compressedType('image/png', 'image/avif', safari)).toBe('image/avif');
  });

  it('builds a job with quality in 0–1 and an optional max size', () => {
    expect(compressJob('image/jpeg', DEFAULT_SETTINGS, ALL)).toEqual({ type: 'image/jpeg', quality: 0.75, resize: { mode: 'none' } });
    expect(compressJob('image/png', { format: 'image/jpeg', quality: 150, maxWidth: 1920, maxHeight: '' }, ALL)).toEqual({
      type: 'image/jpeg',
      quality: 1,
      resize: { mode: 'max', maxWidth: 1920, maxHeight: undefined },
    });
  });

  it('names the output after the input', () => {
    expect(compressedName('holiday.PNG', 'image/webp')).toBe('holiday-compressed.webp');
    expect(compressedName('.hidden', 'image/jpeg')).toBe('.hidden-compressed.jpg');
  });

  it('keeps the original only when a same-format, same-size re-encode got bigger', () => {
    const orig = { size: 1000, type: 'image/jpeg', name: 'a.jpg' };
    expect(pickOutput(orig, { size: 1200, type: 'image/jpeg', name: 'x', resized: false }, true)).toBe('original');
    expect(pickOutput(orig, { size: 1200, type: 'image/jpeg', name: 'x', resized: false }, false)).toBe('compressed');
    expect(pickOutput(orig, { size: 1200, type: 'image/webp', name: 'x', resized: false }, true)).toBe('compressed');
    expect(pickOutput(orig, { size: 1200, type: 'image/jpeg', name: 'x', resized: true }, true)).toBe('compressed');
    expect(pickOutput(orig, { size: 800, type: 'image/jpeg', name: 'x', resized: false }, true)).toBe('compressed');
  });
});
