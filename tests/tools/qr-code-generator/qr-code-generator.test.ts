import { describe, expect, it } from 'vitest';
import {
  addEccAndInterleave,
  alignmentPositions,
  chooseMode,
  dataCodewords,
  ECC_LEVELS,
  encodeData,
  encodeQr,
  fitVersion,
  formatBits,
  functionMask,
  MASKS,
  maxBytes,
  penaltyScore,
  rsDivisor,
  rsRemainder,
  versionBits,
  type Ecc,
  type QrCode,
} from '../../../src/tools/qr-code-generator/features/qr';
import {
  colorWarnings,
  contrastRatio,
  emailPayload,
  escapeWifi,
  geoPayload,
  modulesPath,
  phonePayload,
  smsPayload,
  toSvg,
  vcardPayload,
  wifiPayload,
} from '../../../src/tools/qr-code-generator/features/qr-code-generator';

/**
 * Independent read-back: reads the format bits from the symbol, unmasks the data area and walks
 * the zigzag to recover the codewords. Used to check the matrix without a full decoder.
 */
function readBack(qr: QrCode): { ecc: Ecc; mask: number; codewords: number[] } {
  const { modules: m, size } = qr;
  let bits = 0;
  // Copy 1 around the top-left finder, bit 14 first.
  const coords: [number, number][] = [];
  for (let i = 0; i <= 5; i++) coords.push([8, i]);
  coords.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) coords.push([14 - i, 8]);
  coords.forEach(([x, y], i) => (bits |= (m[y][x] ? 1 : 0) << i));
  // Copy 2 must agree.
  let bits2 = 0;
  for (let i = 0; i < 8; i++) bits2 |= (m[8][size - 1 - i] ? 1 : 0) << i;
  for (let i = 8; i < 15; i++) bits2 |= (m[size - 15 + i][8] ? 1 : 0) << i;
  expect(bits2).toBe(bits);
  // Find the (ecc, mask) whose BCH code matches exactly.
  let found: { ecc: Ecc; mask: number } | null = null;
  for (const ecc of ECC_LEVELS) for (let mask = 0; mask < 8; mask++) if (formatBits(ecc, mask) === bits) found = { ecc, mask };
  expect(found).not.toBeNull();
  const fn = functionMask(qr.version);
  const out: number[] = [];
  let cur = 0;
  let n = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (fn[y][x]) continue;
        const v = m[y][x] !== MASKS[found!.mask](x, y);
        cur = (cur << 1) | (v ? 1 : 0);
        if (++n % 8 === 0) {
          out.push(cur);
          cur = 0;
        }
      }
  }
  return { ...found!, codewords: out };
}

describe('capacity tables', () => {
  it('match the ISO 18004 data codeword counts', () => {
    const table: [number, number, number, number, number][] = [
      [1, 19, 16, 13, 9],
      [2, 34, 28, 22, 16],
      [5, 108, 86, 62, 46],
      [7, 156, 124, 88, 66],
      [10, 274, 216, 154, 122],
      [20, 861, 669, 485, 385],
      [40, 2956, 2334, 1666, 1276],
    ];
    for (const [v, l, m, q, h] of table) expect([dataCodewords(v, 'L'), dataCodewords(v, 'M'), dataCodewords(v, 'Q'), dataCodewords(v, 'H')]).toEqual([l, m, q, h]);
    expect(maxBytes('L')).toBe(2953);
    expect(maxBytes('H')).toBe(1273);
  });

  it('computes alignment pattern centres (Annex E)', () => {
    expect(alignmentPositions(1)).toEqual([]);
    expect(alignmentPositions(2)).toEqual([6, 18]);
    expect(alignmentPositions(7)).toEqual([6, 22, 38]);
    expect(alignmentPositions(14)).toEqual([6, 26, 46, 66]);
    expect(alignmentPositions(32)).toEqual([6, 34, 60, 86, 112, 138]);
    expect(alignmentPositions(36)).toEqual([6, 24, 50, 76, 102, 128, 154]);
    expect(alignmentPositions(40)).toEqual([6, 30, 58, 86, 114, 142, 170]);
  });

  it('computes format and version information (Annex C, D)', () => {
    expect(formatBits('M', 0)).toBe(0b101010000010010);
    expect(formatBits('L', 0)).toBe(0b111011111000100);
    expect(formatBits('H', 7)).toBe(0b000100000111011);
    expect(formatBits('Q', 5)).toBe(0b010000110000011);
    expect(formatBits('Q', 0)).toBe(0b011010101011111);
    expect(versionBits(7)).toBe(0x07c94);
    expect(versionBits(40)).toBe(0x28c69);
  });
});

