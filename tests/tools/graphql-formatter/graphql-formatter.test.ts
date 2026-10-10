import { describe, expect, it } from 'vitest';
import { transform } from '../../../src/tools/graphql-formatter/features/graphql-formatter';

describe('GraphQL Formatter', () => {
  it('transforms input', () => {
    expect(transform('abc')).toBe('abc');
  });
});
