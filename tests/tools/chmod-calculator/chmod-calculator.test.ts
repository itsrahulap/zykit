import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/chmod-calculator/features/chmod-calculator';

describe('chmod Calculator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
