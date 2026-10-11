import { describe, expect, it } from 'vitest';
import { decodeMatrix, decodeQrPixels, rsCorrect } from '../../../src/tools/qr-code-reader/features/decode';
import { analyze, mask, parseVCard, parseWifi, urlWarnings } from '../../../src/tools/qr-code-reader/features/qr-code-reader';
import { addEccAndInterleave, encodeQr, rsDivisor, rsRemainder, type Ecc } from '../../../src/tools/qr-code-generator/features/qr';

/** Renders a symbol into RGBA pixels with a quiet zone, `scale` px per module. */
function render(text: string, ecc: Ecc, scale = 4, quiet = 4, invert = false) {
  const qr = encodeQr(text, { ecc });
  const dim = qr.size + quiet * 2;
  const w = dim * scale;
  const px = new Uint8ClampedArray(w * w * 4);
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const mx = Math.floor(x / scale) - quiet;
      const my = Math.floor(y / scale) - quiet;
      const dark = mx >= 0 && my >= 0 && mx < qr.size && my < qr.size && qr.modules[my][mx];
      const v = dark !== invert ? 0 : 255;
      px.set([v, v, v, 255], (y * w + x) * 4);
    }
  return { px, w, qr };
}

describe('decodeQrPixels', () => {
  const cases: [string, Ecc][] = [
    ['12345678901234567890', 'L'],
    ['HELLO WORLD $%*+-./:', 'M'],
    ['https://example.com/path?q=1', 'Q'],
    ['héllo wörld ✓', 'H'],
    ['x'.repeat(200), 'M'],
    ['y'.repeat(700), 'L'],
    ['z'.repeat(1000), 'Q'],
  ];
  it.each(cases)('round-trips %s at level %s', (text, ecc) => {
    const { px, w, qr } = render(text, ecc, 3);
    const d = decodeQrPixels(px, w, w);
    expect(d.text).toBe(text);
    expect(d.version).toBe(qr.version);
    expect(d.ecc).toBe(ecc);
    expect(d.mask).toBe(qr.mask);
  });

  it('reads an inverted (light on dark) code', () => {
    const { px, w } = render('inverted', 'M', 4, 4, true);
    expect(decodeQrPixels(px, w, w).text).toBe('inverted');
  });

  it('repairs damaged modules with Reed–Solomon', () => {
    const { qr } = render('error correction works', 'H');
    const m = qr.modules.map((r) => r.slice());
    for (let x = 10; x < 14; x++) m[16][x] = !m[16][x];
    m[20][20] = !m[20][20];
    const d = decodeMatrix(m);
    expect(d.text).toBe('error correction works');
    expect(d.corrected).toBeGreaterThan(0);
  });

  it('fails clearly on a blank image', () => {
    const px = new Uint8ClampedArray(50 * 50 * 4).fill(255);
    expect(() => decodeQrPixels(px, 50, 50)).toThrow(/No QR code/);
  });
});

describe('rsCorrect', () => {
  it('fixes up to eccLen/2 wrong bytes and rejects more', () => {
    const data = Array.from({ length: 20 }, (_, i) => (i * 37 + 5) & 255);
    const ecc = rsRemainder(data, rsDivisor(10));
    const block = data.concat(ecc);
    const bad = block.slice();
    [0, 7, 15, 22, 29].forEach((i) => (bad[i] ^= 0x5a));
    expect(rsCorrect(bad, 10)).toBe(5);
    expect(bad).toEqual(block);
    const worse = block.slice();
    [0, 3, 7, 9, 15, 22, 29].forEach((i) => (worse[i] ^= 0x5a));
    expect(rsCorrect(worse, 10)).toBeNull();
    expect(addEccAndInterleave).toBeTypeOf('function');
  });
});

describe('analyze', () => {
  it('classifies URLs and warns on punycode lookalikes without opening anything', () => {
    expect(analyze('https://example.com/a').kind).toBe('url');
    expect(analyze('https://example.com/a').warnings).toEqual([]);
    expect(urlWarnings('https://xn--pple-43d.com/').join(' ')).toMatch(/international characters/);
    expect(urlWarnings('https://аpple.com/').join(' ')).toMatch(/international characters/);
    expect(urlWarnings('javascript:alert(1)').join(' ')).toMatch(/scheme/);
    expect(urlWarnings('http://192.168.0.1/').length).toBe(2);
    expect(urlWarnings('https://user:pw@evil.test/').join(' ')).toMatch(/username/);
  });
  it('parses Wi-Fi with escapes and flags the password as secret', () => {
    const w = parseWifi('WIFI:T:WPA;S:My\\;Net;P:p\\:a\\\\ss;H:true;;');
    expect(w).toEqual({ ssid: 'My;Net', password: 'p:a\\ss', security: 'WPA', hidden: true });
    const a = analyze('WIFI:T:WPA;S:Home;P:secret;;');
    expect(a.fields.find((f) => f.label === 'Password')).toMatchObject({ value: 'secret', secret: true });
    expect(analyze('WIFI:T:nopass;S:Cafe;;').warnings.length).toBe(1);
    expect(mask('secret')).toBe('••••••');
  });
  it('parses vCards', () => {
    const f = parseVCard('BEGIN:VCARD\nVERSION:3.0\nN:Doe;Jane;;;\nFN:Jane Doe\nORG:Acme\\, Inc\nTEL;TYPE=CELL:+1555\nEMAIL:j@x.test\nADR:;;1 Main St;Town;;123;US\nEND:VCARD')!;
    expect(f).toContainEqual({ label: 'Name', value: 'Jane Doe' });
    expect(f).toContainEqual({ label: 'Organisation', value: 'Acme, Inc' });
    expect(f).toContainEqual({ label: 'Address', value: '1 Main St, Town, 123, US' });
  });
  it('parses mailto, sms, tel and geo', () => {
    expect(analyze('mailto:a@b.test?subject=Hi%20there&body=Yo').fields).toEqual([
      { label: 'To', value: 'a@b.test' },
      { label: 'Subject', value: 'Hi there' },
      { label: 'Message', value: 'Yo' },
    ]);
    expect(analyze('SMSTO:+1555:Hello: you').fields).toEqual([{ label: 'To', value: '+1555' }, { label: 'Message', value: 'Hello: you' }]);
    expect(analyze('tel:+15550100').kind).toBe('tel');
    expect(analyze('geo:51.5,-0.12').fields[1].value).toBe('-0.12');
    expect(analyze('geo:95,0').warnings.length).toBe(1);
    expect(analyze('just words').kind).toBe('text');
  });
});
