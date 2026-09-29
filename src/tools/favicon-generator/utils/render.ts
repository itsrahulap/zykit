// Draws the icon at each size with canvas (browser only).

import { encodeCanvas, makeCanvas, planResize, resample } from '../../../shared/lib/image';
import { buildIco, ICO_SIZES, PNG_FILES } from '../features/favicon';

export type Shape = 'square' | 'rounded' | 'circle';

export interface IconDesign {
  source: 'text' | 'image';
  text: string;
  textColor: string;
  font: 'sans' | 'serif' | 'mono';
  bold: boolean;
  background: string;
  transparent: boolean;
  shape: Shape;
  /** Padding around the content, % of the icon size. */
  padding: number;
  fit: 'contain' | 'cover';
}

const FONTS = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
};
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function shapePath(ctx: Ctx, size: number, shape: Shape) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  else if (shape === 'rounded') ctx.roundRect(0, 0, size, size, size * 0.2);
  else ctx.rect(0, 0, size, size);
}

/** Render one icon. `opaque` forces a solid square background (Apple touch icons). */
export async function renderIcon(size: number, d: IconDesign, bitmap: ImageBitmap | null, opaque = false) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d') as Ctx;
  ctx.imageSmoothingQuality = 'high';
  const shape = opaque ? 'square' : d.shape;
  shapePath(ctx, size, shape);
  ctx.save();
  ctx.clip();
  if (!d.transparent || opaque) {
    ctx.fillStyle = d.transparent ? '#ffffff' : d.background;
    ctx.fillRect(0, 0, size, size);
  }
  const pad = Math.round((size * d.padding) / 100);
  const inner = Math.max(1, size - 2 * pad);

  if (d.source === 'image' && bitmap) {
    const plan = planResize(bitmap.width, bitmap.height, { mode: 'box', width: inner, height: inner, fit: d.fit });
    const scaled = await resample(bitmap, plan);
    ctx.drawImage(scaled, pad + (inner - plan.width) / 2, pad + (inner - plan.height) / 2);
  } else if (d.source === 'text' && d.text.trim()) {
    const text = [...d.text.trim()].slice(0, 4).join('');
    const family = `${FONTS[d.font]}, ${EMOJI}`;
    const weight = d.bold ? '700' : '400';
    let px = inner;
    ctx.font = `${weight} ${px}px ${family}`;
    let m = ctx.measureText(text);
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight || m.width;
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || px;
    px = Math.max(1, px * Math.min(inner / w, inner / h));
    ctx.font = `${weight} ${px}px ${family}`;
    m = ctx.measureText(text);
    ctx.fillStyle = d.textColor;
    ctx.textBaseline = 'alphabetic';
    // Centre the ink box, not the advance box, so letters and emoji sit visually centred.
    const x = size / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
    const y = size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
  return encodeCanvas(canvas, 'image/png');
}

export interface GeneratedFavicons {
  /** name → PNG/ICO blob */
  files: { name: string; blob: Blob; size?: number }[];
}

export async function generateFavicons(d: IconDesign, bitmap: ImageBitmap | null): Promise<GeneratedFavicons> {
  const ico = await Promise.all(ICO_SIZES.map(async (s) => ({ width: s, height: s, png: new Uint8Array(await (await renderIcon(s, d, bitmap)).arrayBuffer()) })));
  const files: GeneratedFavicons['files'] = [{ name: 'favicon.ico', blob: new Blob([buildIco(ico) as BlobPart], { type: 'image/x-icon' }) }];
  for (const f of PNG_FILES) files.push({ name: f.name, size: f.size, blob: await renderIcon(f.size, d, bitmap, f.name === 'apple-touch-icon.png') });
  return { files };
}