describe('data encoding', () => {
  it('picks the smallest mode', () => {
    expect(chooseMode('01234567')).toBe('numeric');
    expect(chooseMode('HELLO WORLD')).toBe('alphanumeric');
    expect(chooseMode('Hello')).toBe('byte');
    expect(chooseMode('ü')).toBe('byte');
  });

  it('encodes the ISO 18004 Annex I example "01234567" at 1-M', () => {
    const data = encodeData('01234567', 1, 'M');
    expect(data).toEqual([16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17]);
    expect(addEccAndInterleave(data, 1, 'M').slice(16)).toEqual([165, 36, 212, 193, 237, 54, 199, 135, 44, 85]);
  });

  it('encodes "HELLO WORLD" at 1-M (data and Reed–Solomon codewords)', () => {
    const data = encodeData('HELLO WORLD', 1, 'M');
    expect(data).toEqual([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17]);
    expect(rsRemainder(data, rsDivisor(10))).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });

  it('encodes UTF-8 in byte mode', () => {
    const data = encodeData('é', 1, 'L', 'byte');
    expect(data.slice(0, 3)).toEqual([0x40, 0x2c, 0x3a]); // 0100 00000010 11000011 10101001…
  });

  it('interleaves blocks of different lengths (5-Q: 2×15 + 2×16 data codewords)', () => {
    const data = Array.from({ length: dataCodewords(5, 'Q') }, (_, i) => i);
    const out = addEccAndInterleave(data, 5, 'Q');
    expect(out).toHaveLength(134);
    // First column: first byte of each block; blocks start at 0, 15, 30, 46.
    expect(out.slice(0, 4)).toEqual([0, 15, 30, 46]);
    // Column 15 exists only in the two long blocks.
    expect(out.slice(60, 62)).toEqual([45, 61]);
  });

  it('chooses the smallest version that fits', () => {
    expect(fitVersion('HELLO WORLD', 'M')).toBe(1);
    expect(fitVersion('a'.repeat(15), 'L')).toBe(1);
    expect(fitVersion('a'.repeat(18), 'L')).toBe(2);
    expect(fitVersion('a'.repeat(2953), 'L')).toBe(40);
    expect(fitVersion('a'.repeat(2954), 'L')).toBeNull();
    expect(fitVersion('1'.repeat(7089), 'L')).toBe(40);
  });
});

