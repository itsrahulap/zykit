import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/toml-json/features/toml-json';

describe('TOML ↔ JSON', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
