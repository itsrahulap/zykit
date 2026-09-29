// Programmatic fixture builders. Generating fixtures in code documents exactly
// what each test file contains and avoids committing opaque binaries.

import { deflateSync } from 'node:zlib';
import { buildPngChunk } from '../../src/features/sanitizer/png.sanitizer';

const enc = new TextEncoder();
export const bytes = (s: string) => enc.encode(s);

export function cat(...parts: (Uint8Array | number[])[]): Uint8Array<ArrayBuffer> {
  const arrs = parts.map((p) => (p instanceof Uint8Array ? p : new Uint8Array(p)));
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

// ---------------------------------------------------------------- TIFF / EXIF

type TiffValue =
  | { tag: number; type: 2; value: string }
  | { tag: number; type: 3 | 4; value: number[] }
  | { tag: number; type: 5; value: [number, number][] };

function serializeIfd(tags: TiffValue[], start: number, next = 0): Uint8Array {
  const ifdSize = 2 + tags.length * 12 + 4;
  const head = new DataView(new ArrayBuffer(ifdSize));
  const data: number[] = [];
  head.setUint16(0, tags.length);
  tags.forEach((t, i) => {
    let raw: number[];
    let count: number;
    if (t.type === 2) {
      raw = [...bytes(t.value), 0];
      count = raw.length;
    } else if (t.type === 3) {
      raw = t.value.flatMap((v) => [v >> 8, v & 0xff]);
      count = t.value.length;
    } else if (t.type === 4) {
      raw = t.value.flatMap((v) => [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]);
      count = t.value.length;
    } else {
      raw = t.value.flatMap(([n, d]) =>
        [n, d].flatMap((v) => [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]),
      );
      count = t.value.length;
    }
    const e = 2 + i * 12;
    head.setUint16(e, t.tag);
    head.setUint16(e + 2, t.type);
    head.setUint32(e + 4, count);
    if (raw.length <= 4) {
      raw.forEach((b, j) => head.setUint8(e + 8 + j, b));
    } else {
      head.setUint32(e + 8, start + ifdSize + data.length);
      data.push(...raw);
      if (data.length & 1) data.push(0);
    }
  });
  head.setUint32(ifdSize - 4, next);
  return cat(new Uint8Array(head.buffer), data);
}

/** Big-endian TIFF with IFD0 and optional EXIF / GPS sub-IFDs. */
export function buildTiff(ifd0: TiffValue[], exif: TiffValue[] = [], gps: TiffValue[] = [], thumbnail = false): Uint8Array {
  const withPointers = (exifOff: number, gpsOff: number): TiffValue[] => [
    ...ifd0,
    ...(exif.length ? [{ tag: 0x8769, type: 4 as const, value: [exifOff] }] : []),
    ...(gps.length ? [{ tag: 0x8825, type: 4 as const, value: [gpsOff] }] : []),
  ];
  const size0 = serializeIfd(withPointers(0, 0), 8).length;
  const exifStart = 8 + size0;
  const exifBlock = exif.length ? serializeIfd(exif, exifStart) : new Uint8Array();
  const gpsStart = exifStart + exifBlock.length;
  const gpsBlock = gps.length ? serializeIfd(gps, gpsStart) : new Uint8Array();
  const ifd1Start = gpsStart + gpsBlock.length;
  const ifd1 = thumbnail
    ? serializeIfd([{ tag: 0x0201, type: 4, value: [0] }, { tag: 0x0202, type: 4, value: [1234] }], ifd1Start)
    : new Uint8Array();
  const header = [0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8];
  return cat(header, serializeIfd(withPointers(exifStart, gpsStart), 8, thumbnail ? ifd1Start : 0), exifBlock, gpsBlock, ifd1);
}

export function sampleTiff(orientation: number) {
  return buildTiff(
    [
      { tag: 0x010f, type: 2, value: 'ExampleCam' },
      { tag: 0x0110, type: 2, value: 'X100' },
      { tag: 0x0112, type: 3, value: [orientation] },
      { tag: 0x0131, type: 2, value: 'Example Editor 2.0' },
      { tag: 0x013b, type: 2, value: 'Jane Doe' },
    ],
    [{ tag: 0x9003, type: 2, value: '2024:05:01 10:20:30' }],
    [
      { tag: 1, type: 2, value: 'N' },
      { tag: 2, type: 5, value: [[48, 1], [51, 1], [2940, 100]] },
      { tag: 3, type: 2, value: 'E' },
      { tag: 4, type: 5, value: [[2, 1], [17, 1], [4020, 100]] },
    ],
  );
}

// ---------------------------------------------------------------- shared payloads

export const XMP_PACKET = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"
    xmp:CreatorTool="Example AI Tool"
    Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia">
   <dc:creator><rdf:Seq><rdf:li>Jane Doe</rdf:li><rdf:li>John Roe</rdf:li></rdf:Seq></dc:creator>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">&lt;script&gt;alert(1)&lt;/script&gt;</rdf:li></rdf:Alt></dc:description>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

/** Fake but structurally valid ICC profile with a v2 'desc' tag. */
export function fakeIccProfile(desc = 'Test RGB Profile'): Uint8Array {
  const text = bytes(desc + '\0');
  const descTag = cat(bytes('desc'), [0, 0, 0, 0], u32be(text.length), text);
  const header = new Uint8Array(128);
  header.set(bytes('RGB '), 16);
  header.set(bytes('acsp'), 36);
  const tagTable = cat(u32be(1), bytes('desc'), u32be(144), u32be(descTag.length));
  const profile = cat(header, tagTable, descTag);
  profile.set(u32be(profile.length), 0);
  return profile;
}

export function fakeC2paPayload(generator = 'TestGen/1.0'): Uint8Array {
  const gen = bytes(generator);
  return cat(
    [0, 0, 0, 0x40],
    bytes('jumbjumd'),
    bytes('c2pa'),
    [0, 0, 0],
    bytes('claim_generator'),
    [0x60 + gen.length],
    gen,
    bytes('digitalSourceType'),
    bytes('http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'),
  );
}

export function u32be(v: number) {
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
}
export function u32le(v: number) {
  return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
}

// ---------------------------------------------------------------- JPEG

export function jpegSegment(marker: number, payload: Uint8Array | number[]): Uint8Array {
  const p = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  const len = p.length + 2;
  return cat([0xff, marker, len >> 8, len & 0xff], p);
}

/** Image-data segments only (DQT, SOF0 640×480, DHT, SOS + entropy data, EOI). */
export function jpegImageSegments(): Uint8Array[] {
  return [
    jpegSegment(0xdb, [0, ...Array.from({ length: 64 }, (_, i) => i + 1)]),
    jpegSegment(0xc0, [8, 0x01, 0xe0, 0x02, 0x80, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]),
    jpegSegment(0xc4, [0x00, ...Array(16).fill(0), 0]),
    cat(
      jpegSegment(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0]),
      // entropy data containing byte-stuffing (FF 00) and a restart marker (FF D0)
      [0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd0, 0x78, 0x9a],
    ),
    new Uint8Array([0xff, 0xd9]),
  ];
}

