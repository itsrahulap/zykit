import { describe, expect, it } from 'vitest';
import { errorSnippet, jsonErrorOffset, lineCol, parseJsonText } from '../../src/shared/lib/textpos';

describe('textpos', () => {
  it('maps offsets to lines and columns', () => {
    expect(lineCol('ab\ncd', 0)).toEqual({ line: 1, column: 1 });
    expect(lineCol('ab\ncd', 4)).toEqual({ line: 2, column: 2 });
  });
  it('finds the first invalid JSON character', () => {
    expect(jsonErrorOffset('[{"a":1},\n]')).toBe(10);
    expect(jsonErrorOffset('{"a" 1}')).toBe(5);
    expect(jsonErrorOffset('{"a":tru}')).toBe(5);
    expect(jsonErrorOffset('[1,2')).toBe(4);
    expect(jsonErrorOffset('{"a":"\\x"}')).toBe(7);
    expect(jsonErrorOffset('1 2')).toBe(2);
  });
  it('parses JSON with located, tidy errors', () => {
    expect(parseJsonText('[1]')).toEqual({ ok: true, value: [1] });
    const r = parseJsonText('[{"a":1},\n]');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toMatchObject({ line: 2, column: 1 });
      expect(r.error.message).not.toMatch(/is not valid JSON/);
      expect(errorSnippet('[{"a":1},\n]', r.error)).toBe('2 | ]\n  | ^');
    }
  });
});
