import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/date-calculator/features/date-calculator';

describe('Date Calculator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
