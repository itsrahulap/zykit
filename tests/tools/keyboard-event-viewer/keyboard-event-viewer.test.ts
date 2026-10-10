import { describe, expect, it } from 'vitest';
import { addToHistory, announcement, HISTORY_LIMIT, keyLabel, toJson, toMarkdown, toRecord, type KeyLike } from '../../../src/tools/keyboard-event-viewer/features/keyboard';

const ev = (o: Partial<KeyLike> = {}, locks: string[] = []): KeyLike => ({
  type: 'keydown', key: 'a', code: 'KeyA', keyCode: 65, which: 65, location: 0,
  ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, repeat: false, isComposing: false, timeStamp: 12.345,
  getModifierState: (k) => locks.includes(k), ...o,
});

describe('keyboard records', () => {
  it('maps fields, location, modifiers and locks', () => {
    const r = toRecord(ev({ key: '5', code: 'Numpad5', location: 3, ctrlKey: true, shiftKey: true }, ['NumLock']), 1);
    expect(r).toMatchObject({ location: 'numpad', modifiers: ['Ctrl', 'Shift'], numLock: true, capsLock: false, timeStamp: 12.3, n: 1 });
    expect(toRecord(ev({ location: 1, type: 'keyup' }), 2)).toMatchObject({ location: 'left', type: 'keyup' });
  });
  it('labels invisible keys', () => {
    expect(keyLabel(' ')).toBe('Space');
    expect(keyLabel('')).toBe('(none)');
  });
  it('announces only first keydown, not repeats or keyups', () => {
    expect(announcement(toRecord(ev(), 1))).toBe('Key a, code KeyA');
    expect(announcement(toRecord(ev({ repeat: true }), 2))).toBe('');
    expect(announcement(toRecord(ev({ type: 'keyup' }), 3))).toBe('');
  });
  it('keeps the newest 50', () => {
    let h: ReturnType<typeof toRecord>[] = [];
    for (let i = 1; i <= 60; i++) h = addToHistory(h, toRecord(ev(), i));
    expect(h).toHaveLength(HISTORY_LIMIT);
    expect(h[0].n).toBe(60);
  });
  it('exports JSON and an escaped Markdown table', () => {
    const h = [toRecord(ev({ key: '|' }), 1)];
    expect(JSON.parse(toJson(h))[0].key).toBe('|');
    const md = toMarkdown(h);
    expect(md.split('\n')).toHaveLength(3);
    expect(md).toContain('`\\|`');
  });
});
