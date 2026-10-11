import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/sip-calculator/features/sip-calculator';

describe('SIP & Compound Interest Calculator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
