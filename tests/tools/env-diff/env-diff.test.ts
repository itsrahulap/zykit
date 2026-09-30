import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/env-diff/features/env-diff';

describe('.env Diff', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
