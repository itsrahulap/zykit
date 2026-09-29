// Pure parts of the Favicon Generator: the ICO container, the web manifest and the HTML snippet.

export interface IcoImage {
  width: number;
  height: number;
  /** A complete PNG file (ICO has allowed PNG entries since Windows Vista). */
  png: Uint8Array;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Write a multi-size .ico: ICONDIR, one ICONDIRENTRY per image, then the PNG data. */
export function buildIco(images: IcoImage[]): Uint8Array {
  if (!images.length || images.length > 255) throw new RangeError('An ICO needs between 1 and 255 images.');
  for (const img of images) {
    if (img.width < 1 || img.width > 256 || img.height < 1 || img.height > 256) throw new RangeError('ICO images must be 1–256 pixels on each side.');
    if (!PNG_SIGNATURE.every((b, i) => img.png[i] === b)) throw new TypeError('ICO entries must be PNG files.');
  }
  const headerSize = 6 + 16 * images.length;
  const out = new Uint8Array(headerSize + images.reduce((s, i) => s + i.png.length, 0));
  const v = new DataView(out.buffer);
  v.setUint16(0, 0, true); // reserved
  v.setUint16(2, 1, true); // type: icon
  v.setUint16(4, images.length, true);
  let offset = headerSize;
  images.forEach((img, i) => {
    const e = 6 + 16 * i;
    out[e] = img.width === 256 ? 0 : img.width; // 0 means 256
    out[e + 1] = img.height === 256 ? 0 : img.height;
    out[e + 2] = 0; // palette colours
    out[e + 3] = 0; // reserved
    v.setUint16(e + 4, 1, true); // colour planes
    v.setUint16(e + 6, 32, true); // bits per pixel
    v.setUint32(e + 8, img.png.length, true);
    v.setUint32(e + 12, offset, true);
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

export interface IcoEntry {
  width: number;
  height: number;
  bitCount: number;
  size: number;
  offset: number;
}

/** Read an ICO directory back (used to verify what we wrote). */
export function readIcoDirectory(b: Uint8Array): IcoEntry[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length < 6 || v.getUint16(0, true) !== 0 || v.getUint16(2, true) !== 1) throw new TypeError('Not an ICO file.');
  const count = v.getUint16(4, true);
  if (b.length < 6 + 16 * count) throw new TypeError('Truncated ICO directory.');
  return Array.from({ length: count }, (_, i) => {
    const e = 6 + 16 * i;
    const entry = { width: b[e] || 256, height: b[e + 1] || 256, bitCount: v.getUint16(e + 6, true), size: v.getUint32(e + 8, true), offset: v.getUint32(e + 12, true) };
    if (entry.offset + entry.size > b.length) throw new TypeError('ICO entry points past the end of the file.');
    return entry;
  });
}

export interface FaviconFile {
  name: string;
  size: number;
  purpose: string;
}

export const ICO_SIZES = [16, 32, 48];

export const PNG_FILES: FaviconFile[] = [
  { name: 'favicon-16x16.png', size: 16, purpose: 'Browser tabs' },
  { name: 'favicon-32x32.png', size: 32, purpose: 'Browser tabs on high-DPI screens' },
  { name: 'apple-touch-icon.png', size: 180, purpose: 'iPhone and iPad home screen' },
  { name: 'android-chrome-192x192.png', size: 192, purpose: 'Android home screen' },
  { name: 'android-chrome-512x512.png', size: 512, purpose: 'Android splash screen and install' },
];

export interface SiteInfo {
  name: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  /** Where the files will live on the site, e.g. "/" or "/assets/icons/". */
  basePath: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Normalise a base path to "/…/" with safe characters only. */
export function normalizeBasePath(p: string): string {
  const clean = p.trim().replace(/[^\w\-./~]/g, '').replace(/\/{2,}/g, '/');
  if (!clean || clean === '/') return '/';
  return `${clean.startsWith('/') || clean.startsWith('.') ? '' : '/'}${clean}${clean.endsWith('/') ? '' : '/'}`;
}

export function buildManifest(site: SiteInfo): string {
  const base = normalizeBasePath(site.basePath);
  return (
    JSON.stringify(
      {
        name: site.name.trim() || 'My site',
        short_name: (site.shortName.trim() || site.name.trim() || 'Site').slice(0, 30),
        icons: [192, 512].map((s) => ({ src: `${base}android-chrome-${s}x${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })),
        theme_color: HEX.test(site.themeColor) ? site.themeColor : '#ffffff',
        background_color: HEX.test(site.backgroundColor) ? site.backgroundColor : '#ffffff',
        display: 'standalone',
      },
      null,
      2,
    ) + '\n'
  );
}

export function buildHtmlSnippet(site: SiteInfo): string {
  const base = normalizeBasePath(site.basePath);
  const theme = HEX.test(site.themeColor) ? site.themeColor : '#ffffff';
  return [
    `<link rel="icon" href="${base}favicon.ico" sizes="48x48">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${base}favicon-32x32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="${base}favicon-16x16.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${base}apple-touch-icon.png">`,
    `<link rel="manifest" href="${base}site.webmanifest">`,
    `<meta name="theme-color" content="${theme}">`,
  ].join('\n');
}
