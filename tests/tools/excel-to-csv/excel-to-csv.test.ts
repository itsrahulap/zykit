import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/excel-to-csv/features/excel-to-csv';

describe('Excel to CSV / JSON', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
