import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { subjects as fullSubjects } from '../../src/learn/content/index';
import { allProblems } from '../../src/learn/content/problems/index';
import { caseStudies as fullCaseStudies } from '../../src/learn/content/case-studies/index';
import {
  caseStudies,
  findTopicAnywhere,
  getCategory,
  loadCaseStudy,
  loadProblem,
  loadSubject,
  loadTopic,
  problemCategories,
  problems,
  subjects,
} from '../../src/learn/data';

describe('learn catalog', () => {
  it('is in sync with the content (run `npm run generate:learn` if this fails)', () => {
    execFileSync('npx', ['tsx', 'scripts/generate-learn-catalog.ts', '--check'], { stdio: 'pipe' });
  });

  it('lists every subject, topic, problem and case study', () => {
    expect(subjects.map((s) => s.id)).toEqual(fullSubjects.map((s) => s.id));
    expect(subjects.flatMap((s) => s.topics).length).toBe(fullSubjects.flatMap((s) => s.topics).length);
    expect(problems.length).toBe(allProblems.length);
    expect(caseStudies.length).toBe(fullCaseStudies.length);
  });
});

describe('learn content integrity', () => {
  it('has unique topic ids within each subject', () => {
    for (const s of subjects) {
      const ids = s.topics.map((t) => t.id);
      expect(new Set(ids).size, s.id).toBe(ids.length);
    }
  });

  it('has unique problem and case study ids (they are used as URL segments and progress keys)', () => {
    expect(new Set(problems.map((p) => p.id)).size).toBe(problems.length);
    expect(new Set(caseStudies.map((c) => c.id)).size).toBe(caseStudies.length);
  });

  it('puts every problem in a known category', () => {
    for (const p of problems) expect(getCategory(p.category), p.id).toBeDefined();
    expect(problemCategories.length).toBeGreaterThan(0);
  });

  it('resolves every prerequisite and related topic', () => {
    const broken: string[] = [];
    for (const s of subjects)
      for (const t of s.topics) {
        for (const id of t.prerequisites) if (!s.topics.some((x) => x.id === id)) broken.push(`${s.id}/${t.id} prerequisite ${id}`);
        for (const id of t.relatedTopics) if (!findTopicAnywhere(id, s.id)) broken.push(`${s.id}/${t.id} related ${id}`);
      }
    for (const c of caseStudies)
      for (const id of c.relatedTopics) if (!subjects.find((s) => s.id === 'system-design')!.topics.some((t) => t.id === id)) broken.push(`case study ${c.id} related ${id}`);
    expect(broken).toEqual([]);
  });
});

describe('learn loaders', () => {
  it('loads every subject and topic', async () => {
    for (const s of subjects) {
      expect((await loadSubject(s.id))?.topics.length, s.id).toBe(s.topics.length);
      expect((await loadTopic(s.id, s.topics[0].id))?.title).toBe(s.topics[0].title);
    }
    expect(await loadSubject('nope')).toBeUndefined();
  });

  it('loads every problem and case study', async () => {
    for (const p of problems) expect((await loadProblem(p.category, p.id))?.title, p.id).toBe(p.title);
    for (const c of caseStudies) expect((await loadCaseStudy(c.id))?.title, c.id).toBe(c.title);
    expect(await loadProblem('stack', 'nope')).toBeUndefined();
  });
});
