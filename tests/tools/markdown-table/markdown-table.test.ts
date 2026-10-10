import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/markdown-table/features/markdown-table';

describe('Markdown Table Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
