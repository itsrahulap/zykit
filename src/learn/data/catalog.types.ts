import type { SubjectId, TopicLevel } from '../types/content';
import type { ProblemDifficulty } from '../types/problem';
import type { CaseStudyDifficulty } from '../types/caseStudy';

export interface TopicMeta {
  id: string;
  title: string;
  level: TopicLevel;
  description: string;
  prerequisites: string[];
  relatedTopics: string[];
}

export interface SubjectMeta {
  id: SubjectId;
  title: string;
  description: string;
  topics: TopicMeta[];
}

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  category: string;
  /** File under content/problems/ that holds the full problem. */
  file: string;
}

export interface CaseStudyMeta {
  id: string;
  title: string;
  difficulty: CaseStudyDifficulty;
  summary: string;
  relatedTopics: string[];
  /** File under content/case-studies/ that holds the full case study. */
  file: string;
}

export interface LearnCatalog {
  subjects: SubjectMeta[];
  problems: ProblemMeta[];
  caseStudies: CaseStudyMeta[];
}

export interface SearchEntry {
  kind: 'topic' | 'problem' | 'case-study';
  /** Subject id for topics, category id for problems, 'case-studies' for case studies. */
  subjectId: string;
  id: string;
  title: string;
  description: string;
  /** Lower-cased text the search matches against. */
  text: string;
}
