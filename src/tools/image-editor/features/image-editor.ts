// Edit model and geometry for the Image Editor: no DOM, so it's unit-testable in Node.
// An edit is a small state object applied to the untouched original in a fixed order:
// rotate/flip/straighten → crop → resize → colour and detail adjustments.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Adjust {
  /** -100…100 for the sliders below. */
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  tint: number;
  vibrance: number;
  /** Unsharp mask amount, 0…100. */
  sharpen: number;
  /** Box blur radius in pixels of the final image, 0…10. */
  blur: number;
  /** Median filter: 0 off, 1 light (3×3), 2 strong (5×5). */
  denoise: 0 | 1 | 2;
  grayscale: boolean;
  /** 0…100. */
  sepia: number;
}

export interface EditState {
  /** Clockwise quarter turn of the original, in degrees (applied first). */
  rotate: 0 | 90 | 180 | 270;
  /** Mirror of the turned image (applied second). */
  flipH: boolean;
  flipV: boolean;
  /** Free rotation (straighten) in degrees, -45…45, applied last, so it always turns the picture as shown. */
  angle: number;
  /** Crop in the coordinates of the rotated image (see `orientedSize`). */
  crop: Rect | null;
  /** Output size after cropping; null keeps the cropped size. */
  resize: { width: number; height: number } | null;
  adjust: Adjust;
}

export const NEUTRAL_ADJUST: Adjust = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  sharpen: 0,
  blur: 0,
  denoise: 0,
  grayscale: false,
  sepia: 0,
};

export const INITIAL_STATE: EditState = { rotate: 0, flipH: false, flipV: false, angle: 0, crop: null, resize: null, adjust: NEUTRAL_ADJUST };

export const isNeutralAdjust = (a: Adjust): boolean => (Object.keys(NEUTRAL_ADJUST) as (keyof Adjust)[]).every((k) => a[k] === NEUTRAL_ADJUST[k]);

export const isUnedited = (s: EditState): boolean =>
  s.rotate === 0 && !s.flipH && !s.flipV && s.angle === 0 && !s.crop && !s.resize && isNeutralAdjust(s.adjust);

/** Size of the image after the quarter turn and straightening; the straightened canvas grows to hold the rotated image. */
export function orientedSize(srcW: number, srcH: number, rotate: number, angle: number): { width: number; height: number } {
  const [w, h] = rotate === 90 || rotate === 270 ? [srcH, srcW] : [srcW, srcH];
  if (!angle) return { width: w, height: h };
  const t = (angle * Math.PI) / 180;
  const c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
  return { width: Math.max(1, Math.round(w * c + h * s)), height: Math.max(1, Math.round(w * s + h * c)) };
}

/** Size of the final image: the resize target, else the crop, else the whole rotated image. */
export function finalSize(srcW: number, srcH: number, s: EditState): { width: number; height: number } {
  if (s.resize) return { width: s.resize.width, height: s.resize.height };
  if (s.crop) return { width: s.crop.w, height: s.crop.h };
  return orientedSize(srcW, srcH, s.rotate, s.angle);
}

/** The crop rectangle after turning the image a quarter turn (W×H is the size before the turn). */
export function rotateCrop(r: Rect, W: number, H: number, dir: 'cw' | 'ccw'): Rect {
  return dir === 'cw' ? { x: H - r.y - r.h, y: r.x, w: r.h, h: r.w } : { x: r.y, y: W - r.x - r.w, w: r.h, h: r.w };
}

export function flipCrop(r: Rect, W: number, H: number, axis: 'h' | 'v'): Rect {
  return axis === 'h' ? { ...r, x: W - r.x - r.w } : { ...r, y: H - r.y - r.h };
}

/** Width or height that keeps `from`'s aspect ratio when the other side is set to `to`. */
export const lockedSide = (to: number, fromA: number, fromB: number): number => Math.max(1, Math.round((to * fromB) / fromA));

export const ASPECTS = [
  { value: 'free', label: 'Free', ratio: null },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '3:2', label: '3:2', ratio: 3 / 2 },
] as const;
export type AspectId = (typeof ASPECTS)[number]['value'];

/** The `rotate` value after turning the picture a quarter turn as shown: a single flip reverses the direction. */
export function turnedRotate(s: Pick<EditState, 'rotate' | 'flipH' | 'flipV'>, dir: 'cw' | 'ccw'): EditState['rotate'] {
  const mirrored = s.flipH !== s.flipV;
  const delta = (dir === 'cw') !== mirrored ? 90 : 270;
  return ((s.rotate + delta) % 360) as EditState['rotate'];
}
