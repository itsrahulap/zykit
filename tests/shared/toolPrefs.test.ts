import { describe, expect, it } from 'vitest';
import { MAX_RECENT_TOOLS, pushRecent, toggleId } from '../../src/shared/lib/toolPrefs';

describe('tool favorites and recents', () => {
  it('toggles an id in and out, keeping order', () => {
    expect(toggleId([], 'a')).toEqual(['a']);
    expect(toggleId(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('moves a visit to the front without duplicates and caps the list', () => {
    expect(pushRecent(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
    const many = Array.from({ length: 12 }, (_, i) => `t${i}`);
    const next = pushRecent(many, 'new');
    expect(next).toHaveLength(MAX_RECENT_TOOLS);
    expect(next[0]).toBe('new');
  });
});
