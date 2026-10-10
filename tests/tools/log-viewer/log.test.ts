import { describe, expect, it } from 'vitest';
import { detectFields, EMPTY_FILTER, filterLog, flatten, levelCounts, parseLog, prettyEntry, toNdjson } from '../../../src/tools/log-viewer/features/log';

const NDJSON = [
  '{"time":"2025-01-01T10:00:00Z","level":"info","msg":"start","user":{"id":7,"name":"Bob"}}',
  '{"ts":1735725660000,"level":50,"message":"boom","user":{"id":8}}',
  '{"@timestamp":"2025-01-01T10:02:00Z","severity":"WARNING","msg":"slow"}',
  '',
  '{"msg":"no level"}',
].join('\n');

const TEXT = [
  '2025-01-01T10:00:00.123Z INFO server started',
  '2025-01-01 10:00:05,500 [ERROR] db failed',
  '  at connect (db.js:1)',
  '  at main (index.js:2)',
  'WARN: standalone warning',
  'just text',
].join('\n');

describe('parseLog', () => {
  it('reads JSON lines with level and time aliases', () => {
    const e = parseLog(NDJSON);
    expect(e).toHaveLength(4);
    expect(e.map((x) => x.level)).toEqual(['info', 'error', 'warn', 'other']);
    expect(e[0]).toMatchObject({ message: 'start', time: Date.parse('2025-01-01T10:00:00Z') });
    expect(e[1].time).toBe(1735725660000);
    expect(e[2].time).toBe(Date.parse('2025-01-01T10:02:00Z'));
    expect(e[3].time).toBeNull();
  });
  it('reads plain text with timestamps, levels and continuation lines', () => {
    const e = parseLog(TEXT);
    expect(e.map((x) => x.level)).toEqual(['info', 'error', 'warn', 'other']);
    expect(e[0]).toMatchObject({ message: 'server started', time: Date.parse('2025-01-01T10:00:00.123Z') });
    expect(e[1].message).toContain('at connect');
    expect(e[1].time).not.toBeNull();
    expect(e[2].message).toBe('standalone warning');
  });
  it('treats broken JSON as text and handles CRLF', () => {
    const e = parseLog('{"a":\r\nERROR x');
    expect(e.map((x) => x.raw)).toEqual(['{"a":', 'ERROR x']);
    expect(e[1].level).toBe('error');
  });
});

describe('fields and counts', () => {
  const e = parseLog(NDJSON);
  it('flattens and detects fields', () => {
    expect(flatten({ a: { b: 1 }, c: 'x', d: [1] })).toEqual({ 'a.b': '1', c: 'x', d: '[1]' });
    expect(detectFields(e).slice(0, 3).map((f) => f.name)).toEqual(['msg', 'level', 'user.id']);
  });
  it('counts levels', () => {
    expect(levelCounts(e)).toMatchObject({ info: 1, error: 1, warn: 1, other: 1, debug: 0 });
  });
});

describe('filterLog', () => {
  const e = parseLog(NDJSON);
  const f = (p: Partial<typeof EMPTY_FILTER>) => filterLog(e, { ...EMPTY_FILTER, ...p });
  it('filters by level, text and field', () => {
    expect(f({ levels: new Set(['error', 'warn']) })).toEqual([1, 2]);
    expect(f({ text: 'BOOM' })).toEqual([1]);
    expect(f({ fields: 'user.name=bob' })).toEqual([0]);
    expect(f({ fields: 'user.id=8 level=50' })).toEqual([1]);
    expect(f({ fields: 'user.id=9' })).toEqual([]);
  });
  it('filters by time range, excluding undated entries', () => {
    expect(f({ from: Date.parse('2025-01-01T10:00:30Z') })).toEqual([1, 2]);
    expect(f({ to: Date.parse('2025-01-01T10:00:30Z') })).toEqual([0]);
  });
});

describe('export and pretty', () => {
  it('exports filtered NDJSON, converting text lines', () => {
    const j = parseLog(NDJSON);
    expect(toNdjson(j, [0, 2]).split('\n').filter(Boolean)).toEqual([j[0].raw, j[2].raw]);
    const t = parseLog(TEXT);
    expect(JSON.parse(toNdjson(t, [0]))).toEqual({ time: '2025-01-01T10:00:00.123Z', level: 'info', message: 'server started' });
    expect(toNdjson(j, [])).toBe('');
  });
  it('pretty prints JSON entries', () => {
    expect(prettyEntry(parseLog('{"a":1}')[0])).toBe('{\n  "a": 1\n}');
  });
});
