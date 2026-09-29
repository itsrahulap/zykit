import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/image-base64/features/image-base64';

describe('Image to Base64', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
