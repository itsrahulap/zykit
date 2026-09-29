import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/favicon-generator/features/favicon-generator';

describe('Favicon Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
