import { describe, expect, it } from 'vitest';
import { awsCloudPractitioner as exam } from '../../src/learn/exams/aws-clf-c02/exam';
import { questions } from '../../src/learn/exams/aws-clf-c02';
import { buildMockTest, domainQuota, formatClock, isCorrect, scoreTest, shuffle } from '../../src/learn/exams/engine';
import { recordAttempt, type Attempt } from '../../src/learn/exams';
import type { ExamQuestion } from '../../src/learn/exams/types';

// Deterministic PRNG so sampling tests are repeatable.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('CLF-C02 question bank', () => {
  it('has well-formed questions', () => {
    const ids = new Set<string>();
    const domains = new Set(exam.domains.map((d) => d.id));
    for (const q of questions) {
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(domains.has(q.domain), `${q.id}: unknown domain ${q.domain}`).toBe(true);
      expect(q.question.trim().length, q.id).toBeGreaterThan(10);
      expect(q.explanation.trim().length, `${q.id}: explanation`).toBeGreaterThan(30);
      expect(new Set(q.options).size, `${q.id}: duplicate options`).toBe(q.options.length);
      expect(q.answer.length, `${q.id}: answers`).toBeGreaterThan(0);
      expect(new Set(q.answer).size, `${q.id}: repeated answer index`).toBe(q.answer.length);
      for (const a of q.answer) expect(a >= 0 && a < q.options.length, `${q.id}: answer index ${a}`).toBe(true);
      if (q.answer.length === 1) expect(q.options.length, `${q.id}: single answer needs 4 options`).toBe(4);
      else {
        expect(q.options.length, `${q.id}: multiple response needs more options than answers`).toBeGreaterThan(q.answer.length + 2);
        expect(q.question, `${q.id}: multiple response must say how many to choose`).toMatch(/\(Choose (two|three)\.\)\s*$/);
      }
    }
  });

  it('has no repeated question text', () => {
    const norm = (q: ExamQuestion) => q.question.toLowerCase().replace(/\W+/g, ' ').trim();
    const seen = new Map<string, string>();
    for (const q of questions) {
      expect(seen.get(norm(q)), `${q.id} repeats ${seen.get(norm(q))}`).toBeUndefined();
      seen.set(norm(q), q.id);
    }
  });

  it('can fill a full mock test from every domain', () => {
    const quota = domainQuota(exam, exam.questionCount);
    for (const d of exam.domains) expect(questions.filter((q) => q.domain === d.id).length, d.id).toBeGreaterThanOrEqual(quota[d.id] * 2);
  });
});

describe('exam engine', () => {
  it('splits a mock test by domain weight', () => {
    const quota = domainQuota(exam, 65);
    expect(Object.values(quota).reduce((a, b) => a + b, 0)).toBe(65);
    expect(quota).toEqual({ 'cloud-concepts': 16, 'security-compliance': 19, 'technology-services': 22, 'billing-support': 8 });
  });

  it('builds a 65-question mock test without repeats, with shuffled options that keep the answers', () => {
    const items = buildMockTest(exam, questions, seeded(42));
    expect(items).toHaveLength(65);
    expect(new Set(items.map((i) => i.question.id)).size).toBe(65);
    for (const { question, order } of items) expect([...order].sort()).toEqual(question.options.map((_, i) => i));
    const counts = items.reduce<Record<string, number>>((c, i) => ({ ...c, [i.question.domain]: (c[i.question.domain] ?? 0) + 1 }), {});
    expect(counts).toEqual(domainQuota(exam, 65));
  });

  it('scores multiple response as all-or-nothing', () => {
    const q: ExamQuestion = { id: 'x', domain: 'cloud-concepts', question: 'Pick two (Choose two.)', options: ['a', 'b', 'c', 'd', 'e'], answer: [1, 3], explanation: '' };
    expect(isCorrect(q, [3, 1])).toBe(true);
    expect(isCorrect(q, [1])).toBe(false);
    expect(isCorrect(q, [1, 3, 4])).toBe(false);
    expect(isCorrect(q, undefined)).toBe(false);
  });

  it('scores a test per domain and lists missed questions', () => {
    const items = buildMockTest(exam, questions, seeded(7));
    const answers = Object.fromEntries(items.slice(0, 50).map((i) => [i.question.id, i.question.answer]));
    const score = scoreTest(exam, items, answers);
    expect(score.correct).toBe(50);
    expect(score.missed).toHaveLength(15);
    expect(score.passed).toBe(50 / 65 >= exam.passRatio);
    expect(score.byDomain.reduce((a, d) => a + d.total, 0)).toBe(65);
  });

  it('keeps missed questions until they are answered right', () => {
    const attempt = { at: '', mode: 'practice', label: '', correct: 0, total: 0, passed: false, seconds: 0, byDomain: [] } satisfies Attempt;
    const after = recordAttempt({ attempts: [], missed: ['a', 'b'] }, attempt, ['c'], ['a', 'c']);
    expect(after.missed.sort()).toEqual(['b', 'c']);
  });

  it('shuffles without losing items and formats the clock', () => {
    expect(shuffle([1, 2, 3, 4], seeded(1)).sort()).toEqual([1, 2, 3, 4]);
    expect(formatClock(90 * 60)).toBe('1:30:00');
    expect(formatClock(65)).toBe('1:05');
  });
});
