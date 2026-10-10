import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/keyboard-event-viewer/features/keyboard-event-viewer';

describe('Keyboard Event Viewer', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
