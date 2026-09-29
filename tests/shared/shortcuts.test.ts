import { describe, expect, it } from 'vitest';
import { isTypingTarget, matchShortcut, type KeyLike } from '../../src/shared/lib/shortcuts';

const key = (k: string, mods: Partial<Omit<KeyLike, 'key'>> = {}): KeyLike => ({ key: k, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods });

describe('matchShortcut', () => {
  it('treats Ctrl and ⌘ alike for "mod"', () => {
    expect(matchShortcut(key('Enter', { ctrlKey: true }), 'mod+enter')).toBe(true);
    expect(matchShortcut(key('Enter', { metaKey: true }), 'mod+enter')).toBe(true);
    expect(matchShortcut(key('Enter'), 'mod+enter')).toBe(false);
  });

  it('requires the exact modifiers', () => {
    expect(matchShortcut(key('C', { ctrlKey: true, shiftKey: true }), 'mod+shift+c')).toBe(true);
    expect(matchShortcut(key('c', { metaKey: true, shiftKey: true }), 'mod+shift+c')).toBe(true);
    expect(matchShortcut(key('c', { ctrlKey: true }), 'mod+shift+c')).toBe(false);
    expect(matchShortcut(key('c', { ctrlKey: true, shiftKey: true, altKey: true }), 'mod+shift+c')).toBe(false);
    expect(matchShortcut(key('s', { ctrlKey: true }), 'mod+s')).toBe(true);
    expect(matchShortcut(key('S', { ctrlKey: true, shiftKey: true }), 'mod+s')).toBe(false);
    expect(matchShortcut(key('Enter', { ctrlKey: true, shiftKey: true }), 'mod+enter')).toBe(false);
  });

  it('matches shifted punctuation without asking for Shift', () => {
    expect(matchShortcut(key('?', { shiftKey: true }), '?')).toBe(true);
    expect(matchShortcut(key('?', { ctrlKey: true, shiftKey: true }), '?')).toBe(false);
    expect(matchShortcut(key('/'), '/')).toBe(true);
    expect(matchShortcut(key('k'), '/')).toBe(false);
  });
});

describe('isTypingTarget', () => {
  const el = (tagName: string, extra: Record<string, unknown> = {}) => ({ tagName, isContentEditable: false, ...extra }) as unknown as EventTarget;
  it('knows text fields from other controls', () => {
    expect(isTypingTarget(el('TEXTAREA'))).toBe(true);
    expect(isTypingTarget(el('INPUT', { type: 'text' }))).toBe(true);
    expect(isTypingTarget(el('INPUT', { type: 'search' }))).toBe(true);
    expect(isTypingTarget(el('INPUT', { type: 'checkbox' }))).toBe(false);
    expect(isTypingTarget(el('DIV', { isContentEditable: true }))).toBe(true);
    expect(isTypingTarget(el('BUTTON'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
