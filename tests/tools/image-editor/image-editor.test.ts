import { describe, expect, it } from 'vitest';
import { arrowDelta, clampRect, dragHandle, fitAspect, moveRect } from '../../../src/tools/image-editor/features/crop';
import { createHistory, GROUP_MS, MAX_HISTORY, pushState, redo, undo } from '../../../src/tools/image-editor/features/history';
import {
  flipCrop,
  finalSize,
  INITIAL_STATE,
  isUnedited,
  lockedSide,
  NEUTRAL_ADJUST,
  orientedSize,
  rotateCrop,
  turnedRotate,
  type Adjust,
} from '../../../src/tools/image-editor/features/image-editor';
import { applyAdjustments, boxBlur, medianFilter, toneTables } from '../../../src/tools/image-editor/features/pixels';

const adj = (p: Partial<Adjust>): Adjust => ({ ...NEUTRAL_ADJUST, ...p });
const solid = (w: number, h: number, [r, g, b]: number[]) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < d.length; i += 4) d.set([r, g, b, 255], i);
  return d;
};

describe('geometry', () => {
  it('swaps sides for quarter turns and grows for straightening', () => {
    expect(orientedSize(400, 300, 0, 0)).toEqual({ width: 400, height: 300 });
    expect(orientedSize(400, 300, 90, 0)).toEqual({ width: 300, height: 400 });
    expect(orientedSize(400, 300, 270, 0)).toEqual({ width: 300, height: 400 });
    const t = orientedSize(100, 100, 0, 45);
    expect(t.width).toBe(141);
    expect(t.height).toBe(141);
  });
  it('final size is resize, else crop, else the rotated image', () => {
    const s = { ...INITIAL_STATE };
    expect(finalSize(400, 300, s)).toEqual({ width: 400, height: 300 });
    expect(finalSize(400, 300, { ...s, crop: { x: 1, y: 2, w: 50, h: 40 } })).toEqual({ width: 50, height: 40 });
    expect(finalSize(400, 300, { ...s, crop: { x: 1, y: 2, w: 50, h: 40 }, resize: { width: 10, height: 8 } })).toEqual({ width: 10, height: 8 });
  });
  it('rotates and flips crop rectangles with the image', () => {
    const r = { x: 10, y: 20, w: 30, h: 40 };
    const cw = rotateCrop(r, 100, 80, 'cw');
    expect(cw).toEqual({ x: 80 - 20 - 40, y: 10, w: 40, h: 30 });
    expect(rotateCrop(cw, 80, 100, 'ccw')).toEqual(r);
    expect(flipCrop(r, 100, 80, 'h')).toEqual({ x: 60, y: 20, w: 30, h: 40 });
    expect(flipCrop(flipCrop(r, 100, 80, 'v'), 100, 80, 'v')).toEqual(r);
  });
  it('turns the picture as shown even when it is mirrored', () => {
    expect(turnedRotate({ rotate: 0, flipH: false, flipV: false }, 'cw')).toBe(90);
    expect(turnedRotate({ rotate: 0, flipH: false, flipV: false }, 'ccw')).toBe(270);
    expect(turnedRotate({ rotate: 90, flipH: true, flipV: false }, 'cw')).toBe(0);
    expect(turnedRotate({ rotate: 90, flipH: true, flipV: true }, 'cw')).toBe(180);
  });
  it('locks the aspect ratio of a size', () => {
    expect(lockedSide(200, 400, 300)).toBe(150);
    expect(isUnedited(INITIAL_STATE)).toBe(true);
    expect(isUnedited({ ...INITIAL_STATE, flipH: true })).toBe(false);
  });
});

