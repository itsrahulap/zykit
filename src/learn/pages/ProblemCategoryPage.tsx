// /learn/problems/:categoryId — one pattern's problems, filterable by difficulty and solved state.

import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { categoryPath, getCategory, getProblemsInCategory, getTopicMeta, getDsaTopicsForProblemCategory, problemPath, problemsPath, topicPath } from '../data';
import type { ProblemCategory } from '../types/problem';
import { useSolvedProblems } from '../hooks/useLearnState';
import { categoryMetaFor } from '../seo';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { NotFoundState } from '../components/PageStates';
import { DifficultyBadge } from '../components/status';
import { ProgressBar } from '../components/ProgressBar';
import { DifficultyMix, SolvedMark } from '../components/problems/bits';
import {
  difficultyMix,
  filterProblems,
  parseDifficultyFilter,
  parseSolvedFilter,
  sortByDifficulty,
  type DifficultyFilter,
  type SolvedFilter,
} from '../components/problems/practice';

export default function ProblemCategoryPage() {
  const { categoryId = '' } = useParams();
  const category = getCategory(categoryId);
  if (!category) return <NotFoundState what="problem category" backTo={problemsPath} backLabel="All problem categories" />;
  return <CategoryView key={category.id} category={category} />;
}

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];
const SOLVED_OPTIONS: { value: SolvedFilter; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'unsolved', label: 'Unsolved' },
  { value: 'solved', label: 'Solved' },
];

function CategoryView({ category }: { category: ProblemCategory }) {
  const items = sortByDifficulty(getProblemsInCategory(category.id));
  useDocumentMeta(categoryMetaFor(category, items.length));
  const { isSolved, solvedCount } = useSolvedProblems();
  const [params, setParams] = useSearchParams();
  const difficulty = parseDifficultyFilter(params.get('difficulty'));
  const solvedFilter = parseSolvedFilter(params.get('status'));

  const setFilter = (key: 'difficulty' | 'status', value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'all') next.delete(key);
        else next.set(key, key === 'difficulty' ? value.toLowerCase() : value);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const numbered = items.map((p, i) => ({ ...p, number: i + 1 }));
  const shown = filterProblems(numbered, { difficulty, solved: solvedFilter }, isSolved);
  const done = solvedCount(items.map((p) => p.id));
  const topics = getDsaTopicsForProblemCategory(category.id)
    .map((id) => getTopicMeta('dsa', id))
    .filter((t) => t !== undefined);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <LearnBreadcrumb trail={[{ label: 'Problems', to: problemsPath }, { label: category.title }]} />
        <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Icon name="puzzle" className="h-4 w-4" /> Pattern
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">{category.title}</h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">{category.description}</p>
      </div>

      <section aria-label="Progress in this pattern" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {done} of {items.length} solved
          </p>
          <DifficultyMix mix={difficultyMix(items)} />
        </div>
        <ProgressBar value={done} max={items.length} className="mt-3" />
      </section>

      {topics.length > 0 && (
        <section aria-labelledby="learn-first" className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
          <h2 id="learn-first" className="eyebrow flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Icon name="lightbulb" className="h-4 w-4" /> New to this? Learn the concept first
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t.id}>
                <Link
                  to={topicPath('dsa', t.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-inset ring-emerald-200 hover:ring-emerald-500 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100 dark:ring-emerald-900 dark:hover:ring-emerald-500"
                >
                  <Icon name="book" className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /> {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="problem-list" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="problem-list" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Problems
          </h2>
          <div className="flex flex-wrap gap-3">
            <Segmented label="Difficulty" options={DIFFICULTY_OPTIONS} value={difficulty} onChange={(v) => setFilter('difficulty', v)} />
            <Segmented label="Solved state" options={SOLVED_OPTIONS} value={solvedFilter} onChange={(v) => setFilter('status', v)} />
          </div>
        </div>
        <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
          Showing {shown.length} of {items.length}
        </p>
        {items.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Problems for this pattern are on their way.</p>
        ) : shown.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
            No problems match these filters.{' '}
            <Link to={categoryPath(category.id)} replace className="font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400">
              Clear filters
            </Link>
          </div>
        ) : (
          <ol aria-label={`${category.title} problems`} className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {shown.map((p) => (
              <li key={p.id}>
                <Link
                  to={problemPath(category.id, p.id)}
                  className="group flex items-center gap-3 px-4 py-4 hover:bg-slate-50 sm:gap-4 sm:px-6 dark:hover:bg-slate-800/60"
                >
                  <span className="w-7 shrink-0 font-mono text-sm tabular-nums text-slate-500 dark:text-slate-400">{String(p.number).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 font-medium text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                    {p.title}
                  </span>
                  <DifficultyBadge difficulty={p.difficulty} />
                  <SolvedMark solved={isSolved(p.id)} />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
