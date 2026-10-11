import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/json-tree-viewer/features/json-tree-viewer';

describe('JSON Tree Viewer', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