describe('crop', () => {
  const W = 200, H = 100;
  it('clamps and moves inside the image', () => {
    expect(clampRect({ x: -5, y: 90, w: 500, h: 50 }, W, H)).toEqual({ x: 0, y: 50, w: 200, h: 50 });
    expect(moveRect({ x: 10, y: 10, w: 50, h: 50 }, 500, -500, W, H)).toEqual({ x: 150, y: 0, w: 50, h: 50 });
  });
  it('drags free handles and keeps a minimum size', () => {
    const r = { x: 50, y: 20, w: 100, h: 60 };
    expect(dragHandle(r, 'e', 20, 0, W, H)).toEqual({ x: 50, y: 20, w: 120, h: 60 });
    expect(dragHandle(r, 'nw', -10, -10, W, H)).toEqual({ x: 40, y: 10, w: 110, h: 70 });
    expect(dragHandle(r, 'w', 1000, 0, W, H).w).toBe(8);
    expect(dragHandle(r, 's', 0, 1000, W, H).h).toBe(80);
  });
  it('keeps the ratio when dragging with an aspect lock', () => {
    const r = { x: 20, y: 20, w: 80, h: 40 };
    for (const handle of ['se', 'nw', 'e', 'n'] as const) {
      const out = dragHandle(r, handle, handle.includes('n') || handle.includes('w') ? -10 : 15, handle === 'e' ? 0 : 7, W, H, 2);
      expect(Math.abs(out.w / out.h - 2)).toBeLessThan(0.06);
      expect(out.x).toBeGreaterThanOrEqual(0);
      expect(out.x + out.w).toBeLessThanOrEqual(W);
      expect(out.y + out.h).toBeLessThanOrEqual(H);
    }
  });
  it('fits an aspect ratio inside the current rectangle', () => {
    expect(fitAspect({ x: 0, y: 0, w: 200, h: 100 }, 1, W, H)).toEqual({ x: 50, y: 0, w: 100, h: 100 });
    expect(fitAspect({ x: 0, y: 0, w: 200, h: 100 }, 16 / 9, W, H)).toMatchObject({ w: 178, h: 100 });
    expect(fitAspect({ x: 0, y: 0, w: 90, h: 100 }, 1, W, H)).toMatchObject({ w: 90, h: 90 });
  });
  it('maps arrow keys to deltas', () => {
    expect(arrowDelta('ArrowLeft', 10)).toEqual({ dx: -10, dy: 0 });
    expect(arrowDelta('ArrowDown', 1)).toEqual({ dx: 0, dy: 1 });
    expect(arrowDelta('a', 1)).toBeNull();
  });
});

describe('history', () => {
  it('undoes, redoes and drops redo after a new edit', () => {
    let h = createHistory(0);
    h = pushState(h, 1, null, 0);
    h = pushState(h, 2, null, 0);
    h = undo(h);
    expect(h.present).toBe(1);
    h = redo(h);
    expect(h.present).toBe(2);
    h = undo(undo(h));
    expect(h.present).toBe(0);
    h = pushState(h, 9, null, 0);
    expect(h.future).toEqual([]);
    expect(undo(undo(h)).present).toBe(0);
  });
  it('merges quick changes in the same group', () => {
    let h = createHistory(0);
    h = pushState(h, 1, 'brightness', 1000);
    h = pushState(h, 2, 'brightness', 1000 + GROUP_MS - 1);
    expect(h.past).toEqual([0]);
    h = pushState(h, 3, 'contrast', 1500);
    h = pushState(h, 4, 'brightness', 100000);
    expect(h.past).toEqual([0, 2, 3]);
  });
  it('caps the stack', () => {
    let h = createHistory(0);
    for (let i = 1; i <= MAX_HISTORY + 20; i++) h = pushState(h, i);
    expect(h.past).toHaveLength(MAX_HISTORY);
  });
});

