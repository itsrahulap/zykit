import { describe, expect, it } from 'vitest';
import { bytesToBase64 } from '../../../src/shared/lib/base64';
import { decodeInput, downloadName, encodeImage, MAX_ENCODE_BYTES, snippet } from '../../../src/tools/image-base64/features/base64-image';

// 1×1 transparent PNG and a minimal GIF.
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0, 0, 0, 0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x44, 1, 0, 0x3b]);

describe('Image → Base64', () => {
  it('encodes and reports the ~33% overhead', () => {
    const e = encodeImage(GIF, 'image/gif');
    expect(e.dataUri).toBe(`data:image/gif;base64,${bytesToBase64(GIF)}`);
    expect(e.overhead).toBeCloseTo(40 / 29 - 1, 5);
  });

  it('builds CSS and HTML snippets with escaped alt text', () => {
    const e = encodeImage(GIF, 'image/gif');
    expect(snippet('css', e)).toBe(`background-image: url("${e.dataUri}");`);
    expect(snippet('html', e, 'a "quoted" <b>')).toBe(`<img src="${e.dataUri}" alt="a &quot;quoted&quot; &lt;b&gt;">`);
    expect(snippet('base64', e)).toBe(e.base64);
  });

  it('refuses huge images', () => {
    expect(() => encodeImage(new Uint8Array(MAX_ENCODE_BYTES + 1), 'image/png')).toThrow(/up to 10 MB/);
  });
});

describe('Base64 → image', () => {
  it('decodes raw Base64 and detects PNG by magic bytes', () => {
    const d = decodeInput(PNG_B64);
    expect(d.detected?.mime).toBe('image/png');
    expect(d.declared).toBeNull();
    expect(d.warnings).toEqual([]);
    expect(downloadName(d)).toBe('image.png');
  });

  it('accepts data URIs, wrapped lines, CSS and HTML wrappers', () => {
    const wrapped = PNG_B64.replace(/(.{20})/g, '$1\n');
    for (const input of [
      `data:image/png;base64,${PNG_B64}`,
      `data:image/png;base64,${wrapped}`,
      `background-image: url("data:image/png;base64,${PNG_B64}");`,
      `<img src="data:image/png;base64,${PNG_B64}" alt="">`,
      `  "data:image/png;base64,${PNG_B64}"  `,
    ]) {
      const d = decodeInput(input);
      expect(d.detected?.label).toBe('PNG');
      expect(d.declared).toBe('image/png');
    }
  });

  it('accepts Base64URL', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xfb, 0xff]);
    const url = bytesToBase64(bytes, true);
    expect(url).toMatch(/[-_]/);
    expect(decodeInput(url).detected?.mime).toBe('image/jpeg');
  });

  it('decodes percent-encoded SVG data URIs', () => {
    const d = decodeInput('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E');
    expect(d.detected?.mime).toBe('image/svg+xml');
  });

  it('warns when the declared type disagrees with the bytes', () => {
    const d = decodeInput(`data:image/jpeg;base64,${PNG_B64}`);
    expect(d.detected?.mime).toBe('image/png');
    expect(d.warnings[0]).toMatch(/says image\/jpeg, but the bytes are PNG/);
  });

  it('warns for non-image bytes', () => {
    expect(decodeInput(bytesToBase64(new TextEncoder().encode('hello world'))).warnings[0]).toMatch(/don't match any known image/);
  });

  it('rejects invalid input strictly', () => {
    expect(() => decodeInput('')).toThrow(/Paste/);
    expect(() => decodeInput('abc$def')).toThrow(/Invalid Base64 character "\$"/);
    expect(() => decodeInput('abcde')).toThrow(/length/);
    expect(() => decodeInput('ab==c')).toThrow();
    expect(() => decodeInput('data:image/png;base64')).toThrow(/no comma/);
    expect(() => decodeInput('data:image/svg+xml,%zz')).toThrow(/percent/);
    expect(() => decodeInput('data:image/png;base64,')).toThrow(/empty/);
  });
});
