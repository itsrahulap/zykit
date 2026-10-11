import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/text-to-speech/features/text-to-speech';

describe('Text to Speech', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
