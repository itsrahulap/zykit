// /learn/:subjectId — a subject's topics, grouped by level, with progress and a status filter.

import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { IconTile } from '../../shared/ui/page';
import { Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { NotFoundState } from '../components/PageStates';
import { ProgressBar } from '../components/ProgressBar';
import { StatusDot } from '../components/status';
import { cardClass, cardLinkClass, primaryLinkClass } from '../components/learnUi';
import { getSubjectMeta, problemCategories, problems, problemsPath, topicPath, type SubjectMeta } from '../data';
import { SUBJECT_ICONS } from '../data/subjectIcons';
import { LEVEL_ORDER, matchesFilter, nextTopic, STATUS_FILTERS, type StatusFilter } from '../features/progress';
import { LEVEL_LABELS, PROGRESS_LABELS, useProgress } from '../hooks/useLearnState';
import { subjectMetaFor } from '../seo';

function Subject({ subject }: { subject: SubjectMeta }) {
  useDocumentMeta(subjectMetaFor(subject));
  const { getStatus, completion } = useProgress();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const ids = subject.topics.map((t) => t.id);
  const pct = completion(subject.id, ids);
  const started = ids.some((id) => getStatus(subject.id, id) !== 'not-started');
  const next = nextTopic(subject.topics, (id) => getStatus(subject.id, id));
  const ordered = LEVEL_ORDER.flatMap((l) => subject.topics.filter((t) => t.level === l));
  const numberOf = new Map(ordered.map((t, i) => [t.id, i + 1]));
  const visible = ordered.filter((t) => matchesFilter(getStatus(subject.id, t.id), filter));

  return (
    <div className="space-y-10">
      <LearnBreadcrumb trail={[{ label: subject.title }]} />

      <header className="space-y-5">
        <div className="flex items-center gap-4">
          <IconTile icon={SUBJECT_ICONS[subject.id]} size="lg" />
          <div className="min-w-0">
            <p className="eyebrow text-emerald-700 dark:text-emerald-400">{subject.topics.length} topics</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{subject.title}</h1>
          </div>
        </div>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">{subject.description}</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ProgressBar value={pct} label={`${subject.title} completion`} className="w-full max-w-xs" />
          <Link to={topicPath(subject.id, (next ?? ordered[0]).id)} className={primaryLinkClass}>
            {!started ? 'Start learning' : next ? 'Continue' : 'Review from the start'} <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        {next && started && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Next up: <span className="font-medium text-slate-700 dark:text-slate-300">{next.title}</span>
          </p>
        )}
      </header>

      {subject.id === 'dsa' && (
        <Link to={problemsPath} className={`${cardLinkClass} flex items-center gap-4 p-5`}>
          <IconTile icon="puzzle" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900 dark:text-white">Practice problems</span>
            <span className="block text-sm text-slate-600 dark:text-slate-400">
              Put these ideas to work: {problems.length} problems across {problemCategories.length} patterns.
            </span>
          </span>
          <Icon name="arrow" className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
        </Link>
      )}

      <section aria-labelledby="topics" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <h2 id="topics" className="eyebrow text-slate-600 dark:text-slate-400">
            Topics
          </h2>
          <Segmented label="Filter topics by status" options={STATUS_FILTERS} value={filter} onChange={setFilter} />
        </div>

        {visible.length === 0 && (
          <p role="status" className="rounded-3xl border-2 border-dashed border-slate-300 px-6 py-10 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No {STATUS_FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} topics in {subject.title}.
          </p>
        )}

        {LEVEL_ORDER.map((level) => {
          const topics = visible.filter((t) => t.level === level);
          if (topics.length === 0) return null;
          return (
            <section key={level} aria-labelledby={`level-${level}`}>
              <h3 id={`level-${level}`} className="eyebrow mb-3 text-slate-500 dark:text-slate-400">
                {LEVEL_LABELS[level]} <span className="font-normal">· {topics.length}</span>
              </h3>
              <ol className={`${cardClass} divide-y divide-slate-100 overflow-hidden dark:divide-slate-800`}>
                {topics.map((t) => {
                  const status = getStatus(subject.id, t.id);
                  return (
                    <li key={t.id}>
                      <Link
                        to={topicPath(subject.id, t.id)}
                        className="flex gap-4 px-5 py-4 hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60"
                      >
                        <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-slate-400 dark:text-slate-500">
                          {String(numberOf.get(t.id)).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-900 dark:text-white">{t.title}</span>
                          <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{t.description}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 self-start pt-1 text-xs text-slate-500 dark:text-slate-400">
                          <StatusDot status={status} />
                          <span aria-hidden="true" className="hidden sm:inline">
                            {PROGRESS_LABELS[status]}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </section>
    </div>
  );
}

export default function SubjectPage() {
  const { subjectId = '' } = useParams();
  const subject = getSubjectMeta(subjectId);
  if (!subject) return <NotFoundState what="subject" />;
  // Keyed so the filter resets when moving between subjects.
  return <Subject key={subject.id} subject={subject} />;
}
