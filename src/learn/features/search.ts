// Pure search over the Learn index: title matches rank above description matches, which
// rank above matches deeper in the lesson text. No DOM, so it's unit-tested directly.

import type { SearchEntry } from '../data/catalog.types';

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

export const MAX_RESULTS = 20;

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const isWordStart = (text: string, i: number) => i === 0 || !/[a-z0-9]/.test(text[i - 1]);

/** Relevance of one entry for an already-normalized query; 0 means no match. */
export function scoreEntry(entry: SearchEntry, query: string): number {
  if (!query) return 0;
  const title = normalize(entry.title);
  const tokens = query.split(' ');

  if (title === query) return 100;
  if (title.startsWith(query)) return 90;
  const at = title.indexOf(query);
  if (at !== -1) return isWordStart(title, at) ? 80 : 70;
  if (tokens.length > 1 && tokens.every((t) => title.includes(t))) return 60;

  const description = normalize(entry.description);
  if (description.includes(query)) return 40;
  const text = entry.text;
  if (text.includes(query)) return 30;
  if (tokens.length > 1 && tokens.every((t) => title.includes(t) || text.includes(t))) return 20;
  return 0;
}

/** Best matches first (ties keep index order), at most `limit` results. */
export function searchLearn(entries: readonly SearchEntry[], rawQuery: string, limit = MAX_RESULTS): SearchHit[] {
  const query = normalize(rawQuery);
  if (!query) return [];
  const hits: (SearchHit & { order: number })[] = [];
  entries.forEach((entry, order) => {
    const score = scoreEntry(entry, query);
    if (score > 0) hits.push({ entry, score, order });
  });
  hits.sort((a, b) => b.score - a.score || a.order - b.order);
  return hits.slice(0, limit).map(({ entry, score }) => ({ entry, score }));
}

export interface TextPart {
  text: string;
  match: boolean;
}

/** Splits `title` around the first case-insensitive occurrence of the query (or of each query word). */
export function highlightParts(title: string, rawQuery: string): TextPart[] {
  const query = normalize(rawQuery);
  if (!query) return [{ text: title, match: false }];
  const lower = title.toLowerCase();
  const needles = lower.includes(query) ? [query] : query.split(' ');

  // Collect match ranges, then merge overlaps so each character is emitted once.
  const ranges: [number, number][] = [];
  for (const n of needles) {
    const i = lower.indexOf(n);
    if (n && i !== -1) ranges.push([i, i + n.length]);
  }
  if (ranges.length === 0) return [{ text: title, match: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }

  const parts: TextPart[] = [];
  let pos = 0;
  for (const [start, end] of merged) {
    if (start > pos) parts.push({ text: title.slice(pos, start), match: false });
    parts.push({ text: title.slice(start, end), match: true });
    pos = end;
  }
  if (pos < title.length) parts.push({ text: title.slice(pos), match: false });
  return parts;
}
