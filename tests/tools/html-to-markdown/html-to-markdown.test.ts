import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/html-to-markdown/features/html-to-markdown';

describe('HTML to Markdown', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
