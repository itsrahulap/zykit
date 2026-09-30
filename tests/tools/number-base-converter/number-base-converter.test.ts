import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/number-base-converter/features/number-base-converter';

describe('Number Base Converter', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
