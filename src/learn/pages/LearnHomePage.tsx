// /learn — overview of every subject, recent lessons, practice material and overall progress.

import { useState } from 'react';
import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline, IconTile } from '../../shared/ui/page';
import { Icon } from '../../shared/ui/ui';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/status';
import { cardClass, cardLinkClass, SectionHeading, StatTile } from '../components/learnUi';
import { caseStudies, caseStudiesPath, getSubjectMeta, getTopicMeta, problemCategories, problems, problemsPath, progressPath, subjectPath, subjects, topicPath } from '../data';
import { SUBJECT_ICONS } from '../data/subjectIcons';
import { levelSpread, splitTopicKey } from '../features/progress';
import { dueForReview } from '../features/review';
import { useProgress, useRecentTopics, useSolvedProblems, useStatusStamps } from '../hooks/useLearnState';
import { learnHomeMeta } from '../seo';

const totalTopics = subjects.reduce((n, s) => n + s.topics.length, 0);

function ContinueLearning() {
  const recent = useRecentTopics();
  const { getStatus } = useProgress();
  const items = recent
    .map((r) => ({ ...r, subject: getSubjectMeta(r.subjectId), topic: getTopicMeta(r.subjectId, r.topicId) }))
    .filter((r) => r.subject && r.topic)
    .slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="continue">
      <SectionHeading id="continue">Continue learning</SectionHeading>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(({ subject, topic, subjectId, topicId }) => (
          <li key={`${subjectId}/${topicId}`}>
            <Link to={topicPath(subjectId, topicId)} className={`${cardLinkClass} flex items-center gap-4 p-4`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Icon name={SUBJECT_ICONS[subject!.id]} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-slate-500 dark:text-slate-400">{subject!.title}</span>
                <span className="block truncate font-semibold text-slate-900 dark:text-white">{topic!.title}</span>
              </span>
              <StatusBadge status={getStatus(subjectId, topicId)} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const agoLabel = (days: number | undefined) =>
  days === undefined ? '' : days === 0 ? 'today' : days === 1 ? 'yesterday' : days < 60 ? `${days} days ago` : `${Math.round(days / 30)} months ago`;

function DueForReview() {
  const { progress } = useProgress();
  const { stamps, markReviewed } = useStatusStamps();
  // Taken once on mount; the list doesn't need to tick over while the page is open.
  const [now] = useState(Date.now);
  const items = dueForReview(progress, stamps, now)
    .map((d) => ({ ...d, ...splitTopicKey(d.key) }))
    .map((d) => ({ ...d, subject: getSubjectMeta(d.subjectId), topic: getTopicMeta(d.subjectId, d.topicId) }))
    .filter((d) => d.subject && d.topic)
    .slice(0, 6);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="due-for-review">
      <SectionHeading id="due-for-review">Due for review</SectionHeading>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(({ key, reason, days, subject, topic, subjectId, topicId }) => (
          <li key={key} className={`${cardClass} flex items-center gap-3 p-4`}>
            <Link to={topicPath(subjectId, topicId)} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl pointer-coarse:min-h-11">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Icon name={SUBJECT_ICONS[subject!.id]} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {subject!.title} · {reason === 'needs-review' ? 'Marked for review' : `Completed ${agoLabel(days)}`}
                </span>
                <span className="block truncate font-semibold text-slate-900 hover:underline dark:text-white">{topic!.title}</span>
              </span>
            </Link>
            {reason === 'spaced' && (
              <button
                type="button"
                onClick={() => markReviewed(subjectId, topicId)}
                aria-label={`Mark ${topic!.title} as reviewed`}
                className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 pointer-coarse:min-h-11 dark:text-emerald-400 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                Reviewed
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LearnHomePage() {
  useDocumentMeta(learnHomeMeta());
  const { progress, completion } = useProgress();
  const { solved } = useSolvedProblems();
  const completed = Object.values(progress).filter((s) => s === 'completed').length;
  const inProgress = Object.values(progress).filter((s) => s === 'learning' || s === 'needs-review').length;
  const solvedCount = problems.filter((p) => solved[p.id]).length;

  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <p className="eyebrow text-emerald-700 dark:text-emerald-400">Learn · Software engineering</p>
        <Headline accent="deeply">Learn once. Understand </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Never start from zero again. {totalTopics} plain-language lessons across {subjects.length} subjects, from your first variable to
          distributed systems, each with an analogy, worked examples, common mistakes and interview questions.
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Icon name="lock" className="h-4 w-4" /> Your progress and bookmarks are saved in this browser only.
        </p>
      </section>

      <ContinueLearning />

      <DueForReview />

      <section aria-labelledby="subjects">
        <SectionHeading id="subjects">Subjects</SectionHeading>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const spread = levelSpread(s.topics);
            const pct = completion(s.id, s.topics.map((t) => t.id));
            return (
              <li key={s.id}>
                <Link to={subjectPath(s.id)} className={`${cardLinkClass} flex h-full flex-col p-6`}>
                  <IconTile icon={SUBJECT_ICONS[s.id]} />
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{s.description}</p>
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{s.topics.length} topics</span> · {spread.beginner} beginner ·{' '}
                    {spread.intermediate} intermediate · {spread.advanced} advanced
                  </p>
                  <ProgressBar value={pct} label={`${s.title} completion`} className="mt-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="practice">
        <SectionHeading id="practice">Practice</SectionHeading>
        <ul className="grid gap-5 md:grid-cols-2">
          <li>
            <Link to={problemsPath} className={`${cardLinkClass} flex h-full flex-col p-6`}>
              <IconTile icon="puzzle" />
              <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">DSA problems</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {problems.length} problems across {problemCategories.length} patterns, each with hints and solutions from brute force to optimal.
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Some categories">
                {problemCategories.slice(0, 6).map((c) => (
                  <li key={c.id} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {c.title}
                  </li>
                ))}
                <li className="px-1 text-xs text-slate-500">+{problemCategories.length - 6} more</li>
              </ul>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-emerald-700 dark:text-emerald-400">
                Browse problems <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          </li>
          <li>
            <Link to={caseStudiesPath} className={`${cardLinkClass} flex h-full flex-col p-6`}>
              <IconTile icon="building" />
              <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">System design case studies</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {caseStudies.length} worked walkthroughs: requirements, capacity estimates, APIs, data models, deep dives and trade-offs.
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-emerald-700 dark:text-emerald-400">
                Read case studies <Icon name="arrow" className="h-4 w-4" />
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="your-progress">
        <SectionHeading
          id="your-progress"
          action={
            <Link to={progressPath} className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              View progress
            </Link>
          }
        >
          Your progress
        </SectionHeading>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Completed" value={completed} hint={`of ${totalTopics} topics`} />
          <StatTile label="In progress" value={inProgress} hint="learning or to review" />
          <StatTile label="Overall" value={`${Math.round((completed / totalTopics) * 100)}%`} hint="of all topics" />
          <StatTile label="Solved" value={solvedCount} hint={`of ${problems.length} problems`} />
        </dl>
      </section>
    </div>
  );
}
