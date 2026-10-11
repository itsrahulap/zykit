import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/invoice-generator/features/invoice-generator';

describe('Invoice Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
