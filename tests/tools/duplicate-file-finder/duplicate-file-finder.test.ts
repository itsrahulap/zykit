import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/duplicate-file-finder/features/duplicate-file-finder';

describe('Duplicate File Finder', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
