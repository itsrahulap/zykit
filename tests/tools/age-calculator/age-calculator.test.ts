import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/age-calculator/features/age-calculator';

describe('Age Calculator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
