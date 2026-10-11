import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/placeholder-image/features/placeholder-image';

describe('Placeholder Image Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
