import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/json-schema/features/json-schema';

describe('JSON Schema Validator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
