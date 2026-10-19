import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/webhook-payload-builder/features/webhook-payload-builder';

describe('Webhook Payload Builder', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
