import { describe, expect, it } from 'vitest';
import { cellWidth, escapeCell, formatTable, parseMarkdownTable, rowsFromJson } from '../../../src/tools/markdown-table/features/markdown-table';

describe('markdown table', () => {
  it('measures wide and zero-width characters', () => {
    expect(cellWidth('abc')).toBe(3);
    expect(cellWidth('日本')).toBe(4);
    expect(cellWidth('é')).toBe(1);
    expect(cellWidth('😀')).toBe(2);
  });
  it('escapes pipes and newlines', () => {
    expect(escapeCell('a|b\nc')).toBe('a\\|b<br>c');
    expect(escapeCell('a\\|b')).toBe('a\\|b');
  });
  it('pads columns with alignment', () => {
    expect(formatTable([['Name', 'Qty', 'X'], ['Apple', '3', 'y']], ['left', 'right', 'center'])).toBe(
      '| Name  | Qty |  X  |\n| :---- | --: | :-: |\n| Apple |   3 |  y  |\n',
    );
  });
  it('pads wide characters by display width', () => {
    expect(formatTable([['a'], ['日本']])).toBe('| a    |\n| ---- |\n| 日本 |\n');
  });
  it('compact output and ragged rows', () => {
    expect(formatTable([['a', 'b'], ['1']], [], { padded: false })).toBe('| a | b |\n| --- | --- |\n| 1 |  |\n');
  });
  it('reads JSON shapes', () => {
    expect(rowsFromJson([{ a: 1, b: null }, { c: { d: 1 } }])).toEqual({ rows: [['a', 'b', 'c'], ['1', '', ''], ['', '', '{"d":1}']] });
    expect(rowsFromJson([[1, 2], [3]])).toEqual({ rows: [['1', '2'], ['3']] });
    expect(rowsFromJson(['x'])).toEqual({ rows: [['value'], ['x']] });
    expect(rowsFromJson({})).toHaveProperty('error');
    expect(rowsFromJson([1, {}])).toHaveProperty('error');
  });
  it('parses and reformats an existing table, keeping escaped pipes', () => {
    const t = parseMarkdownTable('intro\n|a|b|\n|:-|-:|\n|x\\|y|2|\n\nafter')!;
    expect(t.aligns).toEqual(['left', 'right']);
    expect(formatTable(t.rows, t.aligns, { escaped: true })).toBe('| a    |   b |\n| :--- | --: |\n| x\\|y |   2 |\n');
    expect(parseMarkdownTable('no table here')).toBeNull();
  });
});
