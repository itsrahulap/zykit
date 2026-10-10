import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/image-diff/features/image-diff';

describe('Image Diff', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
