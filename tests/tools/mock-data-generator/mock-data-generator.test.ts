import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/mock-data-generator/features/mock-data-generator';

describe('Mock Data Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
