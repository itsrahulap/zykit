import { describe, expect, it } from 'vitest';
import { htmlToMarkdown, type HNode } from '../../../src/tools/html-to-markdown/features/html-to-markdown';

type Spec = string | [string, Record<string, string>, ...Spec[]] | [string, ...Spec[]];
function el(spec: Spec): HNode {
  if (typeof spec === 'string') return { nodeType: spec.startsWith('!--') ? 8 : 3, nodeName: '#text', textContent: spec, childNodes: [] };
  const [name, ...rest] = spec;
  const attrs = (rest[0] && !Array.isArray(rest[0]) && typeof rest[0] === 'object' ? rest.shift() : {}) as Record<string, string>;
  const childNodes = (rest as Spec[]).map(el);
  const textContent = childNodes.map((c) => c.textContent ?? '').join('');
  return { nodeType: 1, nodeName: name.toUpperCase(), textContent, childNodes, getAttribute: (a) => attrs[a] ?? null };
}
const md = (specs: Spec[], o = {}) => htmlToMarkdown({ nodeType: 11, nodeName: '#fragment', textContent: '', childNodes: specs.map(el) }, o);

describe('html to markdown', () => {
  it('headings, paragraphs, emphasis, code, links, images', () => {
    expect(md([['h2', 'Title'], ['p', 'a ', ['strong', 'b'], ' ', ['em', 'i'], ' ', ['code', 'x'], ' ', ['a', { href: 'http://x.y', title: 'T' }, 'l'], ['img', { src: 's.png', alt: 'A' }]]])).toBe(
      '## Title\n\na **b** *i* `x` [l](http://x.y "T")![A](s.png)\n',
    );
  });
  it('setext headings and bullet option', () => {
    expect(md([['h1', 'Hi']], { heading: 'setext' })).toBe('Hi\n===\n');
    expect(md([['ul', ['li', 'a']]], { bullet: '*' })).toBe('* a\n');
  });
  it('nested and ordered lists', () => {
    expect(md([['ol', { start: '3' }, ['li', 'a', ['ul', ['li', 'b']]], ['li', 'c']]])).toBe('3. a\n   - b\n4. c\n');
  });
  it('blockquote, hr, br', () => {
    expect(md([['blockquote', ['p', 'q1'], ['p', 'q2']], ['hr'], ['p', 'a', ['br'], 'b']])).toBe('> q1\n>\n> q2\n\n---\n\na  \nb\n');
  });
  it('pre with language and fence adjustments', () => {
    const pre: Spec = ['pre', ['code', { class: 'language-ts' }, 'let a = "```";\n']];
    expect(md([pre])).toBe('````ts\nlet a = "```";\n````\n');
    expect(md([pre], { fence: '~~~' })).toBe('~~~ts\nlet a = "```";\n~~~\n');
    expect(md([['pre', 'x']], { fence: 'indent' })).toBe('    x\n');
  });
  it('GFM tables with alignment, escaped pipes and colspan padding', () => {
    expect(md([['table', ['tr', ['th', 'A'], ['th', { align: 'right' }, 'B']], ['tr', ['td', 'a|b'], ['td', '2']], ['tr', ['td', { colspan: '2' }, 'x']]]])).toBe(
      '| A | B |\n| --- | ---: |\n| a\\|b | 2 |\n| x |  |\n',
    );
  });
  it('drops script, style, comments and unsafe links', () => {
    expect(md([['script', 'alert(1)'], ['style', 'p{}'], ['p', '!--c', 'ok ', ['a', { href: 'javascript:alert(1)' }, 'bad']]])).toBe('ok bad\n');
  });
  it('escapes markdown syntax in text', () => {
    expect(md([['p', '*a* _b_ [c]']])).toBe('\\*a\\* \\_b\\_ \\[c\\]\n');
    expect(md([['p', '# not heading']])).toBe('\\# not heading\n');
  });
  it('keeps whitespace outside emphasis markers', () => {
    expect(md([['p', 'x', ['b', ' y '], 'z']])).toBe('x **y** z\n');
  });
  it('empty input', () => expect(md([])).toBe(''));
});
