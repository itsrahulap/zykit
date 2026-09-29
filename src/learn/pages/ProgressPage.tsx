// /learn/progress — personal progress across every subject, kept in this browser.

import { useState } from 'react';
import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Button, Icon } from '../../shared/ui/ui';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { ProgressBar } from '../components/ProgressBar';
import { StatusDot } from '../components/status';
import { cardClass, EmptyState, SectionHeading, StatTile } from '../components/learnUi';
import { getSubjectMeta, getTopicMeta, LEARN, problems, problemsPath, subjectPath, subjects, topicPath } from '../data';
import { SUBJECT_ICONS } from '../data/subjectIcons';
import { countStatuses, splitTopicKey } from '../features/progress';
import { PROGRESS_LABELS, useProgress, useSolvedProblems } from '../hooks/useLearnState';

const totalTopics = subjects.reduce((n, s) => n + s.topics.length, 0);

function ResetProgress() {
  const { progress, setStatus } = useProgress();
  const { solved, toggleSolved } = useSolvedProblems();
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    for (const key of Object.keys(progress)) {
      const { subjectId, topicId } = splitTopicKey(key);
      setStatus(subjectId, topicId, 'not-started');
    }
    for (const id of Object.keys(solved)) toggleSolved(id);
    setConfirming(false);
  };

  return (
    <section aria-labelledby="reset" className={`${cardClass} p-6`}>
      <h2 id="reset" className="font-semibold text-slate-900 dark:text-white">
        Reset progress
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Clears every topic status and solved problem saved in this browser. Bookmarks are kept.
      </p>
      {confirming ? (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">This can&rsquo;t be undone. Reset everything?</p>
          <Button variant="secondary" onClick={reset} className="text-red-800! ring-red-300! dark:text-red-300! dark:ring-red-900!">
            Yes, reset
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setConfirming(true)} className="mt-4">
          Reset progress…
        </Button>
      )}
    </section>
  );
}

export default function ProgressPage() {
  useDocumentMeta({ title: 'Your progress', description: 'Your learning progress across every subject, saved in this browser.', noindex: true });
  const { progress, getStatus, completion } = useProgress();
  const { solved } = useSolvedProblems();

  const all = countStatuses(Object.values(progress));
  const solvedCount = problems.filter((p) => solved[p.id]).length;
  const nothingYet = Object.keys(progress).length === 0 && solvedCount === 0;
  const review = Object.entries(progress)
    .filter(([, s]) => s === 'needs-review')
    .map(([key]) => splitTopicKey(key))
    .map((k) => ({ ...k, subject: getSubjectMeta(k.subjectId), topic: getTopicMeta(k.subjectId, k.topicId) }))
    .filter((r) => r.subject && r.topic);

  return (
    <div className="space-y-10">
      <LearnBreadcrumb trail={[{ label: 'Progress' }]} />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Your progress</h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">How far along you are in each subject. Saved in this browser only.</p>
      </header>

      {nothingYet ? (
        <EmptyState icon="chart" title="No progress yet" action={{ to: LEARN, label: 'Pick a subject' }}>
          Open any lesson and it&rsquo;s marked as learning. Mark it complete when you&rsquo;re done, and it shows up here.
        </EmptyState>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Completed" value={all.completed} hint={`of ${totalTopics} topics`} />
            <StatTile label="Learning" value={all.learning} />
            <StatTile label="Needs review" value={all['needs-review']} />
            <StatTile label="Problems solved" value={solvedCount} hint={<Link to={problemsPath} className="hover:underline">of {problems.length}</Link>} />
          </dl>

          {review.length > 0 && (
            <section aria-labelledby="review">
              <SectionHeading id="review">Needs review</SectionHeading>
              <ul className="grid gap-3 sm:grid-cols-2">
                {review.map(({ subjectId, topicId, subject, topic }) => (
                  <li key={`${subjectId}/${topicId}`}>
                    <Link to={topicPath(subjectId, topicId)} className={`${cardClass} flex items-center gap-3 p-4 hover:border-primary-edge`}>
                      <StatusDot status="needs-review" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{subject!.title}</span>
                        <span className="block truncate font-semibold text-slate-900 dark:text-white">{topic!.title}</span>
                      </span>
                      <Icon name="arrow" className="h-4 w-4 shrink-0 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="by-subject">
        <SectionHeading id="by-subject">By subject</SectionHeading>
        <ul className={`${cardClass} divide-y divide-slate-100 dark:divide-slate-800`}>
          {subjects.map((s) => {
            const counts = countStatuses(s.topics.map((t) => getStatus(s.id, t.id)));
            return (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
                <Link to={subjectPath(s.id)} className="flex min-w-0 items-center gap-3 font-semibold text-slate-900 hover:underline sm:w-56 dark:text-white">
                  <Icon name={SUBJECT_ICONS[s.id]} className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                  <span className="truncate">{s.title}</span>
                </Link>
                <div className="min-w-0 flex-1 space-y-2">
                  <ProgressBar value={completion(s.id, s.topics.map((t) => t.id))} label={`${s.title} completion`} />
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400" aria-label={`${s.title} topics by status`}>
                    {(['completed', 'learning', 'needs-review', 'not-started'] as const).map((st) => (
                      <li key={st} className="flex items-center gap-1.5">
                        <span aria-hidden="true">
                          <StatusDot status={st} />
                        </span>
                        <span className="tabular-nums">{counts[st]}</span> {PROGRESS_LABELS[st].toLowerCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {!nothingYet && <ResetProgress />}
    </div>
  );
}
