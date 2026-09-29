import { describe, expect, it } from 'vitest';
import { buildShareLink, decodeShare, encodeShare, MAX_SHARE_CHARS, sanitizeShare, shareFromHash } from '../../src/shared/lib/share';
import { bytesToBase64 } from '../../src/shared/lib/base64';
import { TOOLS } from '../../src/tools/registry';

const state = { input: 'hello (\\d+) wörld 🚀\n'.repeat(20), flags: 'gi', multiline: true, count: 3 };

describe('share link encoding', () => {
  it('round-trips compressed and plain payloads', async () => {
    const d = await encodeShare(state);
    expect(d[0]).toBe('d');
    expect(d).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeShare(d)).toEqual(state);
    const j = await encodeShare(state, { compress: false });
    expect(j[0]).toBe('j');
    expect(await decodeShare(j)).toEqual(state);
    expect(d.length).toBeLessThan(j.length);
  });

  it('builds a #s= link and reads it back from the hash', async () => {
    const link = await buildShareLink(state, 'https://zykit.test/tools/regex-tester?x=1');
    expect(link.ok).toBe(true);
    if (!link.ok) return;
    const url = new URL(link.url);
    expect(url.pathname).toBe('/tools/regex-tester');
    const payload = shareFromHash(url.hash);
    expect(payload).not.toBeNull();
    expect(await decodeShare(payload!)).toEqual(state);
    expect(shareFromHash('#other=1')).toBeNull();
    expect(shareFromHash('')).toBeNull();
  });

  it('refuses state that is too large to share', async () => {
    // Random text barely compresses.
    const noise = bytesToBase64(crypto.getRandomValues(new Uint8Array(30_000)));
    const link = await buildShareLink({ input: noise }, 'https://zykit.test/tools/x');
    expect(link).toEqual({ ok: false, reason: 'too-large' });
    expect(await decodeShare('j' + 'A'.repeat(MAX_SHARE_CHARS + 10))).toBeNull();
  });

  it('fails safely on tampered or hostile payloads', async () => {
    const good = await encodeShare(state);
    const flipped = good.slice(0, 10) + (good[10] === 'A' ? 'B' : 'A') + good.slice(11);
    const results = await Promise.all([
      decodeShare(flipped),
      decodeShare(good.slice(0, good.length - 5)),
      decodeShare('x' + good.slice(1)),
      decodeShare('d!!!'),
      decodeShare(''),
      decodeShare('j' + bytesToBase64(new TextEncoder().encode('[1,2]'), true)),
      decodeShare('j' + bytesToBase64(new TextEncoder().encode('"str"'), true)),
      decodeShare('j' + bytesToBase64(new Uint8Array([0xff, 0xfe, 0x7b]), true)),
    ]);
    for (const r of results) expect(r === null || (typeof r === 'object' && !Array.isArray(r))).toBe(true);
    expect(results.slice(1)).toEqual([null, null, null, null, null, null, null]);
  });

  it('rejects a decompression bomb', async () => {
    const bomb = await encodeShare({ input: 'a'.repeat(3 * 1024 * 1024) });
    expect(bomb.length).toBeLessThan(MAX_SHARE_CHARS);
    expect(await decodeShare(bomb)).toBeNull();
  });

  it('keeps only known keys of the same type and allowed values', () => {
    const current = { input: '', mode: 'a', flag: false, list: [] as string[] };
    const incoming = { input: 'x', mode: 'evil', flag: 'true', list: ['q'], extra: 1, __proto__: { polluted: true } };
    expect(sanitizeShare(incoming, current, { mode: ['a', 'b'] })).toEqual({ input: 'x', list: ['q'] });
    expect(sanitizeShare({ mode: 'b', flag: true }, current, { mode: ['a', 'b'] })).toEqual({ mode: 'b', flag: true });
  });
});

describe('which tools can be shared', () => {
  // These handle secrets (tokens, keys, passwords, cookies, certificates) or code; a share link
  // would put them in browser history, chat logs and screenshots.
  const NEVER = [
    'jwt-decoder',
    'jwt-generator',
    'hash-generator',
    'password-generator',
    'random-string',
    'certificate-inspector',
    'encode-decode',
    'http-headers',
    'js-runner',
    'meta-tag-inspector',
  ];

  it('never offers share links for tools that handle secrets', () => {
    for (const id of NEVER) {
      const tool = TOOLS.find((t) => t.id === id);
      expect(tool, id).toBeDefined();
      expect(tool!.shareable, id).not.toBe(true);
    }
  });

  it('offers them for the opted-in tools', () => {
    const shareable = TOOLS.filter((t) => t.shareable).map((t) => t.id);
    expect(shareable).toContain('regex-tester');
    expect(shareable).toContain('json-formatter');
    expect(shareable.filter((id) => NEVER.includes(id))).toEqual([]);
  });
});
