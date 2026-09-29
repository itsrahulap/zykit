import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/svg-optimizer/features/svg-optimizer';

describe('SVG Optimizer', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
