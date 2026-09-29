import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  CodecError,
  CODECS,
  htmlDecode,
  htmlEncode,
  transform,
  type CodecId,
} from '../../../src/tools/encode-decode/features/codecs';

const SAMPLES = ['', 'a', 'ab', 'abc', 'Hello, world!', 'héllo wörld', '日本語テキスト', 'emoji 👋🏽🎉 family 👨‍👩‍👧', 'tabs\tand\nnewlines', '<a href="x">&amp;\'</a>'];

function errorOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(CodecError);
    return (e as Error).message;
  }
  throw new Error('expected an error');
}

describe('round trips', () => {
  for (const { id } of CODECS) {
    it(`${id} round-trips Unicode and emoji`, () => {
      for (const s of SAMPLES) {
        const encoded = transform(id as CodecId, 'encode', s);
        expect(transform(id as CodecId, 'decode', encoded)).toBe(s);
      }
    });
  }

  it('HTML round-trips with all non-ASCII escaped', () => {
    for (const s of SAMPLES) expect(htmlDecode(htmlEncode(s, true))).toBe(s);
  });
});

describe('Base64', () => {
  it('matches known vectors (RFC 4648)', () => {
    const vectors: [string, string][] = [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']];
    for (const [plain, b64] of vectors) expect(transform('base64', 'encode', plain)).toBe(b64);
  });

  it('matches btoa for all byte values', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(bytesToBase64(bytes)).toBe(btoa(String.fromCharCode(...bytes)));
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('encodes UTF-8 and emoji', () => {
    expect(transform('base64', 'encode', '✓ 👋')).toBe('4pyTIPCfkYs=');
    expect(transform('base64url', 'encode', '✓ 👋')).toBe('4pyTIPCfkYs');
    expect(transform('base64url', 'encode', 'ÿþ?')).toBe('w7_Dvj8');
  });

  it('ignores whitespace and accepts unpadded Base64URL with or without padding', () => {
    expect(transform('base64', 'decode', 'Zm9v\nYmFy ')).toBe('foobar');
    expect(transform('base64url', 'decode', 'Zg')).toBe('f');
    expect(transform('base64url', 'decode', 'Zg==')).toBe('f');
  });

  it('rejects invalid input', () => {
    expect(errorOf(() => transform('base64', 'decode', 'Zm9v!'))).toMatch(/Invalid Base64 character "!"/);
    expect(errorOf(() => transform('base64', 'decode', 'w7_Dvj8'))).toMatch(/Base64URL/);
    expect(errorOf(() => transform('base64url', 'decode', 'a+b/'))).toMatch(/standard Base64/);
    expect(errorOf(() => transform('base64', 'decode', 'Zm9vY'))).toMatch(/length/);
    expect(errorOf(() => transform('base64', 'decode', 'Zg='))).toMatch(/padding/);
    expect(errorOf(() => transform('base64', 'decode', 'Zg==='))).toMatch(/padding/);
  });

  it('rejects bytes that are not UTF-8', () => {
    expect(errorOf(() => transform('base64', 'decode', '/w=='))).toMatch(/not valid UTF-8/);
  });
});

describe('URL', () => {
  it('encodes components and full URLs differently', () => {
    const url = 'https://example.com/a b?q=ä&x=1#frag';
    expect(transform('url-component', 'encode', url)).toBe('https%3A%2F%2Fexample.com%2Fa%20b%3Fq%3D%C3%A4%26x%3D1%23frag');
    expect(transform('url', 'encode', url)).toBe('https://example.com/a%20b?q=%C3%A4&x=1#frag');
  });

  it('reports malformed sequences', () => {
    expect(errorOf(() => transform('url-component', 'decode', '100%'))).toMatch(/Malformed/);
    expect(errorOf(() => transform('url', 'decode', '%E0%A4%A'))).toMatch(/Malformed/);
    expect(errorOf(() => transform('url-component', 'decode', '%FF'))).toMatch(/Malformed/);
  });

  it('reports lone surrogates on encode', () => {
    expect(errorOf(() => transform('url-component', 'encode', '\ud800'))).toMatch(/surrogate/);
  });
});

describe('HTML entities', () => {
  it('escapes the five special characters', () => {
    expect(htmlEncode(`<a href="x" title='y'>Tom & Jerry</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;');
  });

  it('optionally escapes non-ASCII as hex references, one per code point', () => {
    expect(htmlEncode('é👋', true)).toBe('&#xE9;&#x1F44B;');
    expect(htmlEncode('é👋')).toBe('é👋');
  });

  it('decodes named, decimal and hex entities', () => {
    expect(htmlDecode('&lt;b&gt; &amp;amp; &quot;&apos;&#39; &copy; &euro; &nbsp;|')).toBe('<b> &amp; "\'\' © €  |');
    expect(htmlDecode('&#128075; &#x1f44b; &#X1F44B;')).toBe('👋 👋 👋');
  });

  it('leaves unknown or incomplete entities alone and replaces invalid code points', () => {
    expect(htmlDecode('&unknown; &amp &#; &constructor; &toString;')).toBe('&unknown; &amp &#; &constructor; &toString;');
    expect(htmlDecode('&#0; &#xD800; &#x110000;')).toBe('� � �');
  });
});

describe('Hex', () => {
  it('encodes UTF-8 bytes', () => {
    expect(transform('hex', 'encode', 'hi ✓')).toBe('686920e29c93');
  });

  it('tolerates spaces, colons and 0x prefixes', () => {
    expect(transform('hex', 'decode', '0x68 0x69')).toBe('hi');
    expect(transform('hex', 'decode', '68:69\n20 E2 9C 93')).toBe('hi ✓');
  });

  it('rejects odd length, bad digits and invalid UTF-8', () => {
    expect(errorOf(() => transform('hex', 'decode', 'abc'))).toMatch(/odd number/);
    expect(errorOf(() => transform('hex', 'decode', 'zz'))).toMatch(/Invalid hex character "z"/);
    expect(errorOf(() => transform('hex', 'decode', 'c3'))).toMatch(/not valid UTF-8/);
  });
});
