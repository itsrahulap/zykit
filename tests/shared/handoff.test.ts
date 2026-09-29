import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HANDOFF_KEY, HANDOFF_TTL_MS, parseHandoff, sendText, takeHandoff } from '../../src/shared/lib/handoff';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

describe('Send to… handoff', () => {
  let store: MemoryStorage;
  beforeEach(() => {
    store = new MemoryStorage();
    (globalThis as { sessionStorage?: unknown }).sessionStorage = store;
  });
  afterEach(() => {
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
  });

  it('is consumed once, by the tool it is addressed to', () => {
    const now = 1_000_000;
    expect(sendText({ to: 'json-formatter', text: '{"a":1}', from: 'csv-json', kind: 'json' }, now)).toBe(true);
    expect(takeHandoff('json-diff', now)).toBeNull();
    expect(store.getItem(HANDOFF_KEY)).not.toBeNull();
    expect(takeHandoff('json-formatter', now + 1000)).toEqual({ to: 'json-formatter', text: '{"a":1}', from: 'csv-json', at: now, kind: 'json' });
    expect(takeHandoff('json-formatter', now + 2000)).toBeNull();
  });

  it('drops stale and malformed handoffs', () => {
    const now = 5_000_000;
    sendText({ to: 'x', text: 'hi', from: 'y' }, now);
    expect(takeHandoff('x', now + HANDOFF_TTL_MS + 1)).toBeNull();
    expect(store.getItem(HANDOFF_KEY)).toBeNull();

    store.setItem(HANDOFF_KEY, '{nope');
    expect(takeHandoff('x', now)).toBeNull();
    expect(store.getItem(HANDOFF_KEY)).toBeNull();

    expect(parseHandoff(null)).toBeNull();
    expect(parseHandoff(JSON.stringify({ to: 'x', text: '', from: 'y', at: now }), now)).toBeNull();
    expect(parseHandoff(JSON.stringify({ to: 'x', text: 1, from: 'y', at: now }), now)).toBeNull();
    expect(parseHandoff(JSON.stringify({ to: 'x', text: 'a', at: now + 10 * 60_000 }), now)).toBeNull();
    expect(parseHandoff('null', now)).toBeNull();
  });

  it('keeps the language hint and ignores junk fields', () => {
    const now = 1;
    const raw = JSON.stringify({ to: 'js-runner', text: 'let a: number', from: 'learn', at: now, lang: 'ts', evil: '<script>' });
    expect(parseHandoff(raw, now)).toEqual({ to: 'js-runner', text: 'let a: number', from: 'learn', at: now, lang: 'ts' });
  });

  it('fails softly when storage is unavailable', () => {
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    expect(sendText({ to: 'x', text: 'a', from: 'y' })).toBe(false);
    expect(takeHandoff('x')).toBeNull();
  });
});