export function buildJpeg(opts: { orientation?: number; trailing?: boolean } = {}): Uint8Array<ArrayBuffer> {
  const jfif = jpegSegment(0xe0, cat(bytes('JFIF\0'), [1, 1, 0, 0, 1, 0, 1, 0, 0]));
  const exif = jpegSegment(0xe1, cat(bytes('Exif\0\0'), sampleTiff(opts.orientation ?? 6)));
  const xmp = jpegSegment(0xe1, cat(bytes('http://ns.adobe.com/xap/1.0/\0'), bytes(XMP_PACKET)));
  const icc = jpegSegment(0xe2, cat(bytes('ICC_PROFILE\0'), [1, 1], fakeIccProfile()));
  const iim = cat(
    [0x1c, 2, 80, 0, 8], bytes('Jane Doe'),
    [0x1c, 2, 90, 0, 5], bytes('Paris'),
    [0x1c, 2, 25, 0, 3], bytes('kw1'),
    [0x1c, 2, 25, 0, 3], bytes('kw2'),
  );
  const irb = cat(bytes('Photoshop 3.0\0'), bytes('8BIM'), [0x04, 0x04, 0, 0], u32be(iim.length), iim, iim.length & 1 ? [0] : []);
  const app13 = jpegSegment(0xed, irb);
  const app11 = jpegSegment(0xeb, cat(bytes('JP'), [0, 1, 0, 0, 0, 1], fakeC2paPayload()));
  const com = jpegSegment(0xfe, bytes('Generated using Example Generator'));
  const adobe = jpegSegment(0xee, cat(bytes('Adobe'), [0, 100, 0, 0, 0, 0, 1]));
  return cat(
    [0xff, 0xd8],
    jfif, exif, xmp, icc, app13, app11, com, adobe,
    ...jpegImageSegments(),
    opts.trailing === false ? [] : bytes('TRAILING-DATA'),
  );
}

