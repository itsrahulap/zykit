import { describe, expect, it } from 'vitest';
import { clampCount, createV7Generator, formatUuid, generate, inspectUuid, uuidV4 } from '../../../src/tools/uuid-generator/features/uuid';

const RFC = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidV4', () => {
  it('produces RFC-shaped random UUIDs', () => {
    const a = uuidV4();
    expect(a).toMatch(RFC);
    expect(a[14]).toBe('4');
    expect(uuidV4()).not.toBe(a);
  });
  it('sets version and variant bits with a custom random source', () => {
    const u = uuidV4((b) => b.fill(0xff));
    expect(u).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });
});

describe('uuidV7', () => {
  it('embeds the millisecond timestamp', () => {
    const gen = createV7Generator(() => 1_700_000_000_123);
    const u = gen();
    expect(u).toMatch(RFC);
    expect(u[14]).toBe('7');
    const info = inspectUuid(u);
    expect(info.ok && info.timestampMs).toBe(1_700_000_000_123);
  });
  it('is strictly increasing within the same millisecond and across counter overflow', () => {
    const gen = createV7Generator(() => 1_000);
    const list = Array.from({ length: 5000 }, gen);
    for (let i = 1; i < list.length; i++) expect(list[i] > list[i - 1]).toBe(true);
  });
  it('stays monotonic if the clock goes backwards', () => {
    let t = 5_000;
    const gen = createV7Generator(() => t);
    const a = gen();
    t = 4_000;
    expect(gen() > a).toBe(true);
  });
});

describe('generate / format', () => {
  it('clamps the count', () => {
    expect(clampCount(0)).toBe(1);
    expect(clampCount(5000)).toBe(1000);
    expect(clampCount(Number.NaN)).toBe(1);
    expect(generate(4, 3)).toHaveLength(3);
    expect(new Set(generate(7, 1000)).size).toBe(1000);
  });
  it('formats', () => {
    const u = '0189e1b2-3c4d-7e5f-8a6b-7c8d9e0f1a2b';
    expect(formatUuid(u, { uppercase: true })).toBe('0189E1B2-3C4D-7E5F-8A6B-7C8D9E0F1A2B');
    expect(formatUuid(u, { hyphens: false })).toBe('0189e1b23c4d7e5f8a6b7c8d9e0f1a2b');
    expect(formatUuid(u, { braces: true })).toBe('{0189e1b2-3c4d-7e5f-8a6b-7c8d9e0f1a2b}');
  });
});

describe('inspectUuid', () => {
  it('reads version, variant and v1 timestamp', () => {
    // RFC 9562 Appendix A.1 example v1: 2022-02-22T19:22:22Z
    const r = inspectUuid('C232AB00-9414-11EC-B3C8-9F6BDECED846');
    expect(r).toMatchObject({
      ok: true,
      version: 1,
      variant: 'RFC 9562',
      canonical: 'c232ab00-9414-11ec-b3c8-9f6bdeced846',
    });
    expect(r.ok && new Date(r.timestampMs!).toISOString()).toBe('2022-02-22T19:22:22.000Z');
  });
  it('reads the RFC v7 example', () => {
    const r = inspectUuid('{017F22E2-79B0-7CC3-98C4-DC0C0C07398F}');
    expect(r.ok && r.version).toBe(7);
    expect(r.ok && new Date(r.timestampMs!).toISOString()).toBe('2022-02-22T19:22:22.000Z');
  });
  it('reads v6', () => {
    const r = inspectUuid('1EC9414C-232A-6B00-B3C8-9F6BDECED846');
    expect(r.ok && new Date(r.timestampMs!).toISOString()).toBe('2022-02-22T19:22:22.000Z');
  });
  it('accepts urn and no hyphens, recognises nil/max, rejects junk', () => {
    expect(inspectUuid('urn:uuid:550e8400-e29b-41d4-a716-446655440000')).toMatchObject({ ok: true, version: 4, kind: 'Random' });
    expect(inspectUuid('550e8400e29b41d4a716446655440000')).toMatchObject({
      ok: true,
      version: 4,
    });
    expect(inspectUuid('00000000-0000-0000-0000-000000000000')).toMatchObject({
      ok: true,
      kind: 'Nil UUID',
    });
    expect(inspectUuid('ffffffff-ffff-ffff-ffff-ffffffffffff')).toMatchObject({
      ok: true,
      kind: 'Max UUID',
    });
    expect(inspectUuid('550e8400-e29b41d4-a716-446655440000').ok).toBe(false);
    expect(inspectUuid('nope').ok).toBe(false);
    expect(inspectUuid('  ').ok).toBe(false);
    expect(inspectUuid('550e8400-e29b-41d4-c716-446655440000')).toMatchObject({
      variant: 'Microsoft (reserved)',
    });
  });
});
