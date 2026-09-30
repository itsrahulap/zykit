import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/color-converter/features/color-converter';

describe('Color Converter', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