describe('symbols', () => {
  it('builds a 21×21 "HELLO WORLD" 1-M symbol whose data reads back exactly', () => {
    const qr = encodeQr('HELLO WORLD', { ecc: 'M' });
    expect(qr.version).toBe(1);
    expect(qr.size).toBe(21);
    const back = readBack(qr);
    expect(back.ecc).toBe('M');
    expect(back.mask).toBe(qr.mask);
    expect(back.codewords).toEqual([32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17, 196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });

  it('draws finder, timing, dark module and version info', () => {
    const qr = encodeQr('https://example.com/' + 'x'.repeat(150), { ecc: 'Q' });
    expect(qr.version).toBeGreaterThanOrEqual(7);
    const { modules: m, size } = qr;
    const finderRow = [true, true, true, true, true, true, true, false];
    expect(m[0].slice(0, 8)).toEqual(finderRow);
    expect(m[3].slice(0, 8)).toEqual([true, false, true, true, true, false, true, false]);
    expect(m[0].slice(size - 7)).toEqual(finderRow.slice(0, 7));
    expect(m[size - 1].slice(0, 7)).toEqual(finderRow.slice(0, 7));
    for (let i = 8; i < size - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
    expect(m[size - 8][8]).toBe(true);
    // Version info bottom-left block (6×3) encodes versionBits.
    let vb = 0;
    for (let i = 0; i < 18; i++) vb |= (m[size - 11 + (i % 3)][Math.floor(i / 3)] ? 1 : 0) << i;
    expect(vb).toBe(versionBits(qr.version));
  });

  it('round-trips data across versions, levels and modes', () => {
    const samples = ['01234567890123456789', 'HTTPS://EXAMPLE.COM/ABC', 'Grüße, 世界! 🚀', 'x'.repeat(500), '9'.repeat(1500)];
    for (const text of samples)
      for (const ecc of ECC_LEVELS) {
        const qr = encodeQr(text, { ecc });
        const back = readBack(qr);
        expect(back.ecc).toBe(ecc);
        const expected = addEccAndInterleave(encodeData(text, qr.version, ecc), qr.version, ecc);
        expect(back.codewords.slice(0, expected.length)).toEqual(expected);
        expect(back.codewords.slice(expected.length).every((b) => b === 0)).toBe(true);
      }
  });

  it('selects the mask with the lowest penalty', () => {
    const text = 'Mask selection test';
    const chosen = encodeQr(text, { ecc: 'L' });
    const scores = Array.from({ length: 8 }, (_, mask) => penaltyScore(encodeQr(text, { ecc: 'L', mask }).modules));
    expect(scores[chosen.mask]).toBe(Math.min(...scores));
  });

  it('scores penalties by the ISO rules', () => {
    // All-light 21×21: rows/cols of 21 → (3 + 16) × 42; 2×2 blocks 400 × 3; balance k = 9 → 90.
    const blank = Array.from({ length: 21 }, () => new Array(21).fill(false));
    expect(penaltyScore(blank)).toBe(19 * 42 + 400 * 3 + 90);
  });

  it('rejects oversize input and bad options', () => {
    expect(() => encodeQr('a'.repeat(3000), { ecc: 'L' })).toThrow(/Too much data/);
    expect(() => encodeQr('abc', { mode: 'numeric' })).toThrow();
  });
});

describe('payloads', () => {
  it('builds Wi-Fi strings with escaping', () => {
    expect(escapeWifi('a;b,c:d\\e"f')).toBe('a\\;b\\,c\\:d\\\\e\\"f');
    expect(wifiPayload({ ssid: 'Home;Net', password: 'p:ss', security: 'WPA', hidden: false })).toBe('WIFI:T:WPA;S:Home\\;Net;P:p\\:ss;;');
    expect(wifiPayload({ ssid: 'Cafe', password: 'ignored', security: 'nopass', hidden: true })).toBe('WIFI:T:nopass;S:Cafe;H:true;;');
  });

  it('builds mailto, tel, SMS and geo payloads', () => {
    expect(emailPayload('a@example.com', 'Hi there', 'Line 1\nLine&2')).toBe('mailto:a@example.com?subject=Hi%20there&body=Line%201%0ALine%262');
    expect(emailPayload('a@example.com', '', '')).toBe('mailto:a@example.com');
    expect(phonePayload('+1 (555) 010-0123')).toBe('tel:+15550100123');
    expect(smsPayload('+44 20 7946 0000', 'On my way')).toBe('SMSTO:+442079460000:On my way');
    expect(geoPayload('51.5007', '-0.1246')).toEqual({ ok: true, payload: 'geo:51.5007,-0.1246' });
    expect(geoPayload('91', '0').ok).toBe(false);
    expect(geoPayload('', '0').ok).toBe(false);
  });

  it('builds a vCard 3.0 with escaped values', () => {
    const v = vcardPayload({
      firstName: 'Ada',
      lastName: 'Lovelace',
      org: 'Analytical, Engines; Ltd',
      title: '',
      phone: '+44 20 7946 0000',
      email: 'ada@example.com',
      url: '',
      street: '1 Main St',
      city: 'London',
      postcode: 'N1',
      country: 'UK',
    });
    expect(v.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Lovelace;Ada;;;',
      'FN:Ada Lovelace',
      'ORG:Analytical\\, Engines\\; Ltd',
      'TEL;TYPE=CELL:+44 20 7946 0000',
      'EMAIL:ada@example.com',
      'ADR;TYPE=WORK:;;1 Main St;London;;N1;UK',
      'END:VCARD',
    ]);
  });
});

describe('rendering', () => {
  const qr = encodeQr('HELLO WORLD', { ecc: 'M' });
  it('merges horizontal runs into one path', () => {
    const d = modulesPath(qr, 4);
    expect(d.startsWith('M4 4h7v1h-7z')).toBe(true); // top-left finder's first row
    const area = [...d.matchAll(/h(\d+)v1/g)].reduce((a, m) => a + Number(m[1]), 0);
    expect(area).toBe(qr.modules.flat().filter(Boolean).length);
  });

  it('writes a single-path SVG and sanitises colours and logos', () => {
    const svg = toSvg(qr, { quiet: 4, size: 256, foreground: '#112233', background: 'red"/><script>', logo: 'javascript:alert(1)' });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 29 29" width="256" height="256"/);
    expect(svg.match(/<path/g)).toHaveLength(1);
    expect(svg).toContain('fill="#112233"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).not.toContain('script');
    expect(svg).not.toContain('<image');
    const withLogo = toSvg(qr, { quiet: 4, size: 256, foreground: '#000000', background: '#ffffff', logo: 'data:image/png;base64,AAAA' });
    expect(withLogo).toContain('<image href="data:image/png;base64,AAAA"');
  });

  it('checks contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(colorWarnings('#000000', '#ffffff')).toEqual([]);
    expect(colorWarnings('#999999', '#aaaaaa')[0]).toMatch(/Low contrast/);
    expect(colorWarnings('#ffffff', '#000000')[0]).toMatch(/inverted/);
  });
});
