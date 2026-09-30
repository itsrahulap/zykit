import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/csv-sql/features/csv-sql';

describe('Query CSV with SQL', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
