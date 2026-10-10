// Pure exam logic: building mock tests by domain weight, shuffling, and scoring. No React, so it's
// unit-tested in tests/learn/exams.test.ts.

import type { Exam, ExamQuestion } from './types';

/** A question as shown in a test: `order[i]` is the original option index displayed at position i. */
export interface TestItem {
  question: ExamQuestion;
  order: number[];
}

export interface DomainScore {
  id: string;
  title: string;
  correct: number;
  total: number;
}

export interface Score {
  correct: number;
  total: number;
  ratio: number;
  passed: boolean;
  byDomain: DomainScore[];
  /** Ids of questions answered wrong or left blank. */
  missed: string[];
}

export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const toItems = (qs: ExamQuestion[], rand: () => number): TestItem[] =>
  qs.map((question) => ({ question, order: shuffle(question.options.map((_, i) => i), rand) }));

/** Per-domain question counts for `total` questions, proportional to the exam's weights (largest remainder). */
export function domainQuota(exam: Exam, total: number): Record<string, number> {
  const raw = exam.domains.map((d) => ({ id: d.id, exact: d.weight * total }));
  const quota = Object.fromEntries(raw.map((r) => [r.id, Math.floor(r.exact)]));
  let left = total - Object.values(quota).reduce((a, b) => a + b, 0);
  for (const r of [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left-- <= 0) break;
    quota[r.id]++;
  }
  return quota;
}

/** A full mock test: questions drawn per domain by weight, shuffled, with shuffled options. */
export function buildMockTest(exam: Exam, bank: ExamQuestion[], rand: () => number = Math.random): TestItem[] {
  const quota = domainQuota(exam, Math.min(exam.questionCount, bank.length));
  const picked = exam.domains.flatMap((d) => shuffle(bank.filter((q) => q.domain === d.id), rand).slice(0, quota[d.id]));
  return toItems(shuffle(picked, rand), rand);
}

/** A practice set from any list of questions (one domain, missed questions…), shuffled. */
export function buildPractice(questions: ExamQuestion[], count: number, rand: () => number = Math.random): TestItem[] {
  return toItems(shuffle(questions, rand).slice(0, count), rand);
}

/** Exact match, as on the real exam: multiple-response questions need every correct option and no others. */
export function isCorrect(q: ExamQuestion, selected: readonly number[] | undefined): boolean {
  if (!selected || selected.length !== q.answer.length) return false;
  return q.answer.every((a) => selected.includes(a));
}

/** `answers` maps question id to the selected original option indexes. */
export function scoreTest(exam: Exam, items: TestItem[], answers: Record<string, number[]>): Score {
  const byDomain = exam.domains
    .map((d) => ({ id: d.id, title: d.title, correct: 0, total: 0 }))
    .filter((d) => items.some((i) => i.question.domain === d.id));
  const missed: string[] = [];
  let correct = 0;
  for (const { question } of items) {
    const domain = byDomain.find((d) => d.id === question.domain);
    if (domain) domain.total++;
    if (isCorrect(question, answers[question.id])) {
      correct++;
      if (domain) domain.correct++;
    } else missed.push(question.id);
  }
  const ratio = items.length ? correct / items.length : 0;
  return { correct, total: items.length, ratio, passed: ratio >= exam.passRatio, byDomain, missed };
}

/** Seconds as "m:ss" or "h:mm:ss". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
