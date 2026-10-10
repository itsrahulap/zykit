// Certification practice exams. The exam definition is small and loads with the page; each
// question bank is its own chunk.
import { createStore } from '../../shared/lib/store';
import { awsCloudPractitioner } from './aws-clf-c02/exam';
import type { Exam, ExamQuestion } from './types';

export const EXAMS: { exam: Exam; load: () => Promise<ExamQuestion[]> }[] = [
  { exam: awsCloudPractitioner, load: () => import('./aws-clf-c02').then((m) => m.questions) },
];

export const examPath = (id: string) => `/learn/exams/${id}`;
export const getExam = (id: string) => EXAMS.find((e) => e.exam.id === id);

export interface Attempt {
  /** ISO timestamp. */
  at: string;
  mode: 'mock' | 'practice';
  /** Domain title or "Missed questions" for practice sets. */
  label: string;
  correct: number;
  total: number;
  passed: boolean;
  seconds: number;
  byDomain: { id: string; correct: number; total: number }[];
}

export interface ExamProgress {
  attempts: Attempt[];
  /** Questions last answered wrong; cleared once answered right. */
  missed: string[];
}

const stores = new Map<string, ReturnType<typeof createStore<ExamProgress>>>();
export function examStore(examId: string) {
  let s = stores.get(examId);
  if (!s) stores.set(examId, (s = createStore<ExamProgress>(`zykit-exam-${examId}`, { attempts: [], missed: [] })));
  return s;
}

/** History keeps the last 50 attempts. */
export function recordAttempt(prev: ExamProgress, attempt: Attempt, missed: string[], answeredIds: string[]): ExamProgress {
  const right = new Set(answeredIds.filter((id) => !missed.includes(id)));
  return {
    attempts: [attempt, ...prev.attempts].slice(0, 50),
    missed: [...new Set([...prev.missed.filter((id) => !right.has(id)), ...missed])],
  };
}
