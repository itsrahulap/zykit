import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/protobuf-decoder/features/protobuf-decoder';

describe('Protobuf Decoder', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
