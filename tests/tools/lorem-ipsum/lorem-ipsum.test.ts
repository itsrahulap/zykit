import { describe, expect, it } from 'vitest';
import {
  ENGLISH_WORDS,
  generateBlocks,
  generateLorem,
  LIMITS,
  LOREM_WORDS,
  randInt,
  seededRng,
  type LoremOptions,
} from '../../../src/tools/lorem-ipsum/features/lorem-ipsum';

const base: LoremOptions = { words: 'lorem', unit: 'paragraphs', count: 3, startWithLorem: true, format: 'plain', seed: 'abc' };

describe('seededRng', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = seededRng('seed');
    const b = seededRng('seed');
    const c = seededRng('other');
    const xs = Array.from({ length: 1000 }, () => a());
    expect(Array.from({ length: 1000 }, () => b())).toEqual(xs);
    expect(c()).not.toBe(xs[0]);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
  it('covers integer ranges evenly enough', () => {
    const rng = seededRng('dist');
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 40_000; i++) counts[randInt(rng, 0, 3)]++;
    for (const n of counts) expect(Math.abs(n - 10_000)).toBeLessThan(600);
  });
});

describe('generateLorem', () => {
  it('starts with the classic sentence when asked', () => {
    expect(generateLorem(base).startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod')).toBe(true);
    expect(generateLorem({ ...base, startWithLorem: false, seed: 'x' }).startsWith('Lorem ipsum dolor sit amet, consectetur')).toBe(false);
  });

  it('is reproducible with the same seed and differs with another', () => {
    expect(generateLorem(base)).toBe(generateLorem(base));
    expect(generateLorem(base)).not.toBe(generateLorem({ ...base, seed: 'abd' }));
  });

  it('produces the requested number of paragraphs, sentences, words and items', () => {
    expect(generateLorem({ ...base, count: 4 }).split('\n\n')).toHaveLength(4);
    const sentences = generateLorem({ ...base, unit: 'sentences', count: 7 });
    expect(sentences.match(/\./g)).toHaveLength(7);
    const w = generateLorem({ ...base, unit: 'words', count: 25 });
    expect(w.replace(/\.$/, '').split(' ')).toHaveLength(25);
    expect(w.startsWith('Lorem ipsum dolor sit amet consectetur')).toBe(true);
    expect(generateLorem({ ...base, unit: 'words', count: 2 })).toBe('Lorem ipsum.');
    expect(generateLorem({ ...base, unit: 'list', count: 5 }).split('\n')).toHaveLength(5);
  });

  it('formats HTML and Markdown', () => {
    const html = generateLorem({ ...base, format: 'html', count: 2 });
    expect(html).toMatch(/^<p>Lorem ipsum.*<\/p>\n<p>.*<\/p>$/);
    const ul = generateLorem({ ...base, unit: 'list', format: 'html', count: 3 });
    expect(ul.split('\n')).toHaveLength(5);
    expect(ul).toMatch(/^<ul>\n {2}<li>Lorem ipsum dolor sit amet<\/li>/);
    const md = generateLorem({ ...base, unit: 'list', format: 'markdown', count: 3 });
    expect(md.split('\n').every((l) => l.startsWith('- '))).toBe(true);
    expect(generateLorem({ ...base, format: 'markdown', count: 2 }).split('\n\n')).toHaveLength(2);
  });

  it('uses the English list and ignores the classic start for it', () => {
    const out = generateLorem({ ...base, words: 'english', unit: 'words', count: 50 });
    const ws = out.toLowerCase().replace(/[.,]/g, '').split(' ');
    expect(ws.every((w) => ENGLISH_WORDS.includes(w))).toBe(true);
    expect(out.startsWith('Lorem')).toBe(false);
  });

  it('only uses words from the lorem list', () => {
    const ws = generateLorem({ ...base, count: 10, startWithLorem: false }).toLowerCase().replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
    expect(ws.every((w) => LOREM_WORDS.includes(w))).toBe(true);
  });

  it('clamps counts', () => {
    expect(generateBlocks({ ...base, count: 0 })).toEqual([]);
    expect(generateBlocks({ ...base, count: -3 })).toEqual([]);
    expect(generateBlocks({ ...base, unit: 'list', count: 1e9 })).toHaveLength(LIMITS.list);
  });
});
