// Crop rectangle geometry: moving, dragging handles (optionally keeping an aspect ratio) and nudging.
// Everything works in whole pixels of the image being cropped (W×H).

import type { Rect } from './image-editor';

export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
export const MIN_CROP = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Keeps a rectangle inside the image and at least `min` pixels in each direction. */
export function clampRect(r: Rect, W: number, H: number, min = MIN_CROP): Rect {
  const m = Math.min(min, W, H);
  const w = clamp(Math.round(r.w), m, W);
  const h = clamp(Math.round(r.h), m, H);
  return { x: clamp(Math.round(r.x), 0, W - w), y: clamp(Math.round(r.y), 0, H - h), w, h };
}

export function moveRect(r: Rect, dx: number, dy: number, W: number, H: number): Rect {
  return { ...r, x: clamp(Math.round(r.x + dx), 0, W - r.w), y: clamp(Math.round(r.y + dy), 0, H - r.h) };
}

/** Largest rectangle with `ratio` (width / height) inside `r`, centred on it. */
export function fitAspect(r: Rect, ratio: number, W: number, H: number): Rect {
  let w = r.w, h = r.h;
  if (w / h > ratio) w = h * ratio;
  else h = w / ratio;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }, W, H);
}

/** Drags a handle by (dx, dy). With `ratio` the rectangle keeps that width / height. */
export function dragHandle(r: Rect, handle: Handle, dx: number, dy: number, W: number, H: number, ratio: number | null = null): Rect {
  const min = Math.min(MIN_CROP, W, H);
  let x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
  if (handle.includes('w')) x0 = clamp(x0 + dx, 0, x1 - min);
  if (handle.includes('e')) x1 = clamp(x1 + dx, x0 + min, W);
  if (handle.includes('n')) y0 = clamp(y0 + dy, 0, y1 - min);
  if (handle.includes('s')) y1 = clamp(y1 + dy, y0 + min, H);
  if (ratio === null) return clampRect({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, W, H);

  const corner = handle.length === 2;
  let w = x1 - x0, h = y1 - y0;
  if (corner) {
    const ax = handle.includes('w') ? x1 : x0; // the fixed corner
    const ay = handle.includes('n') ? y1 : y0;
    w = Math.max(w, h * ratio);
    const maxW = Math.min(handle.includes('w') ? ax : W - ax, (handle.includes('n') ? ay : H - ay) * ratio);
    w = clamp(w, min, Math.max(min, maxW));
    h = w / ratio;
    return clampRect({ x: handle.includes('w') ? ax - w : ax, y: handle.includes('n') ? ay - h : ay, w, h }, W, H);
  }
  if (handle === 'n' || handle === 's') {
    const cx = r.x + r.w / 2;
    const maxW = 2 * Math.min(cx, W - cx);
    h = Math.min(h, maxW / ratio);
    w = h * ratio;
    return clampRect({ x: cx - w / 2, y: handle === 'n' ? y1 - h : y0, w, h }, W, H);
  }
  const cy = r.y + r.h / 2;
  const maxH = 2 * Math.min(cy, H - cy);
  w = Math.min(w, maxH * ratio);
  h = w / ratio;
  return clampRect({ x: handle === 'w' ? x1 - w : x0, y: cy - h / 2, w, h }, W, H);
}

/** Keyboard arrow → handle drag delta for a handle (arrow direction grows the rectangle on that side). */
export function arrowDelta(key: string, step: number): { dx: number; dy: number } | null {
  switch (key) {
    case 'ArrowLeft': return { dx: -step, dy: 0 };
    case 'ArrowRight': return { dx: step, dy: 0 };
    case 'ArrowUp': return { dx: 0, dy: -step };
    case 'ArrowDown': return { dx: 0, dy: step };
    default: return null;
  }
}