describe('pixel adjustments', () => {
  it('leaves neutral settings untouched', () => {
    const d = solid(2, 2, [10, 20, 30]);
    expect(applyAdjustments(d, 2, 2, NEUTRAL_ADJUST)).toBe(d);
    const [r] = toneTables(NEUTRAL_ADJUST);
    expect(Array.from(r.slice(0, 256)).every((v, i) => v === i)).toBe(true);
  });
  it('brightness, exposure and contrast move values in the right direction', () => {
    const out = (a: Partial<Adjust>, v = 100) => applyAdjustments(solid(1, 1, [v, v, v]), 1, 1, adj(a))[0];
    expect(out({ brightness: 50 })).toBeGreaterThan(100);
    expect(out({ brightness: -50 })).toBeLessThan(100);
    expect(out({ exposure: 50 })).toBeGreaterThan(100);
    expect(out({ exposure: -50 })).toBeLessThan(100);
    expect(out({ contrast: 50 }, 200)).toBeGreaterThan(200);
    expect(out({ contrast: 50 }, 50)).toBeLessThan(50);
  });
  it('temperature warms or cools and tint shifts green', () => {
    const warm = applyAdjustments(solid(1, 1, [128, 128, 128]), 1, 1, adj({ temperature: 100 }));
    expect(warm[0]).toBeGreaterThan(warm[2]);
    const cool = applyAdjustments(solid(1, 1, [128, 128, 128]), 1, 1, adj({ temperature: -100 }));
    expect(cool[2]).toBeGreaterThan(cool[0]);
    const magenta = applyAdjustments(solid(1, 1, [128, 128, 128]), 1, 1, adj({ tint: 100 }));
    expect(magenta[1]).toBeLessThan(magenta[0]);
  });
  it('saturation, vibrance, grayscale and sepia', () => {
    const grey = applyAdjustments(solid(1, 1, [200, 50, 50]), 1, 1, adj({ saturation: -100 }));
    expect(grey[0]).toBe(grey[1]);
    expect(grey[1]).toBe(grey[2]);
    const g = applyAdjustments(solid(1, 1, [10, 200, 30]), 1, 1, adj({ grayscale: true }));
    expect(g[0]).toBe(g[1]);
    expect(g[1]).toBe(g[2]);
    const muted = applyAdjustments(solid(1, 1, [120, 100, 100]), 1, 1, adj({ vibrance: 100 }));
    const vivid = applyAdjustments(solid(1, 1, [255, 20, 20]), 1, 1, adj({ vibrance: 100 }));
    expect(muted[0] - muted[1]).toBeGreaterThan(20);
    expect((muted[0] - muted[1]) / 20).toBeGreaterThan((vivid[0] - vivid[1]) / 235);
    const sepia = applyAdjustments(solid(1, 1, [100, 100, 100]), 1, 1, adj({ sepia: 100 }));
    expect(sepia[0]).toBeGreaterThan(sepia[1]);
    expect(sepia[1]).toBeGreaterThan(sepia[2]);
  });
  it('keeps alpha', () => {
    const d = new Uint8ClampedArray([10, 10, 10, 77]);
    expect(applyAdjustments(d, 1, 1, adj({ brightness: 100, sharpen: 50 }))[3]).toBe(77);
  });
});

describe('spatial filters', () => {
  const spike = () => {
    const d = solid(5, 5, [0, 0, 0]);
    d.set([255, 255, 255, 255], (2 * 5 + 2) * 4);
    return d;
  };
  it('box blur spreads a spike and keeps flat areas flat', () => {
    const b = boxBlur(spike(), 5, 5, 1);
    expect(b[(2 * 5 + 2) * 4]).toBe(Math.round(255 / 9));
    expect(b[(2 * 5 + 1) * 4]).toBeGreaterThan(0);
    expect(Array.from(boxBlur(solid(4, 4, [50, 60, 70]), 4, 4, 2).filter((_, i) => i % 4 === 0))).toEqual(new Array(16).fill(50));
  });
  it('median removes isolated noise', () => {
    expect(medianFilter(spike(), 5, 5, 1)[(2 * 5 + 2) * 4]).toBe(0);
  });
  it('sharpen raises contrast at an edge', () => {
    const d = new Uint8ClampedArray(8 * 1 * 4);
    for (let x = 0; x < 8; x++) d.set(x < 4 ? [100, 100, 100, 255] : [150, 150, 150, 255], x * 4);
    const out = applyAdjustments(d, 8, 1, adj({ sharpen: 100 }));
    expect(out[3 * 4]).toBeLessThan(100);
    expect(out[4 * 4]).toBeGreaterThan(150);
  });
  it('denoise and blur run through applyAdjustments', () => {
    expect(applyAdjustments(spike(), 5, 5, adj({ denoise: 1 }))[(2 * 5 + 2) * 4]).toBe(0);
    expect(applyAdjustments(spike(), 5, 5, adj({ blur: 1 }))[(2 * 5 + 2) * 4]).toBeLessThan(255);
  });
});
