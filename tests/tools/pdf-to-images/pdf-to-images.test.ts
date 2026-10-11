import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/pdf-to-images/features/pdf-to-images';

describe('PDF to Images', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
