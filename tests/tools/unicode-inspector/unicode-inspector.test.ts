import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/unicode-inspector/features/unicode-inspector';

describe('Unicode Inspector', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
