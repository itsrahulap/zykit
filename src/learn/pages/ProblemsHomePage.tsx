// /learn/problems — every problem category, with solved progress and difficulty mix.

import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline } from '../../shared/ui/page';
import { Icon } from '../../shared/ui/ui';
import { caseStudiesPath, categoryPath, getProblemsInCategory, problemCategories, problems } from '../data';
import { useSolvedProblems } from '../hooks/useLearnState';
import { problemsHomeMeta } from '../seo';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { ProgressBar } from '../components/ProgressBar';
import { DifficultyMix } from '../components/problems/bits';
import { difficultyMix, percent } from '../components/problems/practice';

const allIds = problems.map((p) => p.id);

export default function ProblemsHomePage() {
  useDocumentMeta(problemsHomeMeta());
  const { solvedCount } = useSolvedProblems();
  const solved = solvedCount(allIds);
  const mix = difficultyMix(problems);

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <LearnBreadcrumb trail={[{ label: 'Problems' }]} />
        <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Icon name="puzzle" className="h-4 w-4" /> Practice bank
        </p>
        <Headline accent="pattern">Practice problems, by </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          {problems.length} problems grouped by the pattern that cracks them — from arrays and hashing up through graphs and dynamic
          programming. Each one has hints you can reveal one at a time and several solutions, from brute force to optimal, that you can run
          in the browser.
        </p>
      </div>

      <section aria-labelledby="overall-progress" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="overall-progress" className="eyebrow text-slate-600 dark:text-slate-400">
              Your progress
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {solved} <span className="text-lg font-medium text-slate-500 dark:text-slate-400">of {problems.length} solved</span>
            </p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{percent(solved, problems.length)}% complete</p>
        </div>
        <ProgressBar value={solved} max={problems.length} label="Problems solved" className="mt-4" />
        <div className="mt-4">
          <DifficultyMix mix={mix} />
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="space-y-5">
        <h2 id="categories-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {problemCategories.length} patterns
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problemCategories.map((category, i) => {
            const items = getProblemsInCategory(category.id);
            const done = solvedCount(items.map((p) => p.id));
            return (
              <li key={category.id}>
                <Link
                  to={categoryPath(category.id)}
                  className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-emerald-500 focus-visible:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
                >
                  <span className="eyebrow text-slate-500 dark:text-slate-400">Pattern {String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                    {category.title}
                  </span>
                  <span className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{category.description}</span>
                  <span className="mt-5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {items.length} {items.length === 1 ? 'problem' : 'problems'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {done}/{items.length} solved
                    </span>
                  </span>
                  <ProgressBar value={done} max={items.length} className="mt-2" />
                  <span className="mt-3">
                    <DifficultyMix mix={difficultyMix(items)} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Want the bigger picture?{' '}
        <Link to={caseStudiesPath} className="font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400">
          Work through real system designs
        </Link>
        .
      </p>
    </div>
  );
}
