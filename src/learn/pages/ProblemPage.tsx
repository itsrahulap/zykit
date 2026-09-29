// /learn/problems/:categoryId/:problemId — one worked DSA problem.

import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Icon } from '../../shared/ui/ui';
import {
  categoryPath,
  getCategory,
  getDsaTopicsForProblemCategory,
  getProblemMeta,
  getProblemsInCategory,
  getTopicMeta,
  loadProblem,
  problemPath,
  problemsPath,
  topicPath,
  type ProblemMeta,
} from '../data';
import type { Problem, ProblemCategory } from '../types/problem';
import { useLoaded } from '../hooks/useLoaded';
import { useSolvedProblems } from '../hooks/useLearnState';
import { plainText } from '../features/richTextHtml';
import { problemMetaFor } from '../seo';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { LoadError, LoadingState, NotFoundState } from '../components/PageStates';
import { RichText, InlineText } from '../components/RichText';
import { DifficultyBadge } from '../components/status';
import { PrevNext, SolvedMark } from '../components/problems/bits';
import { Examples, Hints, Section, Solutions } from '../components/problems/ProblemSections';
import { adjacent, sortByDifficulty } from '../components/problems/practice';

export default function ProblemPage() {
  const { categoryId = '', problemId = '' } = useParams();
  const category = getCategory(categoryId);
  const meta = getProblemMeta(categoryId, problemId);
  const loaded = useLoaded(`${categoryId}/${problemId}`, () => loadProblem(categoryId, problemId));

  if (!category || !meta || loaded.status === 'missing') {
    return (
      <NotFoundState
        what="problem"
        backTo={category ? categoryPath(category.id) : problemsPath}
        backLabel={category ? `Back to ${category.title}` : 'All problem categories'}
      />
    );
  }
  if (loaded.status === 'loading') return <LoadingState label="Loading problem…" />;
  if (loaded.status === 'error') return <LoadError />;
  return <ProblemView key={meta.id} category={category} meta={meta} problem={loaded.value} />;
}

function ProblemView({ category, meta, problem }: { category: ProblemCategory; meta: ProblemMeta; problem: Problem }) {
  useDocumentMeta(problemMetaFor(meta, plainText(problem.description)));
  const { isSolved, toggleSolved } = useSolvedProblems();
  const solved = isSolved(problem.id);

  const siblings = sortByDifficulty(getProblemsInCategory(category.id));
  const { prev, next } = adjacent(siblings, problem.id);
  const position = siblings.findIndex((p) => p.id === problem.id) + 1;

  const explicitRelated = (problem.relatedProblems ?? [])
    .map((id) => getProblemMeta(category.id, id))
    .filter((p) => p !== undefined);
  const related = explicitRelated.length > 0 ? explicitRelated : siblings.filter((p) => p.id !== problem.id).slice(0, 4);
  const topics = getDsaTopicsForProblemCategory(category.id)
    .map((id) => getTopicMeta('dsa', id))
    .filter((t) => t !== undefined);

  return (
    <article className="mx-auto max-w-4xl space-y-10 break-words">
      <header className="space-y-5">
        <LearnBreadcrumb trail={[{ label: 'Problems', to: problemsPath }, { label: category.title, to: categoryPath(category.id) }, { label: problem.title }]} />
        <p className="eyebrow text-slate-500 dark:text-slate-400">
          {category.title} · Problem {position} of {siblings.length}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">{problem.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={problem.difficulty} />
          <button
            type="button"
            aria-pressed={solved}
            onClick={() => toggleSolved(problem.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset transition-colors pointer-coarse:min-h-11 ${
              solved
                ? 'bg-emerald-50 text-emerald-800 ring-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                : 'bg-white text-slate-800 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800'
            }`}
          >
            <Icon name="check" className={`h-4 w-4 ${solved ? '' : 'text-slate-400'}`} />
            Solved
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
            {solved ? 'Nice work. Saved in this browser.' : 'Mark it once you can solve it unaided.'}
          </span>
        </div>
      </header>

      <Section id="problem-statement" title="The problem">
        <RichText text={problem.description} />
      </Section>

      {problem.examples.length > 0 && (
        <Section id="examples" title="Examples">
          <Examples examples={problem.examples} />
        </Section>
      )}

      {problem.constraints && problem.constraints.length > 0 && (
        <Section id="constraints" title="Constraints">
          <ul className="list-disc space-y-1.5 pl-6 text-slate-700 marker:text-emerald-600 dark:text-slate-300 dark:marker:text-emerald-400">
            {problem.constraints.map((c, i) => (
              <li key={i}>
                <InlineText text={c} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {problem.hints && problem.hints.length > 0 && (
        <Section id="hints" title="Hints" icon="lightbulb">
          <Hints hints={problem.hints} />
        </Section>
      )}

      <Section id="approach" title="How to think about it">
        <RichText text={problem.approachOverview} />
      </Section>

      {problem.solutions.length > 0 && (
        <Section id="solutions" title={problem.solutions.length > 1 ? `${problem.solutions.length} solutions` : 'Solution'} icon="code">
          <p className="text-sm text-slate-600 dark:text-slate-400">Ordered from the simplest idea to the most efficient. Run each one against the examples.</p>
          <Solutions problem={problem} />
        </Section>
      )}

      {(related.length > 0 || topics.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {related.length > 0 && (
            <section aria-labelledby="related-problems" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 id="related-problems" className="eyebrow mb-4 text-slate-600 dark:text-slate-400">
                {explicitRelated.length > 0 ? 'Related problems' : `More ${category.title}`}
              </h2>
              <ul className="space-y-1">
                {related.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={problemPath(category.id, p.id)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 pointer-coarse:min-h-11 dark:hover:bg-slate-800"
                    >
                      <SolvedMark solved={isSolved(p.id)} />
                      <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-slate-100">{p.title}</span>
                      <DifficultyBadge difficulty={p.difficulty} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {topics.length > 0 && (
            <section aria-labelledby="related-topics" className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 id="related-topics" className="eyebrow mb-4 text-slate-600 dark:text-slate-400">
                Concepts behind this pattern
              </h2>
              <ul className="space-y-1">
                {topics.map((t) => (
                  <li key={t.id}>
                    <Link to={topicPath('dsa', t.id)} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 pointer-coarse:min-h-11 dark:hover:bg-slate-800">
                      <Icon name="book" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900 dark:text-slate-100">{t.title}</span>
                        <span className="block text-sm text-slate-500 dark:text-slate-400">{t.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <PrevNext
        label={`More ${category.title} problems`}
        prev={prev && { to: problemPath(category.id, prev.id), title: prev.title }}
        next={next && { to: problemPath(category.id, next.id), title: next.title }}
      />
    </article>
  );
}
