import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/string-escaper/features/string-escaper';

describe('String Escaper', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
