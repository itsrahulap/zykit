import { describe, expect, it } from 'vitest';
import { cleanText, defaultSteps, type Step, type StepId, type StepOptions } from '../../../src/tools/text-cleaner/features/clean';

/** Only the given steps, enabled, in the given order. */
function only(...steps: [StepId, Partial<StepOptions[StepId]>?][]): Step[] {
  const defaults = defaultSteps();
  return steps.map(([id, opts]) => {
    const d = defaults.find((s) => s.id === id)!;
    return { ...d, enabled: true, options: { ...d.options, ...(opts ?? {}) } } as Step;
  });
}
const run = (input: string, ...steps: [StepId, Partial<StepOptions[StepId]>?][]) => cleanText(input, only(...steps)).output;

describe('cleanText', () => {
  it('applies the default pipeline: trim, remove empty, dedupe', () => {
    const r = cleanText('  b \n\n a\nb\n  \na\n', defaultSteps());
    expect(r.output).toBe('b\na\n');
    expect(r.linesBefore).toBe(6);
    expect(r.linesAfter).toBe(2);
  });
  it('trims start or end only', () => {
    expect(run('  a  ', ['trim', { mode: 'start' }])).toBe('a  ');
    expect(run('  a  ', ['trim', { mode: 'end' }])).toBe('  a');
  });
  it('collapses inner whitespace but keeps indentation', () => {
    expect(run('  a   b\t\tc', ['collapse'])).toBe('  a b c');
  });
  it('dedupes case-insensitively, keeping first or last', () => {
    expect(run('A\nb\na\nB', ['dedupe', { ignoreCase: true, keep: 'first' }])).toBe('A\nb');
    expect(run('A\nb\na\nB', ['dedupe', { ignoreCase: true, keep: 'last' }])).toBe('a\nB');
    expect(run('A\na', ['dedupe', { ignoreCase: false }])).toBe('A\na');
  });
  it('sorts A→Z, Z→A, naturally, by length and randomly (stable per seed)', () => {
    expect(run('b\nA\nc', ['sort', { order: 'az' }])).toBe('A\nb\nc');
    expect(run('b\nA\nc', ['sort', { order: 'za' }])).toBe('c\nb\nA');
    expect(run('item10\nitem2\nitem1', ['sort', { order: 'natural' }])).toBe('item1\nitem2\nitem10');
    expect(run('item10\nitem2\nitem1', ['sort', { order: 'az' }])).toBe('item1\nitem10\nitem2');
    expect(run('ccc\na\nbb', ['sort', { order: 'length' }])).toBe('a\nbb\nccc');
    const lines = Array.from({ length: 20 }, (_, i) => `l${i}`).join('\n');
    const a = run(lines, ['sort', { order: 'random', seed: 7 }]);
    expect(a).toBe(run(lines, ['sort', { order: 'random', seed: 7 }]));
    expect(a).not.toBe(lines);
    expect(a.split('\n').sort()).toEqual(lines.split('\n').sort());
  });
  it('reverses, numbers and adds prefix/suffix', () => {
    expect(run('a\nb', ['reverse'])).toBe('b\na');
    expect(run('a\nb', ['number'])).toBe('1. a\n2. b');
    const ten = Array.from({ length: 10 }, () => 'x').join('\n');
    expect(run(ten, ['number', { pad: true, separator: ': ' }]).split('\n')[0]).toBe('01: x');
    expect(run('a\nb', ['affix', { prefix: '- ', suffix: ';' }])).toBe('- a;\n- b;');
  });
  it('filters lines containing or not containing text', () => {
    expect(run('Error: x\ninfo\nERROR y', ['filter', { mode: 'containing', text: 'error', ignoreCase: true }])).toBe('Error: x\nERROR y');
    expect(run('Error: x\ninfo\nERROR y', ['filter', { mode: 'not-containing', text: 'Error', ignoreCase: false }])).toBe('info\nERROR y');
    expect(run('a\nb', ['filter', { text: '' }])).toBe('a\nb');
  });
  it('converts tabs to spaces (tab stops) and leading spaces to tabs', () => {
    expect(run('\ta\tb', ['tabs', { direction: 'tabs-to-spaces', width: 4 }])).toBe('    a   b');
    expect(run('      x  y', ['tabs', { direction: 'spaces-to-tabs', width: 4 }])).toBe('\t  x  y');
  });
  it('normalises line endings and keeps the original otherwise', () => {
    expect(run('a\r\nb\nc', ['lineEndings', { to: 'lf' }])).toBe('a\nb\nc');
    expect(run('a\nb\n', ['lineEndings', { to: 'crlf' }])).toBe('a\r\nb\r\n');
    expect(run('a\r\nb\r\n', ['reverse'])).toBe('b\r\na\r\n');
  });
  it('strips zero-width and control characters', () => {
    expect(run('a​b\u0007c﻿­d‮e\tf', ['strip'])).toBe('abcde\tf');
  });
  it('handles empty input', () => {
    expect(cleanText('', defaultSteps())).toMatchObject({ output: '', linesBefore: 0, linesAfter: 0 });
  });
  it('skips disabled steps and respects order', () => {
    const steps = only(['number'], ['reverse']);
    expect(cleanText('a\nb', steps).output).toBe('2. b\n1. a');
    steps[0].enabled = false;
    expect(cleanText('a\nb', steps).output).toBe('b\na');
  });
});
