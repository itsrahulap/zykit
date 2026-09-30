import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/jsonpath-query/features/jsonpath-query';

describe('JSONPath Query', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
