import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/html-css-minifier/features/html-css-minifier';

describe('HTML & CSS Minifier', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
