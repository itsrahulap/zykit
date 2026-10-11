import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/xml-formatter/features/xml-formatter';

describe('XML Formatter & XPath', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
