import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/dockerfile-generator/features/dockerfile-generator';

describe('Dockerfile Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
