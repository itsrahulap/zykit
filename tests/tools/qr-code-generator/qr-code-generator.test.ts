import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/qr-code-generator/features/qr-code-generator';

describe('QR Code Generator', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
