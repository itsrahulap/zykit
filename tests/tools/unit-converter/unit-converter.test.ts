import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/unit-converter/features/unit-converter';

describe('Unit Converter', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
