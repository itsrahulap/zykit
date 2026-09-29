import { describe, expect, it } from 'vitest';
import { errorSnippet } from '../../../src/shared/lib/textpos';
import {
  decodeString,
  formatJson,
  isBigNumber,
  parseJson,
  utf8Length,
  type JsonNode,
  type ParseResult,
} from '../../../src/tools/json-formatter/features/json';

function ok(text: string) {
  const r = parseJson(text);
  if (!r.ok) throw new Error(`unexpected parse error: ${r.error.message}`);
  return r;
}

function err(text: string) {
  const r: ParseResult = parseJson(text);
  if (r.ok) throw new Error('expected a parse error');
  return r.error;
}

const fmt = (text: string, indent: 2 | 4 | 'tab' | null, sortKeys = false) => formatJson(ok(text).value, { indent, sortKeys });

describe('formatting', () => {
  const src = '{"b":1,"a":[true,false,null,{"z":"x","y":[]}],"c":{}}';

  it('pretty-prints with 2 spaces, 4 spaces or tabs', () => {
    expect(fmt(src, 2)).toBe(JSON.stringify(JSON.parse(src), null, 2));
    expect(fmt(src, 4)).toBe(JSON.stringify(JSON.parse(src), null, 4));
    expect(fmt(src, 'tab')).toBe(JSON.stringify(JSON.parse(src), null, '\t'));
  });

  it('minifies', () => {
    expect(fmt(' {\n  "a" : [ 1 , 2 ] ,\n "b":"x y" }\n', null)).toBe('{"a":[1,2],"b":"x y"}');
  });

  it('sorts keys recursively', () => {
    expect(fmt(src, null, true)).toBe('{"a":[true,false,null,{"y":[],"z":"x"}],"b":1,"c":{}}');
    // Sorting uses decoded names, so escapes sort by the character they represent.
    expect(fmt('{"\\u0062":1,"a":2}', null, true)).toBe('{"a":2,"\\u0062":1}');
  });

  it('formats scalars at the top level', () => {
    expect(fmt(' "hi" ', 2)).toBe('"hi"');
    expect(fmt('-0.5e10', 2)).toBe('-0.5e10');
    expect(fmt('null', null)).toBe('null');
  });

  it('matches JSON.stringify on a varied document', () => {
    const value = { name: 'Zykit', list: [1, 2.5, -3e-7, 'two', { deep: [[[]]] }], nested: { t: true, n: null }, empty: '' };
    const text = JSON.stringify(value);
    expect(fmt(text, 2)).toBe(JSON.stringify(value, null, 2));
  });
});

describe('big numbers and escapes', () => {
  it('keeps numbers beyond 2^53 exactly as written and counts them', () => {
    const r = ok('{"id": 12345678901234567890, "small": 42, "pi": 3.14159265358979323846}');
    expect(r.stats.bigNumbers).toBe(2);
    expect(formatJson(r.value, { indent: null })).toBe('{"id":12345678901234567890,"small":42,"pi":3.14159265358979323846}');
  });

  it('detects precision loss by significant digits', () => {
    expect(isBigNumber('9007199254740993')).toBe(true);
    expect(isBigNumber('123456789012345')).toBe(false);
    expect(isBigNumber('-0.000000000000000001')).toBe(false);
    expect(isBigNumber('1.50000000000000000000')).toBe(false);
  });

  it('preserves unicode escapes and decodes them for keys', () => {
    const text = '{"caf\\u00e9": "\\ud83d\\ude00 \\"quoted\\" \\\\ \\n", "plain": "ü"}';
    const r = ok(text);
    const root = r.value as Extract<JsonNode, { type: 'object' }>;
    expect(root.entries[0].key).toBe('café');
    expect(decodeString(root.entries[0].value.type === 'string' ? root.entries[0].value.raw : '')).toBe('😀 "quoted" \\ \n');
    expect(formatJson(r.value, { indent: null })).toBe(text.replaceAll('": ', '":').replace('", "', '","'));
  });

  it('reports duplicate keys', () => {
    expect(ok('{"a":1,"b":2,"a":3}').stats.duplicateKeys).toEqual(['a']);
  });
});

describe('stats', () => {
  it('counts keys and depth', () => {
    const r = ok('{"a":{"b":{"c":[1,{"d":2}]}},"e":3}');
    expect(r.stats.keys).toBe(5);
    expect(r.stats.maxDepth).toBe(5);
    expect(ok('1').stats.maxDepth).toBe(0);
  });

  it('measures UTF-8 size', () => {
    expect(utf8Length('abc')).toBe(3);
    expect(utf8Length('é')).toBe(2);
    expect(utf8Length('€')).toBe(3);
    expect(utf8Length('😀')).toBe(4);
  });
});

