import { describe, expect, it } from 'vitest';
import { CASE_FORMATS, convertLines, splitWords, type CaseId } from '../../../src/tools/case-converter/features/case';

const conv = (id: CaseId, text: string) => CASE_FORMATS.find((f) => f.id === id)!.convert(text);

describe('splitWords', () => {
  it('splits camel and Pascal humps including acronyms', () => {
    expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
    expect(splitWords('getHTTPResponseCode')).toEqual(['get', 'HTTP', 'Response', 'Code']);
    expect(splitWords('fooBarBaz')).toEqual(['foo', 'Bar', 'Baz']);
    expect(splitWords('IOStream')).toEqual(['IO', 'Stream']);
  });

  it('splits on separators and digits', () => {
    expect(splitWords('snake_case-and.kebab/path case')).toEqual(['snake', 'case', 'and', 'kebab', 'path', 'case']);
    expect(splitWords('version2Update10')).toEqual(['version', '2', 'Update', '10']);
    expect(splitWords('HTML5 parser')).toEqual(['HTML', '5', 'parser']);
  });

  it('handles Unicode letters and apostrophes', () => {
    expect(splitWords('Ärger über Straße')).toEqual(['Ärger', 'über', 'Straße']);
    expect(splitWords('crèmeBrûlée')).toEqual(['crème', 'Brûlée']);
    expect(splitWords("don't stop")).toEqual(['dont', 'stop']);
  });

  it('returns nothing for empty or symbol-only input', () => {
    expect(splitWords('')).toEqual([]);
    expect(splitWords('  -- __ ')).toEqual([]);
  });
});

describe('formats', () => {
  const input = 'XMLHttpRequest handler';
  it.each([
    ['camel', 'xmlHttpRequestHandler'],
    ['pascal', 'XmlHttpRequestHandler'],
    ['snake', 'xml_http_request_handler'],
    ['constant', 'XML_HTTP_REQUEST_HANDLER'],
    ['kebab', 'xml-http-request-handler'],
    ['train', 'Xml-Http-Request-Handler'],
    ['dot', 'xml.http.request.handler'],
    ['path', 'xml/http/request/handler'],
  ] as [CaseId, string][])('%s', (id, expected) => {
    expect(conv(id, input)).toBe(expected);
  });

  it('title case keeps small words lowercase except first and last', () => {
    expect(conv('title', 'the lord of the rings')).toBe('The Lord of the Rings');
    expect(conv('title', 'a tale OF two cities')).toBe('A Tale of Two Cities');
    expect(conv('title', 'what is it for')).toBe('What Is It For');
  });

  it('sentence case capitalises sentence starts', () => {
    expect(conv('sentence', 'HELLO THERE. how ARE you? fine')).toBe('Hello there. How are you? Fine');
  });

  it('lower, upper, alternating and inverse', () => {
    expect(conv('lower', 'Hello World')).toBe('hello world');
    expect(conv('upper', 'Hello World')).toBe('HELLO WORLD');
    expect(conv('alternating', 'hello world')).toBe('hElLo WoRlD');
    expect(conv('inverse', 'Hello World')).toBe('hELLO wORLD');
  });
});

describe('convertLines', () => {
  it('converts each line separately', () => {
    const snake = CASE_FORMATS.find((f) => f.id === 'snake')!;
    expect(convertLines('userId\nfirstName\n\nlastName', snake)).toBe('user_id\nfirst_name\n\nlast_name');
  });
});
