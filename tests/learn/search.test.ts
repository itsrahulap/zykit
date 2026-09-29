import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '../../src/learn/data/catalog.types';
import { highlightParts, scoreEntry, searchLearn } from '../../src/learn/features/search';
import { searchEntries } from '../../src/learn/data/search.generated';

const entry = (id: string, title: string, description = '', text = '', kind: SearchEntry['kind'] = 'topic'): SearchEntry => ({
  kind,
  subjectId: 'javascript',
  id,
  title,
  description,
  text: `${title} ${description} ${text}`.toLowerCase(),
});

const entries: SearchEntry[] = [
  entry('scope', 'Scope', 'Where variables are visible.', 'a closure remembers its scope'),
  entry('iife', 'IIFE', 'Runs a function immediately, often to create a closure.'),
  entry('closures', 'Closures', 'Functions that remember their scope.'),
  entry('closure-loops', 'Loops and closures'),
  entry('enclosure', 'Enclosure patterns'),
  entry('two-sum', 'Two Sum', 'Easy · find two numbers', '', 'problem'),
];

describe('searchLearn', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(searchLearn(entries, '')).toEqual([]);
    expect(searchLearn(entries, '   ')).toEqual([]);
  });

  it('ranks title matches above description and text matches', () => {
    const ids = searchLearn(entries, 'closure').map((h) => h.entry.id);
    expect(ids).toEqual(['closures', 'closure-loops', 'enclosure', 'iife', 'scope']);
  });

  it('prefers a title prefix to a word inside the title, and a word start to a mid-word match', () => {
    const [prefix, word, mid] = ['closures', 'closure-loops', 'enclosure'].map((id) =>
      scoreEntry(entries.find((e) => e.id === id)!, 'closure'),
    );
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(mid);
  });

  it('is case-insensitive and collapses whitespace', () => {
    expect(searchLearn(entries, '  TWO   sum ')[0].entry.id).toBe('two-sum');
  });

  it('matches multi-word queries whose words appear separately', () => {
    expect(searchLearn(entries, 'loops closures').map((h) => h.entry.id)).toContain('closure-loops');
  });

  it('caps the number of results', () => {
    const many = Array.from({ length: 50 }, (_, i) => entry(`t${i}`, `Topic ${i}`));
    expect(searchLearn(many, 'topic')).toHaveLength(20);
    expect(searchLearn(many, 'topic', 5)).toHaveLength(5);
  });

  it('finds the real closures lesson first', () => {
    const [first] = searchLearn(searchEntries, 'closure');
    expect(first.entry).toMatchObject({ kind: 'topic', subjectId: 'javascript', id: 'closures' });
  });
});

describe('highlightParts', () => {
  it('splits around the matched part, keeping original case', () => {
    expect(highlightParts('Loops and Closures', 'closure')).toEqual([
      { text: 'Loops and ', match: false },
      { text: 'Closure', match: true },
      { text: 's', match: false },
    ]);
  });

  it('highlights each word of a multi-word query', () => {
    expect(highlightParts('Loops and closures', 'closures loops')).toEqual([
      { text: 'Loops', match: true },
      { text: ' and ', match: false },
      { text: 'closures', match: true },
    ]);
  });

  it('returns the whole title unmarked when nothing matches', () => {
    expect(highlightParts('Scope', 'closure')).toEqual([{ text: 'Scope', match: false }]);
    expect(highlightParts('Scope', '')).toEqual([{ text: 'Scope', match: false }]);
  });
});
