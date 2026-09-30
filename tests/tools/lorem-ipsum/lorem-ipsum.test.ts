import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/lorem-ipsum/features/lorem-ipsum';

describe('Lorem Ipsum Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
