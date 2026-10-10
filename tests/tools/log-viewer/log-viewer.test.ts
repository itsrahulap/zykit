import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/log-viewer/features/log-viewer';

describe('Log Viewer', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
