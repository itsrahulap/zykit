// Payload builders for common QR content types, plus SVG output and a colour contrast check.

import type { QrCode } from './qr';

export type ContentType = 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'geo';

export interface WifiInput {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

/** Escapes \ ; , : " with a backslash, as the Wi-Fi (ZXing) format requires. */
export const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

export function wifiPayload(w: WifiInput): string {
  let s = `WIFI:T:${w.security};S:${escapeWifi(w.ssid)};`;
  if (w.security !== 'nopass') s += `P:${escapeWifi(w.password)};`;
  if (w.hidden) s += 'H:true;';
  return s + ';';
}

export function emailPayload(to: string, subject: string, body: string): string {
  const q: string[] = [];
  if (subject) q.push(`subject=${encodeURIComponent(subject)}`);
  if (body) q.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${to.trim()}${q.length ? `?${q.join('&')}` : ''}`;
}

const phoneDigits = (s: string) => s.replace(/[^\d+*#]/g, '');

export const phonePayload = (number: string) => `tel:${phoneDigits(number)}`;

/** SMSTO:number:message — understood by both Android and iOS scanners. */
export const smsPayload = (number: string, message: string) => `SMSTO:${phoneDigits(number)}:${message}`;

export interface VCardInput {
  firstName: string;
  lastName: string;
  org: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
}

/** vCard 3.0 text value escaping (RFC 2426 §4): backslash, comma, semicolon and newlines. */
export const escapeVCard = (s: string) => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n');

export function vcardPayload(v: VCardInput): string {
  const e = escapeVCard;
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(v.lastName)};${e(v.firstName)};;;`, `FN:${e([v.firstName, v.lastName].filter(Boolean).join(' ') || v.org)}`];
  if (v.org) lines.push(`ORG:${e(v.org)}`);
  if (v.title) lines.push(`TITLE:${e(v.title)}`);
  if (v.phone) lines.push(`TEL;TYPE=CELL:${e(v.phone)}`);
  if (v.email) lines.push(`EMAIL:${e(v.email)}`);
  if (v.url) lines.push(`URL:${e(v.url)}`);
  if (v.street || v.city || v.postcode || v.country) lines.push(`ADR;TYPE=WORK:;;${e(v.street)};${e(v.city)};;${e(v.postcode)};${e(v.country)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export type GeoResult = { ok: true; payload: string } | { ok: false; error: string };

export function geoPayload(lat: string, lng: string): GeoResult {
  const a = Number(lat.trim());
  const b = Number(lng.trim());
  if (!lat.trim() || !lng.trim() || !Number.isFinite(a) || !Number.isFinite(b)) return { ok: false, error: 'Enter a latitude and longitude in decimal degrees.' };
  if (a < -90 || a > 90) return { ok: false, error: 'Latitude must be between -90 and 90.' };
  if (b < -180 || b > 180) return { ok: false, error: 'Longitude must be between -180 and 180.' };
  return { ok: true, payload: `geo:${a},${b}` };
}

// ---- Output -------------------------------------------------------------------------------

/** One SVG path for all dark modules (horizontal runs merged), in module units offset by the quiet zone. */
export function modulesPath(qr: Pick<QrCode, 'modules' | 'size'>, quiet: number): string {
  let d = '';
  for (let y = 0; y < qr.size; y++) {
    let x = 0;
    while (x < qr.size) {
      if (!qr.modules[y][x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < qr.size && qr.modules[y][x]) x++;
      d += `M${start + quiet} ${y + quiet}h${x - start}v1h${start - x}z`;
    }
  }
  return d;
}

const HEX = /^#[0-9a-f]{6}$/i;
const safeColor = (c: string, fallback: string) => (HEX.test(c) ? c : fallback);
const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface SvgOptions {
  quiet: number;
  size: number;
  foreground: string;
  background: string;
  /** Data URL of a logo drawn over the centre. */
  logo?: string | null;
  /** Logo width as a fraction of the symbol width (without quiet zone). */
  logoScale?: number;
}

export function toSvg(qr: Pick<QrCode, 'modules' | 'size'>, o: SvgOptions): string {
  const dim = qr.size + o.quiet * 2;
  const fg = safeColor(o.foreground, '#000000');
  const bg = safeColor(o.background, '#ffffff');
  let logo = '';
  if (o.logo && /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(o.logo)) {
    const w = qr.size * (o.logoScale ?? 0.22);
    const p = (dim - w) / 2;
    const r = (n: number) => Math.round(n * 1000) / 1000;
    logo = `<rect x="${r(p - 0.5)}" y="${r(p - 0.5)}" width="${r(w + 1)}" height="${r(w + 1)}" fill="${bg}"/><image href="${escapeXml(o.logo)}" x="${r(p)}" y="${r(p)}" width="${r(w)}" height="${r(w)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${o.size}" height="${o.size}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="${bg}"/><path fill="${fg}" d="${modulesPath(qr, o.quiet)}"/>${logo}</svg>`
  );
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two #rrggbb colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(safeColor(a, '#000000'));
  const lb = luminance(safeColor(b, '#ffffff'));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Warnings about colours that scanners struggle with. */
export function colorWarnings(fg: string, bg: string): string[] {
  const out: string[] = [];
  const ratio = contrastRatio(fg, bg);
  if (ratio < 4) out.push(`Low contrast (${ratio.toFixed(1)}:1). Many scanners need a clearly darker foreground; aim for at least 4:1.`);
  if (luminance(safeColor(fg, '#000000')) > luminance(safeColor(bg, '#ffffff'))) out.push('Light modules on a dark background (inverted) are not supported by every scanner.');
  return out;
}
