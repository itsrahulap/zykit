import { describe, expect, it } from 'vitest';
import { categoryCounts, filterTools, queryTerms, scoreTool, type SearchableTool } from '../../src/shared/utils/toolSearch';

const t = (id: string, name: string, category: string, tags: string[] = [], description = '', tagline = ''): SearchableTool => ({
  id,
  name,
  category,
  tags,
  description,
  tagline,
});

const TOOLS = [
  t('json-formatter', 'JSON Formatter', 'Developer', ['JSON', 'Validate'], 'Format and validate JSON.'),
  t('word-counter', 'Word Counter', 'Text', ['Words', 'Reading time'], 'Count words and characters.'),
  t('case-converter', 'Case Converter', 'Text', ['camelCase'], 'Convert between cases.', 'snake_case and more'),
  t('clean-image', 'Clean Image', 'Images', ['EXIF', 'Privacy'], 'Remove metadata from photos.'),
];

describe('queryTerms', () => {
  it('lowercases, strips accents and splits', () => {
    expect(queryTerms('  Café  JSON ')).toEqual(['cafe', 'json']);
    expect(queryTerms('')).toEqual([]);
  });
});

describe('filterTools', () => {
  it('returns everything without query or category', () => {
    expect(filterTools(TOOLS, {})).toEqual(TOOLS);
  });

  it('matches name, tags, tagline and description', () => {
    expect(filterTools(TOOLS, { query: 'json' }).map((x) => x.id)).toEqual(['json-formatter']);
    expect(filterTools(TOOLS, { query: 'exif' }).map((x) => x.id)).toEqual(['clean-image']);
    expect(filterTools(TOOLS, { query: 'snake' }).map((x) => x.id)).toEqual(['case-converter']);
    expect(filterTools(TOOLS, { query: 'metadata' }).map((x) => x.id)).toEqual(['clean-image']);
  });

  it('requires every term to match', () => {
    expect(filterTools(TOOLS, { query: 'count words' }).map((x) => x.id)).toEqual(['word-counter']);
    expect(filterTools(TOOLS, { query: 'json image' })).toEqual([]);
  });

  it('ranks name matches above description matches', () => {
    const tools = [t('a', 'Alpha', 'X', [], 'mentions counter'), t('b', 'Counter', 'X')];
    expect(filterTools(tools, { query: 'counter' }).map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('filters by category and combines with query', () => {
    expect(filterTools(TOOLS, { category: 'Text' }).map((x) => x.id)).toEqual(['word-counter', 'case-converter']);
    expect(filterTools(TOOLS, { category: 'Text', query: 'convert' }).map((x) => x.id)).toEqual(['case-converter']);
    expect(filterTools(TOOLS, { category: 'Nope' })).toEqual([]);
  });

  it('scores 0 for no match', () => {
    expect(scoreTool(TOOLS[0], ['zzz'])).toBe(0);
  });
});

describe('categoryCounts', () => {
  it('counts per category in registry order, honouring the query', () => {
    expect(categoryCounts(TOOLS)).toEqual([
      { category: 'Developer', count: 1 },
      { category: 'Text', count: 2 },
      { category: 'Images', count: 1 },
    ]);
    expect(categoryCounts(TOOLS, 'count')).toEqual([
      { category: 'Developer', count: 0 },
      { category: 'Text', count: 1 },
      { category: 'Images', count: 0 },
    ]);
  });
});
