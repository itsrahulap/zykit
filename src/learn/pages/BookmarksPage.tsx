// /learn/bookmarks — saved topics, grouped by subject.

import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Icon } from '../../shared/ui/ui';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { LevelBadge, StatusDot } from '../components/status';
import { cardClass, EmptyState, SectionHeading } from '../components/learnUi';
import { LEARN, subjects, topicPath } from '../data';
import { SUBJECT_ICONS } from '../data/subjectIcons';
import { useBookmarks, useProgress } from '../hooks/useLearnState';

export default function BookmarksPage() {
  useDocumentMeta({ title: 'Bookmarks', description: 'Topics you saved to come back to, stored in this browser.', noindex: true });
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { getStatus } = useProgress();

  // Catalog order within each subject; bookmarks to topics that no longer exist are skipped.
  const groups = subjects
    .map((s) => ({ subject: s, topics: s.topics.filter((t) => bookmarks.some((b) => b.subjectId === s.id && b.topicId === t.id)) }))
    .filter((g) => g.topics.length > 0);

  return (
    <div className="space-y-10">
      <LearnBreadcrumb trail={[{ label: 'Bookmarks' }]} />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Bookmarks</h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">Topics you&rsquo;ve saved to come back to. Saved in this browser only.</p>
      </header>

      {groups.length === 0 ? (
        <EmptyState icon="bookmark" title="No bookmarks yet" action={{ to: LEARN, label: 'Find a topic' }}>
          Use the bookmark button on any lesson to keep it here for later.
        </EmptyState>
      ) : (
        groups.map(({ subject, topics }) => (
          <section key={subject.id} aria-labelledby={`bm-${subject.id}`}>
            <SectionHeading id={`bm-${subject.id}`}>
              <span className="inline-flex items-center gap-2">
                <Icon name={SUBJECT_ICONS[subject.id]} className="h-4 w-4" />
                {subject.title} · {topics.length}
              </span>
            </SectionHeading>
            <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden dark:divide-slate-800`}>
              {topics.map((t) => (
                <li key={t.id} className="flex items-center gap-2 pr-2 sm:pr-3">
                  <Link
                    to={topicPath(subject.id, t.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <StatusDot status={getStatus(subject.id, t.id)} className="pt-2" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 dark:text-white">{t.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{t.description}</span>
                    </span>
                    <span className="hidden shrink-0 sm:inline-flex">
                      <LevelBadge level={t.level} />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(subject.id, t.id)}
                    aria-label={`Remove bookmark: ${t.title}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 pointer-coarse:h-11 pointer-coarse:w-11 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
