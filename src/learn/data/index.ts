// Everything the Learn pages need to find content. Lists and links come from the small
// generated catalog; full lessons, problems and case studies are loaded on demand so each
// one is its own chunk. Never import ../content/index.ts from the app: it pulls in every subject.

import type { Subject, SubjectId } from '../types/content';
import type { Problem } from '../types/problem';
import type { CaseStudy } from '../types/caseStudy';
import { problemCategories } from '../content/problems/categories';
import { dsaTopicToProblemCategories } from '../content/dsaProblemLinks';
import { catalog } from './catalog.generated';
import type { CaseStudyMeta, ProblemMeta, SubjectMeta, TopicMeta } from './catalog.types';

export type { CaseStudyMeta, ProblemMeta, SubjectMeta, TopicMeta } from './catalog.types';
export { problemCategories };

export const subjects: SubjectMeta[] = catalog.subjects;
export const problems: ProblemMeta[] = catalog.problems;
export const caseStudies: CaseStudyMeta[] = catalog.caseStudies;

// ── URLs ───────────────────────────────────────────────────────────────────────
export const LEARN = '/learn';
export const subjectPath = (subjectId: string) => `${LEARN}/${subjectId}`;
export const topicPath = (subjectId: string, topicId: string) => `${LEARN}/${subjectId}/${topicId}`;
export const problemsPath = `${LEARN}/problems`;
export const categoryPath = (categoryId: string) => `${problemsPath}/${categoryId}`;
export const problemPath = (categoryId: string, problemId: string) => `${problemsPath}/${categoryId}/${problemId}`;
export const caseStudiesPath = `${LEARN}/case-studies`;
export const caseStudyPath = (id: string) => `${caseStudiesPath}/${id}`;
export const progressPath = `${LEARN}/progress`;
export const bookmarksPath = `${LEARN}/bookmarks`;

// ── Catalog lookups (synchronous, metadata only) ───────────────────────────────
export const getSubjectMeta = (id: string) => subjects.find((s) => s.id === id);
export const getTopicMeta = (subjectId: string, topicId: string) => getSubjectMeta(subjectId)?.topics.find((t) => t.id === topicId);

/** Find a topic across all subjects (related-topic ids may point into another subject). */
export function findTopicAnywhere(topicId: string, preferSubject?: string): { subject: SubjectMeta; topic: TopicMeta } | undefined {
  const ordered = preferSubject ? [...subjects].sort((a) => (a.id === preferSubject ? -1 : 0)) : subjects;
  for (const subject of ordered) {
    const topic = subject.topics.find((t) => t.id === topicId);
    if (topic) return { subject, topic };
  }
  return undefined;
}

/** Previous/next topic in a subject's beginner → advanced order. */
export function getAdjacentTopics(subjectId: string, topicId: string): { prev?: TopicMeta; next?: TopicMeta } {
  const topics = getSubjectMeta(subjectId)?.topics ?? [];
  const i = topics.findIndex((t) => t.id === topicId);
  return i === -1 ? {} : { prev: topics[i - 1], next: topics[i + 1] };
}

export const getCategory = (id: string) => problemCategories.find((c) => c.id === id);
export const getProblemsInCategory = (categoryId: string) => problems.filter((p) => p.category === categoryId);
export const getProblemMeta = (categoryId: string, problemId: string) =>
  problems.find((p) => p.category === categoryId && p.id === problemId);
export const getCaseStudyMeta = (id: string) => caseStudies.find((c) => c.id === id);
export const getCaseStudiesForTopic = (topicId: string) => caseStudies.filter((c) => c.relatedTopics.includes(topicId));

/** Problem categories that practise a DSA concept topic, and the reverse. */
export const getProblemCategoriesForTopic = (topicId: string) => dsaTopicToProblemCategories[topicId] ?? [];
export const getDsaTopicsForProblemCategory = (categoryId: string) =>
  Object.entries(dsaTopicToProblemCategories)
    .filter(([, cats]) => cats.includes(categoryId))
    .map(([topicId]) => topicId);

// ── Loaders (async, full content) ──────────────────────────────────────────────
const subjectModules: Record<SubjectId, () => Promise<Subject>> = {
  javascript: () => import('../content/javascript').then((m) => m.javascriptSubject),
  typescript: () => import('../content/typescript').then((m) => m.typescriptSubject),
  dsa: () => import('../content/dsa').then((m) => m.dsaSubject),
  'web-fundamentals': () => import('../content/web-fundamentals').then((m) => m.webFundamentalsSubject),
  backend: () => import('../content/backend').then((m) => m.backendSubject),
  databases: () => import('../content/databases').then((m) => m.databasesSubject),
  'system-design': () => import('../content/system-design').then((m) => m.systemDesignSubject),
  'software-architecture': () => import('../content/software-architecture').then((m) => m.softwareArchitectureSubject),
  aws: () => import('../content/aws').then((m) => m.awsSubject),
};

const problemModules = import.meta.glob<Record<string, unknown>>(['../content/problems/*.ts', '!**/index.ts', '!**/categories.ts']);
const caseStudyModules = import.meta.glob<Record<string, unknown>>(['../content/case-studies/*.ts', '!**/index.ts']);

export async function loadSubject(subjectId: string): Promise<Subject | undefined> {
  const load = subjectModules[subjectId as SubjectId];
  return load ? load() : undefined;
}

export async function loadTopic(subjectId: string, topicId: string) {
  return (await loadSubject(subjectId))?.topics.find((t) => t.id === topicId);
}

export async function loadProblem(categoryId: string, problemId: string): Promise<Problem | undefined> {
  const meta = getProblemMeta(categoryId, problemId);
  const load = meta && problemModules[`../content/problems/${meta.file}.ts`];
  if (!load) return undefined;
  const list = Object.values(await load()).find(Array.isArray) as Problem[] | undefined;
  return list?.find((p) => p.id === problemId);
}

export async function loadCaseStudy(id: string): Promise<CaseStudy | undefined> {
  const meta = getCaseStudyMeta(id);
  const load = meta && caseStudyModules[`../content/case-studies/${meta.file}.ts`];
  if (!load) return undefined;
  return Object.values(await load()).find((v) => (v as CaseStudy | undefined)?.id === id) as CaseStudy | undefined;
}

/** The search index is ~300 KB, so it's loaded the first time search opens. */
export const loadSearchEntries = () => import('./search.generated').then((m) => m.searchEntries);
