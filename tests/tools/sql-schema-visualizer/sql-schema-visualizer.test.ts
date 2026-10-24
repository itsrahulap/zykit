import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/sql-schema-visualizer/features/sql-schema-visualizer';

describe('SQL Schema Visualizer', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
