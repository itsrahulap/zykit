import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64 } from '../../../src/shared/lib/base64';
import {
  DEFAULT_ITERATIONS,
  DecryptError,
  decryptFile,
  decryptText,
  encryptFile,
  encryptText,
  isEncryptedFile,
  parseText,
  passphraseStrength,
  readEnvelope,
  TEXT_PREFIX,
} from '../../../src/tools/text-encryption/features/text-encryption';

const FAST = 100_000;

async function code(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(DecryptError);
    return (e as DecryptError).code;
  }
  throw new Error('expected a DecryptError');
}

const flip = (s: string, at: number) => {
  const env = parseText(s);
  env[at] ^= 1;
  return TEXT_PREFIX + bytesToBase64(env, true);
};

describe('text encryption', () => {
  it('round-trips Unicode text with the default 600k iterations', async () => {
    const msg = 'Hello, wörld 🌍 — line two\nend';
    const out = await encryptText(msg, 'correct horse battery staple');
    expect(out.startsWith('zykit:v1:')).toBe(true);
    expect(readEnvelope(parseText(out))).toEqual({ kind: 'text', iterations: DEFAULT_ITERATIONS });
    expect(DEFAULT_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    expect(await decryptText(out, 'correct horse battery staple')).toBe(msg);
  });

  it('round-trips empty text and tolerates wrapped whitespace', async () => {
    const out = await encryptText('', 'pw', FAST);
    expect(await decryptText(out, 'pw')).toBe('');
    const long = await encryptText('x'.repeat(500), 'pw', FAST);
    const wrapped = long.replace(/(.{60})/g, '$1\n  ');
    expect(await decryptText(wrapped, 'pw')).toBe('x'.repeat(500));
  });

  it('uses a fresh salt and IV every time', async () => {
    const a = parseText(await encryptText('same', 'pw', FAST));
    const b = parseText(await encryptText('same', 'pw', FAST));
    expect(bytesToBase64(a.subarray(5, 33))).not.toBe(bytesToBase64(b.subarray(5, 33)));
  });

  it('reports a wrong passphrase', async () => {
    const out = await encryptText('secret', 'right', FAST);
    expect(await code(decryptText(out, 'wrong'))).toBe('passphrase');
  });

  it('detects tampering with the ciphertext, the tag and the header', async () => {
    const out = await encryptText('attack at dawn', 'pw', FAST);
    const len = parseText(out).length;
    expect(await code(decryptText(flip(out, 50), 'pw'))).toBe('corrupt'); // ciphertext
    expect(await code(decryptText(flip(out, len - 1), 'pw'))).toBe('corrupt'); // tag
    expect(await code(decryptText(flip(out, 10), 'pw'))).toBe('passphrase'); // salt → different key
    const truncated = TEXT_PREFIX + bytesToBase64(parseText(out).subarray(0, 40), true);
    expect(await code(decryptText(truncated, 'pw'))).toBe('corrupt');
  });

  it('rejects an IV edit even though the check value still matches', async () => {
    // The IV is not part of key derivation, so the passphrase check passes but GCM must fail.
    const out = await encryptText('attack at dawn', 'pw', FAST);
    const env = parseText(out);
    env[22] ^= 0x80; // inside the IV (bytes 21..32)
    await expect(decryptText(TEXT_PREFIX + bytesToBase64(env, true), 'pw')).rejects.toMatchObject({ code: 'corrupt' });
  });

  it('rejects iteration counts outside the allowed range', async () => {
    const out = await encryptText('x', 'pw', FAST);
    const env = parseText(out);
    new DataView(env.buffer, env.byteOffset).setUint32(1, 0xffffffff);
    expect(await code(decryptText(TEXT_PREFIX + bytesToBase64(env, true), 'pw'))).toBe('corrupt');
    await expect(encryptText('x', 'pw', 1000)).rejects.toThrow(/Iterations/);
  });

  it('explains unknown formats', async () => {
    expect(await code(decryptText('hello', 'pw'))).toBe('format');
    expect(await code(decryptText('zykit:v2:AAAA', 'pw'))).toBe('format');
    await expect(decryptText('U2FsdGVkX19abc', 'pw')).rejects.toThrow(/OpenSSL/);
    expect(await code(decryptText('zykit:v1:@@@@', 'pw'))).toBe('corrupt');
    expect(await code(decryptText('', 'pw'))).toBe('format');
  });

  it('refuses to encrypt without a passphrase', async () => {
    await expect(encryptText('x', '')).rejects.toThrow(/passphrase/);
  });
});

describe('file encryption', () => {
  it('round-trips bytes and the file name', async () => {
    const data = crypto.getRandomValues(new Uint8Array(60_000));
    const zyk = await encryptFile('report final.pdf', data, 'pw', FAST);
    expect(isEncryptedFile(zyk)).toBe(true);
    const out = await decryptFile(zyk, 'pw');
    expect(out.name).toBe('report final.pdf');
    expect(Array.from(out.data)).toEqual(Array.from(data));
  });

  it('detects wrong passphrase, tampering and non-.zyk input', async () => {
    const zyk = await encryptFile('a.txt', new TextEncoder().encode('hello'), 'pw', FAST);
    expect(await code(decryptFile(zyk, 'nope'))).toBe('passphrase');
    const bad = zyk.slice();
    bad[bad.length - 3] ^= 1;
    expect(await code(decryptFile(bad, 'pw'))).toBe('corrupt');
    expect(await code(decryptFile(new TextEncoder().encode('%PDF-1.7'), 'pw'))).toBe('format');
  });

  it('keeps text and file envelopes apart', async () => {
    const zyk = await encryptFile('a.txt', new Uint8Array([1, 2, 3]), 'pw', FAST);
    const asText = TEXT_PREFIX + bytesToBase64(zyk.subarray(4), true);
    expect(await code(decryptText(asText, 'pw'))).toBe('format');
    expect(base64ToBytes(asText.slice(9), true)[0]).toBe(1);
  });
});

describe('passphrase strength', () => {
  it('grades passphrases', () => {
    expect(passphraseStrength('').level).toBe('empty');
    expect(passphraseStrength('password123').level).toBe('very weak');
    expect(passphraseStrength('aaaaaaaaaaaaaaaa').level).toBe('very weak');
    expect(['strong', 'very strong']).toContain(passphraseStrength('correct horse battery staple').level);
    expect(['strong', 'very strong']).toContain(passphraseStrength('T7#qL9!vR2@xW4$z').level);
  });
});
