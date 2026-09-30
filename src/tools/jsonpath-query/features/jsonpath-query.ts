// Runs a JSONPath query over JSON text, with located errors for both. Pure TypeScript (used by the worker).

import { parseJson } from '../../json-formatter/features/json';
import { textError, type TextError } from '../../../shared/lib/textpos';
import { evaluate, JsonPathError, parseQuery, type Match } from './jsonpath';

/** Only this many matches are sent back and rendered; the count is always exact. */
export const MAX_RESULTS = 2000;

export type QueryResult =
  | { ok: true; matches: Match[]; total: number }
  | { ok: false; where: 'json' | 'query'; error: TextError };

export function runQuery(jsonText: string, query: string): QueryResult {
  let q;
  try {
    q = parseQuery(query);
  } catch (err) {
    if (err instanceof JsonPathError) return { ok: false, where: 'query', error: textError(query, err.offset, err.message) };
    throw err;
  }
  const parsed = parseJson(jsonText);
  if (!parsed.ok) return { ok: false, where: 'json', error: parsed.error };
  const doc: unknown = JSON.parse(jsonText);
  try {
    const all = evaluate(q, doc);
    return { ok: true, matches: all.slice(0, MAX_RESULTS), total: all.length };
  } catch (err) {
    if (err instanceof JsonPathError) return { ok: false, where: 'query', error: textError(query, err.offset, err.message) };
    throw err;
  }
}

export const BOOKSTORE = `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "isbn": "0-553-21311-3", "price": 8.99 },
      { "category": "fiction", "author": "J. R. R. Tolkien", "title": "The Lord of the Rings", "isbn": "0-395-19395-8", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 399 }
  }
}`;

export const EXAMPLES: { query: string; label: string }[] = [
  { query: '$.store.book[*].author', label: 'Authors of all books' },
  { query: '$..author', label: 'All authors' },
  { query: '$.store.*', label: 'Everything in the store' },
  { query: '$.store..price', label: 'All prices' },
  { query: '$..book[2]', label: 'The third book' },
  { query: '$..book[-1]', label: 'The last book' },
  { query: '$..book[:2]', label: 'The first two books' },
  { query: '$..book[?@.isbn]', label: 'Books with an ISBN' },
  { query: '$..book[?@.price < 10]', label: 'Books under 10' },
  { query: "$..book[?@.category == 'fiction' && @.price > 10].title", label: 'Fiction over 10' },
  { query: "$..book[?match(@.author, '.* Rees|.*Tolkien')]", label: 'match() on author' },
  { query: "$..book[?search(@.title, 'the')]", label: 'search() in title' },
  { query: '$..book[?length(@.title) > 15].title', label: 'Long titles' },
  { query: '$.store[?count(@.*) > 2]', label: 'count() of members' },
  { query: '$..*', label: 'All members and elements' },
];