describe('deep nesting', () => {
  it('handles depth 5000 without overflowing the stack', () => {
    const depth = 5000;
    const text = '['.repeat(depth) + '1' + ']'.repeat(depth);
    const r = ok(text);
    expect(r.stats.maxDepth).toBe(depth);
    expect(formatJson(r.value, { indent: null })).toBe(text);
    const pretty = formatJson(r.value, { indent: 2 });
    expect(pretty.split('\n')).toHaveLength(2 * depth + 1);
  });

  it('handles depth 200000 objects when minifying', () => {
    const depth = 200_000;
    const text = '{"a":'.repeat(depth) + 'null' + '}'.repeat(depth);
    const r = ok(text);
    expect(r.stats.maxDepth).toBe(depth);
    expect(formatJson(r.value, { indent: null, sortKeys: true })).toBe(text);
  });
});

describe('errors', () => {
  it.each([
    ['', 'The input is empty — nothing to parse', 1, 1],
    ['{"a": 1,}', "Unexpected '}' — trailing comma?", 1, 9],
    ['[1, 2,\n]', "Unexpected ']' — trailing comma?", 2, 1],
    ['{"a" 1}', "Expected ':' after property name, found '1'", 1, 6],
    ['{"a": "hello}', 'Unterminated string — missing closing quote', 1, 7],
    ['{"a": "hel\nlo"}', 'Unterminated string — line break inside a string (use \\n)', 1, 11],
    ['{"a": 1 "b": 2}', "Expected ',' or '}' after property value, found '\"' — missing comma?", 1, 9],
    ["{'a': 1}", 'Property names must use double quotes, not single quotes', 1, 2],
    ['{a: 1}', 'Property names must be in double quotes', 1, 2],
    ['[1, 2', "Unexpected end of input — expected ',' or ']' (array opened at line 1)", 1, 6],
    ['{"a": 01}', 'Numbers can’t have leading zeros', 1, 7],
    ['{"a": 1.}', 'Expected a digit after the decimal point', 1, 9],
    ['{"a": tru}', "Unexpected token 'tru' — did you mean 'true'?", 1, 7],
    ['{"a": True}', "JSON literals are lowercase — use 'true'", 1, 7],
    ['{"a": NaN}', 'NaN isn’t valid JSON — use null or a number', 1, 7],
    ['{"a": undefined}', 'undefined isn’t valid JSON — use null', 1, 7],
    ['{"a": "\\x"}', "Invalid escape sequence '\\x'", 1, 8],
    ['{"a": "\\u12G4"}', 'Invalid unicode escape — \\u must be followed by 4 hex digits', 1, 8],
    ['{"a": 1} x', "Unexpected 'x' after the end of the JSON value", 1, 10],
    ['// hi\n{}', 'Comments aren’t allowed in JSON', 1, 1],
    ['[1,\n  2,\n  3]]', "Unexpected ']' after the end of the JSON value", 3, 5],
    ['{"a": [1, 2}', "Expected ',' or ']' after array item, found '}' — mismatched bracket?", 1, 12],
    ['{"a":\t+1}', "Numbers can’t start with '+'", 1, 7],
    ['nullx', "Unexpected token 'nullx' — did you mean 'null'?", 1, 1],
  ])('%j → %s', (text, message, line, column) => {
    const e = err(text);
    expect(e.message).toBe(message);
    expect([e.line, e.column]).toEqual([line, column]);
  });

  it('rejects raw control characters and odd whitespace', () => {
    expect(err('{"a": "x\ty"}').message).toBe('Unescaped character U+0009 in string — control characters must be escaped');
    expect(err('{"a": 1}').message).toBe('Unexpected character U+00A0 — expected a value');
  });

  it('accepts a leading byte-order mark', () => {
    expect(parseJson('﻿{"a":1}').ok).toBe(true);
  });

  it('accepts everything JSON.parse accepts on a sample corpus', () => {
    for (const t of ['0', '-0', '1e5', '1E+5', '1.5e-3', '"\\/"', '[]', '{}', '[{}]', ' \r\n\t[1] ', '"\\u0000"']) {
      expect(parseJson(t).ok, t).toBe(true);
      expect(() => JSON.parse(t)).not.toThrow();
    }
  });

  it('builds a snippet with a caret under the error', () => {
    const text = '{\n  "a": 1,\n}';
    const e = err(text);
    expect(errorSnippet(text, e)).toBe('3 | }\n  | ^');
    const tabbed = '{\n\t"a" 1\n}';
    expect(errorSnippet(tabbed, err(tabbed))).toBe('2 | \t"a" 1\n  | \t    ^');
  });

  it('windows long lines around the error', () => {
    const text = `[${'1,'.repeat(200)}x]`;
    const e = err(text);
    const snippet = errorSnippet(text, e, 40);
    const [src, caret] = snippet.split('\n');
    expect(src.startsWith('1 | …')).toBe(true);
    expect(src[caret.indexOf('^')]).toBe('x');
  });
});
