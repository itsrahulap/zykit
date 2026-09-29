import { describe, expect, it } from 'vitest';
import { convertedName, convertJob, DEFAULT_SETTINGS } from '../../../src/tools/image-converter/features/convert';

describe('Image Converter', () => {
  it('JPEG always gets a background and a quality', () => {
    expect(convertJob(DEFAULT_SETTINGS)).toEqual({ type: 'image/jpeg', quality: 0.9, background: '#ffffff', resize: { mode: 'none' } });
    expect(convertJob({ ...DEFAULT_SETTINGS, background: '#123abc' }).background).toBe('#123abc');
  });

  it('PNG keeps transparency unless flattening, and has no quality', () => {
    expect(convertJob({ ...DEFAULT_SETTINGS, format: 'image/png' })).toEqual({ type: 'image/png', quality: undefined, background: null, resize: { mode: 'none' } });
    expect(convertJob({ ...DEFAULT_SETTINGS, format: 'image/webp', flatten: true, background: '#000000' }).background).toBe('#000000');
  });

  it('rejects malformed colours and clamps quality', () => {
    expect(convertJob({ ...DEFAULT_SETTINGS, background: 'red; x' }).background).toBe('#ffffff');
    expect(convertJob({ ...DEFAULT_SETTINGS, quality: 0 }).quality).toBe(0.01);
  });

  it('renames with the new extension', () => {
    expect(convertedName('scan.final.heic', 'image/jpeg')).toBe('scan.final.jpg');
    expect(convertedName('icon.png', 'image/webp')).toBe('icon.webp');
  });
});
