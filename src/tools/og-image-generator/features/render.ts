// Draws the image on a 2D canvas. The layout maths lives in layout.ts; this file only paints.

import { type Design, EMOJI_FALLBACK, fontById } from './design';
import { alignX, contain, fitText, marginFor, sizeById, type Measure } from './layout';

type Ctx = CanvasRenderingContext2D;

function drawBackground(ctx: Ctx, d: Design, w: number, h: number) {
  if (d.bgKind === 'gradient') {
    const a = ((d.angle - 90) * Math.PI) / 180;
    const r = Math.abs((w / 2) * Math.cos(a)) + Math.abs((h / 2) * Math.sin(a));
    const g = ctx.createLinearGradient(w / 2 - Math.cos(a) * r, h / 2 - Math.sin(a) * r, w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
    g.addColorStop(0, d.c1);
    g.addColorStop(1, d.c2);
    ctx.fillStyle = g;
  } else ctx.fillStyle = d.c1;
  ctx.fillRect(0, 0, w, h);
  if (d.bgKind !== 'pattern') return;
  ctx.save();
  ctx.strokeStyle = d.c2;
  ctx.fillStyle = d.c2;
  ctx.globalAlpha = 0.28;
  if (d.pattern === 'dots') {
    for (let y = 24; y < h; y += 40) for (let x = 24 + (((y - 24) / 40) % 2) * 20; x < w; x += 40) ctx.fillRect(x - 2, y - 2, 4, 4);
  } else if (d.pattern === 'grid') {
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 48) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += 48) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  } else {
    ctx.lineWidth = 14;
    ctx.beginPath();
    for (let k = -h; k < w; k += 48) {
      ctx.moveTo(k, h);
      ctx.lineTo(k + h, 0);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Paints the whole design. `logo` is a user-supplied image that stays on this device. */
export function renderOg(ctx: Ctx, d: Design, logo: ImageBitmap | null): void {
  const size = sizeById(d.size);
  const { w: W, h: H } = size;
  const m = marginFor(size);
  const font = fontById(d.font);
  const square = W === H;
  const innerW = W - 2 * m;
  const fontStr = (px: number, weight = font.weight) => `${weight} ${px}px ${font.stack}`;
  const measure = (weight: number): Measure => (t, px) => {
    ctx.font = fontStr(px, weight);
    return ctx.measureText(t).width;
  };

  drawBackground(ctx, d, W, H);
  ctx.textBaseline = 'middle';
  ctx.textAlign = d.align;
  const x = d.align === 'left' ? m : d.align === 'right' ? W - m : W / 2;

  const footerH = d.siteName.trim() ? 52 : 0;
  const top = m;
  const bottom = H - m - footerH;
  const avail = bottom - top;

  const emoji = d.emoji.trim();
  const logoBox = logo ? contain(logo.width, logo.height, 280, square ? 120 : 84, 4) : null;
  const iconH = emoji ? (square ? 150 : 110) : logoBox ? logoBox.h : 0;
  const iconGap = iconH ? 28 : 0;
  const eyebrow = d.eyebrow.trim().toUpperCase();
  const eyebrowSize = square ? 32 : 28;
  const eyebrowH = eyebrow ? eyebrowSize * 1.3 + 18 : 0;
  const sub = fitText(d.subtitle, { maxSize: square ? 44 : 38, minSize: 22, maxWidth: innerW * 0.92, maxHeight: square ? 200 : 120, lineHeight: 1.35, maxLines: 3 }, measure(500));
  const subH = sub.height ? sub.height + 24 : 0;
  const titleAvail = Math.max(60, avail - iconH - iconGap - eyebrowH - subH);
  const title = fitText(d.title.trim() || 'Your title here', { maxSize: square ? 128 : 96, minSize: 34, maxWidth: innerW, maxHeight: titleAvail, lineHeight: 1.12, maxLines: 5 }, measure(font.weight));

  const total = iconH + iconGap + eyebrowH + title.height + subH;
  let y = top + Math.max(0, (avail - total) / 2);

  if (emoji) {
    ctx.font = `${iconH * 0.85}px ${EMOJI_FALLBACK}`;
    ctx.fillStyle = d.textColor;
    ctx.fillText(emoji, x, y + iconH / 2);
  } else if (logo && logoBox) {
    ctx.drawImage(logo, alignX(d.align, W, m, logoBox.w), y, logoBox.w, logoBox.h);
  }
  y += iconH + iconGap;

  if (eyebrow) {
    ctx.font = fontStr(eyebrowSize, 700);
    ctx.fillStyle = d.accent;
    ctx.fillText(eyebrow, x, y + eyebrowSize * 0.65, innerW);
    y += eyebrowH;
  }

  ctx.font = fontStr(title.size);
  ctx.fillStyle = d.textColor;
  const lh = title.size * 1.12;
  title.lines.forEach((line, i) => ctx.fillText(line, x, y + lh * (i + 0.5)));
  y += title.height;

  if (sub.lines.length) {
    y += 24;
    ctx.font = fontStr(sub.size, 500);
    ctx.globalAlpha = 0.82;
    const slh = sub.size * 1.35;
    sub.lines.forEach((line, i) => ctx.fillText(line, x, y + slh * (i + 0.5)));
    ctx.globalAlpha = 1;
  }

  if (footerH) {
    ctx.font = fontStr(square ? 34 : 30, 700);
    ctx.fillStyle = d.accent;
    ctx.fillText(d.siteName.trim(), x, H - m - 16, innerW);
  }
}