// ---------------------------------------------------------------- PNG

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function pngIhdr(w = 2, h = 2) {
  return buildPngChunk('IHDR', new Uint8Array([...u32be(w), ...u32be(h), 8, 6, 0, 0, 0]));
}

export function pngIdat(w = 2, h = 2) {
  const raw = new Uint8Array(h * (1 + w * 4));
  for (let y = 0; y < h; y++) for (let x = 0; x < w * 4; x++) raw[y * (1 + w * 4) + 1 + x] = (x * 37 + y * 11) & 0xff;
  return buildPngChunk('IDAT', deflateSync(raw));
}

export function buildPng(opts: { orientation?: number; trailing?: boolean } = {}): Uint8Array<ArrayBuffer> {
  const iccp = buildPngChunk('iCCP', cat(bytes('Test profile\0'), [0], deflateSync(fakeIccProfile())));
  const gama = buildPngChunk('gAMA', new Uint8Array(u32be(45455)));
  const params = buildPngChunk('tEXt', cat(bytes('parameters\0'), bytes('a cat in a hat\nSteps: 20, Sampler: Euler a, CFG scale: 7')));
  const ztxt = buildPngChunk('zTXt', cat(bytes('Comment\0'), [0], deflateSync(bytes('made with a secret tool'))));
  const itxtXmp = buildPngChunk('iTXt', cat(bytes('XML:com.adobe.xmp\0'), [0, 0], bytes('\0\0'), bytes(XMP_PACKET)));
  const itxt = buildPngChunk('iTXt', cat(bytes('Author\0'), [0, 0], bytes('en\0Author\0'), bytes('Jöhn Dœ')));
  const exif = buildPngChunk('eXIf', sampleTiff(opts.orientation ?? 3));
  const time = buildPngChunk('tIME', new Uint8Array([0x07, 0xe8, 5, 1, 10, 20, 30]));
  const cabx = buildPngChunk('caBX', fakeC2paPayload('PngGen/2.0'));
  const priv = buildPngChunk('vpAg', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  return cat(
    PNG_SIG, pngIhdr(), iccp, gama, params, ztxt, itxtXmp, itxt, exif, time, cabx, priv,
    pngIdat(), buildPngChunk('IEND', new Uint8Array()),
    opts.trailing === false ? [] : bytes('APPENDED'),
  );
}

export function buildPngChunkRaw(type: string, data: Uint8Array) {
  return buildPngChunk(type, data);
}

export function minimalPng(extra: Uint8Array[] = []): Uint8Array<ArrayBuffer> {
  return cat(PNG_SIG, pngIhdr(), ...extra, pngIdat(), buildPngChunk('IEND', new Uint8Array()));
}

// ---------------------------------------------------------------- WebP

export function riff(fourcc: string, data: Uint8Array | number[]): Uint8Array {
  const d = data instanceof Uint8Array ? data : new Uint8Array(data);
  return cat(bytes(fourcc), u32le(d.length), d, d.length & 1 ? [0] : []);
}

export function vp8lChunk(w: number, h: number) {
  const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14) | (1 << 28);
  return riff('VP8L', cat([0x2f], u32le(bits), [0xaa, 0xbb, 0xcc]));
}

export function buildWebp(opts: { orientation?: number; flags?: number; withMeta?: boolean } = {}): Uint8Array<ArrayBuffer> {
  const w = 100;
  const h = 50;
  const withMeta = opts.withMeta ?? true;
  const flags = opts.flags ?? (withMeta ? 0x20 | 0x10 | 0x08 | 0x04 : 0x10);
  const vp8x = riff('VP8X', cat([flags, 0, 0, 0], [(w - 1) & 0xff, ((w - 1) >> 8) & 0xff, 0], [(h - 1) & 0xff, ((h - 1) >> 8) & 0xff, 0]));
  const chunks = withMeta
    ? [
        vp8x,
        riff('ICCP', fakeIccProfile('WebP Profile')),
        riff('ALPH', [0, 1, 2]),
        vp8lChunk(w, h),
        riff('EXIF', sampleTiff(opts.orientation ?? 8)),
        riff('XMP ', bytes(XMP_PACKET)),
        riff('C2PA', fakeC2paPayload('WebpGen/3.0')),
        riff('ABCD', [9, 9, 9]),
      ]
    : [vp8x, riff('ALPH', [0, 1, 2]), vp8lChunk(w, h)];
  const body = cat(...chunks);
  return cat(bytes('RIFF'), u32le(body.length + 4), bytes('WEBP'), body);
}
