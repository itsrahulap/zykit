import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/totp-generator/features/totp-generator';

describe('TOTP Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
