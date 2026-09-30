import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/ip-cidr-calculator/features/ip-cidr-calculator';

describe('IP / CIDR Calculator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
