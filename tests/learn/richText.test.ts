import { describe, expect, it } from 'vitest';
import { parseBlocks, parseInline } from '../../src/learn/features/richText';

describe('rich text', () => {
  it('parses inline bold, code and italic', () => {
    expect(parseInline('Use **let** or `const`, *not* var.')).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'bold', text: 'let' },
      { kind: 'text', text: ' or ' },
      { kind: 'code', text: 'const' },
      { kind: 'text', text: ', ' },
      { kind: 'italic', text: 'not' },
      { kind: 'text', text: ' var.' },
    ]);
  });

  it('leaves multiplication and lone asterisks alone', () => {
    expect(parseInline('a * b * c')).toEqual([{ kind: 'text', text: 'a * b * c' }]);
  });

  it('keeps code containing asterisks intact', () => {
    expect(parseInline('`a ** 2`')).toEqual([{ kind: 'code', text: 'a ** 2' }]);
  });

  it('splits paragraphs and bullet lists, joining wrapped lines', () => {
    expect(parseBlocks('First line\ncontinues.\n\n- one\n- **two**\n\nLast.')).toEqual([
      { kind: 'paragraph', inlines: [{ kind: 'text', text: 'First line continues.' }] },
      { kind: 'list', items: [[{ kind: 'text', text: 'one' }], [{ kind: 'bold', text: 'two' }]] },
      { kind: 'paragraph', inlines: [{ kind: 'text', text: 'Last.' }] },
    ]);
  });
});

describe('rich text to static HTML', async () => {
  const { richTextToHtml, plainText } = await import('../../src/learn/features/richTextHtml');

  it('escapes everything and only emits known tags', () => {
    expect(richTextToHtml('Use **<b>** and `a < b`\n\n- one & two')).toBe(
      '<p>Use <strong>&lt;b&gt;</strong> and <code>a &lt; b</code></p><ul><li>one &amp; two</li></ul>',
    );
  });

  it('builds a trimmed plain-text description', () => {
    expect(plainText('A **closure** keeps `vars`.')).toBe('A closure keeps vars.');
    const long = plainText('word '.repeat(100), 30);
    expect(long.length).toBeLessThanOrEqual(30);
    expect(long.endsWith('…')).toBe(true);
  });
});
