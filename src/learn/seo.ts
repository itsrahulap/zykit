// Titles and descriptions for Learn pages, shared by the pages (useDocumentMeta) and the build
// step that writes a static HTML file per page (scripts/seo-plugin.ts), so both always agree.
// Titles exclude the " · Zykit" suffix; useDocumentMeta and the build step add it.

import { caseStudies, problems, subjects, type CaseStudyMeta, type ProblemMeta, type SubjectMeta, type TopicMeta } from './data';
import type { ProblemCategory } from './types/problem';

export interface LearnMeta {
  title: string;
  description: string;
}

const topicCount = subjects.reduce((n, s) => n + s.topics.length, 0);

export const learnHomeMeta = (): LearnMeta => ({
  title: 'Learn software engineering',
  description: `${topicCount} free, beginner-friendly lessons on ${subjects.map((s) => s.title).join(', ')}, plus ${problems.length} solved DSA problems and ${caseStudies.length} system design case studies.`,
});

export const subjectMetaFor = (s: SubjectMeta): LearnMeta => ({
  title: `${s.title}: lessons from beginner to advanced`,
  description: `${s.description} ${s.topics.length} lessons with examples, exercises and interview questions.`,
});

export const topicMetaFor = (s: SubjectMeta, t: TopicMeta): LearnMeta => ({
  title: `${t.title} · ${s.title}`,
  description: t.description,
});

export const problemsHomeMeta = (): LearnMeta => ({
  title: 'DSA practice problems',
  description: `${problems.length} data structures and algorithms problems, grouped by pattern, each with hints and solutions from brute force to optimal.`,
});

export const categoryMetaFor = (c: ProblemCategory, count: number): LearnMeta => ({
  title: `${c.title} problems`,
  description: `${c.description} ${count} solved practice problems with hints and multiple approaches.`,
});

export const problemMetaFor = (p: ProblemMeta, description: string): LearnMeta => ({
  title: `${p.title} · ${p.difficulty} DSA problem`,
  description,
});

export const caseStudiesHomeMeta = (): LearnMeta => ({
  title: 'System design case studies',
  description: `${caseStudies.length} worked system design walkthroughs: requirements, capacity estimates, APIs, data models, deep dives and trade-offs.`,
});

export const caseStudyMetaFor = (c: CaseStudyMeta): LearnMeta => ({
  title: `${c.title} system design`,
  description: c.summary,
});
