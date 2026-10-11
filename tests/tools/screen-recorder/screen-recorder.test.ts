import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/screen-recorder/features/screen-recorder';

describe('Screen Recorder', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
