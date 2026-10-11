import { describe, expect, it } from 'vitest';
import {
  groupBySize,
  groupDuplicates,
  pickCandidates,
  toCsv,
  toHex,
  toJson,
  totalWasted,
  type Entry,
} from '../../../src/tools/duplicate-file-finder/features/duplicate-file-finder';

const e = (id: number, path: string, size: number): Entry => ({ id, path, size });
const files = [e(1, 'a.txt', 10), e(2, 'b/a.txt', 10), e(3, 'c.txt', 10), e(4, 'd.txt', 20), e(5, 'e.txt', 0), e(6, 'f.txt', 0), e(7, 'g.bin', 30), e(8, 'h.bin', 30)];

describe('Duplicate File Finder', () => {
  it('groups by size', () => {
    expect([...groupBySize(files).keys()]).toEqual([10, 20, 0, 30]);
  });

  it('picks only same-size, non-empty candidates', () => {
    const c = pickCandidates(files);
    expect(c.toHash.map((x) => x.id)).toEqual([1, 2, 3, 7, 8]);
    expect(c.empty).toBe(2);
  });

  it('applies the per-file and total byte limits', () => {
    expect(pickCandidates(files, 20).tooLarge.map((x) => x.id)).toEqual([7, 8]);
    const c = pickCandidates(files, 100, 40);
    expect(c.toHash.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(c.overBudget.map((x) => x.id)).toEqual([7, 8]);
  });

  it('builds duplicate groups with wasted space, biggest first', () => {
    const hashes = new Map([[1, 'aa'], [2, 'aa'], [3, 'bb'], [7, 'cc'], [8, 'cc']]);
    const g = groupDuplicates(pickCandidates(files).toHash, hashes);
    expect(g).toHaveLength(2);
    expect(g[0]).toMatchObject({ hash: 'cc', size: 30, wasted: 30, paths: ['g.bin', 'h.bin'] });
    expect(g[1]).toMatchObject({ hash: 'aa', size: 10, wasted: 10 });
    expect(totalWasted(g)).toBe(40);
  });

  it('three copies waste two', () => {
    const g = groupDuplicates(files.slice(0, 3), new Map([[1, 'x'], [2, 'x'], [3, 'x']]));
    expect(g[0].wasted).toBe(20);
  });

  it('same hash with different size is not a duplicate', () => {
    expect(groupDuplicates([e(1, 'a', 1), e(2, 'b', 2)], new Map([[1, 'x'], [2, 'x']]))).toEqual([]);
  });

  it('exports CSV (escaped, formula-safe) and JSON', () => {
    const g = [{ hash: 'ab', size: 5, wasted: 5, paths: ['=cmd', 'a,"b".txt'] }];
    const csv = toCsv(g).split('\r\n');
    expect(csv[0]).toBe('group,sha256,size_bytes,copies,wasted_bytes,path');
    expect(csv[1]).toBe("1,ab,5,2,5,'=cmd");
    expect(csv[2]).toBe('1,ab,5,2,5,"a,""b"".txt"');
    expect(JSON.parse(toJson(g))).toMatchObject({ algorithm: 'SHA-256', wastedBytes: 5, groups: g });
  });

  it('hex-encodes a SHA-256 digest', async () => {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('abc'));
    expect(toHex(d)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
