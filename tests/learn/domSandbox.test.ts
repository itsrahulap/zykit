import { describe, expect, it } from 'vitest';
import { parseSandboxMessage, SANDBOX_TAG } from '../../src/learn/features/domSandbox';

const frame = {} as Window;
const other = {} as Window;
const ev = (data: unknown, origin = 'null', source: unknown = frame) => ({ data, origin, source }) as unknown as MessageEvent;

describe('parseSandboxMessage', () => {
  it('accepts well-formed messages from the frame', () => {
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'ready' }), frame)).toEqual({ source: SANDBOX_TAG, type: 'ready' });
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'log', level: 'warn', text: 'hi', depth: 2 }), frame)).toEqual({
      source: SANDBOX_TAG,
      type: 'log',
      level: 'warn',
      text: 'hi',
      depth: 2,
    });
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'done', ok: true, ms: 3 }), frame)).toMatchObject({ type: 'done', ok: true, ms: 3 });
  });
  it('rejects other windows, real origins and missing frames', () => {
    const msg = { source: SANDBOX_TAG, type: 'ready' };
    expect(parseSandboxMessage(ev(msg, 'null', other), frame)).toBeNull();
    expect(parseSandboxMessage(ev(msg, 'https://evil.example'), frame)).toBeNull();
    expect(parseSandboxMessage(ev(msg, 'http://localhost:4301'), frame)).toBeNull();
    expect(parseSandboxMessage(ev(msg), null)).toBeNull();
  });
  it('rejects malformed payloads', () => {
    expect(parseSandboxMessage(ev(null), frame)).toBeNull();
    expect(parseSandboxMessage(ev('ready'), frame)).toBeNull();
    expect(parseSandboxMessage(ev({ source: 'other', type: 'ready' }), frame)).toBeNull();
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'log', level: 'system', text: 'x' }), frame)).toBeNull();
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'log', level: 'log', text: 5 }), frame)).toBeNull();
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'eval' }), frame)).toBeNull();
  });
  it('clamps depth and treats a non-true ok as failure', () => {
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'log', level: 'log', text: 'x', depth: 99 }), frame)).toMatchObject({ depth: 10 });
    expect(parseSandboxMessage(ev({ source: SANDBOX_TAG, type: 'done', ok: 'yes' }), frame)).toMatchObject({ ok: false, ms: 0 });
  });
});
