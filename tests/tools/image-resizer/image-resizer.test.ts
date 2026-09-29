import { describe, expect, it } from 'vitest';
import { planResize } from '../../../src/shared/lib/image';
import { DEFAULT_SETTINGS, lockedSide, PRESETS, resizedName, resizeJob, resizeSpec } from '../../../src/tools/image-resizer/features/resize';

const ENC = ['image/png', 'image/jpeg', 'image/webp'];

describe('Image Resizer settings', () => {
  it('pixels mode with the lock follows the side typed last', () => {
    expect(resizeSpec({ ...DEFAULT_SETTINGS, width: 800, height: 999 })).toEqual({ mode: 'exact', width: 800 });
    expect(resizeSpec({ ...DEFAULT_SETTINGS, driver: 'height', height: 600 })).toEqual({ mode: 'exact', height: 600 });
    expect(planResize(4000, 3000, resizeSpec({ ...DEFAULT_SETTINGS, width: 800 }))).toMatchObject({ width: 800, height: 600 });
  });

  it('pixels mode without the lock stretches to both sides', () => {
    const spec = resizeSpec({ ...DEFAULT_SETTINGS, lock: false, width: 300, height: 100 });
    expect(planResize(4000, 3000, spec)).toMatchObject({ width: 300, height: 100 });
  });

  it('percentage and box modes', () => {
    expect(planResize(1000, 500, resizeSpec({ ...DEFAULT_SETTINGS, mode: 'percent', percent: 25 }))).toMatchObject({ width: 250, height: 125 });
    const cover = planResize(2000, 1000, resizeSpec({ ...DEFAULT_SETTINGS, mode: 'box', boxWidth: 1080, boxHeight: 1080, fit: 'cover' }));
    expect(cover).toEqual({ width: 1080, height: 1080, sx: 500, sy: 0, sw: 1000, sh: 1000 });
    const contain = planResize(2000, 1000, resizeSpec({ ...DEFAULT_SETTINGS, mode: 'box', boxWidth: 1080, boxHeight: 1080, fit: 'contain' }));
    expect(contain).toMatchObject({ width: 1080, height: 540 });
  });

  it('computes the locked side and keeps formats', () => {
    expect(lockedSide(1920, 4000, 3000)).toBe(1440);
    expect(lockedSide(1, 10000, 10)).toBe(1);
    expect(resizeJob('image/gif', DEFAULT_SETTINGS, ENC).type).toBe('image/png');
    expect(resizeJob('image/jpeg', DEFAULT_SETTINGS, ENC)).toMatchObject({ type: 'image/jpeg', quality: 0.9 });
    expect(resizeJob('image/png', DEFAULT_SETTINGS, ENC).quality).toBeUndefined();
    expect(resizeJob('image/png', { ...DEFAULT_SETTINGS, format: 'image/webp' }, ENC).type).toBe('image/webp');
  });

  it('has sane presets and names', () => {
    expect(PRESETS.find((p) => p.label === '4K')).toMatchObject({ width: 3840, height: 2160 });
    expect(PRESETS.every((p) => p.width > 0 && p.height > 0)).toBe(true);
    expect(resizedName('cat.jpeg', 'image/jpeg', 800, 600)).toBe('cat-800x600.jpg');
  });
});
