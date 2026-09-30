import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/semver-checker/features/semver-checker';

describe('Semver Checker', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
