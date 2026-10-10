import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/har-viewer/features/har-viewer';

describe('HAR Viewer', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
