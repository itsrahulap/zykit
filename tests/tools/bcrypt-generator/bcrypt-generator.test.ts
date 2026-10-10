import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/bcrypt-generator/features/bcrypt-generator';

describe('Bcrypt Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
