import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/pdf-tools/features/pdf-tools';

describe('PDF Merge & Split', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
