// The Learn navigation tree, shared by the desktop sidebar and the mobile drawer.

import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { bookmarksPath, caseStudiesPath, LEARN, problemsPath, progressPath, subjectPath, subjects, topicPath, type SubjectMeta } from '../data';
import { SUBJECT_ICONS } from '../data/subjectIcons';
import { LEVEL_LABELS, useBookmarks, useProgress } from '../hooks/useLearnState';
import type { TopicLevel } from '../types/content';
import { Icon, type IconName } from '../../shared/ui/ui';
import { StatusDot } from './status';

const LEVELS: TopicLevel[] = ['beginner', 'intermediate', 'advanced'];
const RESERVED = new Set(['problems', 'case-studies', 'progress', 'bookmarks']);

/** The subject id in the current URL (/learn/:subjectId/...), if any. */
function currentSubjectId(pathname: string): string | undefined {
  const m = /^\/learn\/([^/]+)/.exec(pathname);
  return m && !RESERVED.has(m[1]) ? m[1] : undefined;
}

const rowClass = (active: boolean) =>
  `flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm pointer-coarse:min-h-11 ${
    active
      ? 'bg-primary-soft font-semibold text-slate-900 dark:bg-slate-800 dark:text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
  }`;

function NavItem({ to, icon, label, end, extra }: { to: string; icon: IconName; label: string; end?: boolean; extra?: ReactNode }) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => rowClass(isActive)}>
        <Icon name={icon} className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {extra}
      </NavLink>
    </li>
  );
}

function SubjectItem({ subject, expanded, onToggle }: { subject: SubjectMeta; expanded: boolean; onToggle: () => void }) {
  const { getStatus, completion } = useProgress();
  const pct = completion(subject.id, subject.topics.map((t) => t.id));
  const listId = `learn-nav-${subject.id}`;
  return (
    <li>
      <div className="flex items-center gap-1">
        <NavLink to={subjectPath(subject.id)} end className={({ isActive }) => `${rowClass(isActive)} flex-1`}>
          <Icon name={SUBJECT_ICONS[subject.id]} className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{subject.title}</span>
          <span className="text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">
            {pct}%<span className="sr-only"> complete</span>
          </span>
        </NavLink>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-label={`${expanded ? 'Hide' : 'Show'} ${subject.title} topics`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 pointer-coarse:h-11 pointer-coarse:w-11 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Icon name="chevron-right" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div id={listId} className="mb-2 ml-4 mt-1 border-l border-slate-200 pl-2 dark:border-slate-800">
          {LEVELS.map((level) => {
            const topics = subject.topics.filter((t) => t.level === level);
            if (topics.length === 0) return null;
            return (
              <div key={level} className="mt-2 first:mt-0">
                <p className="eyebrow px-2.5 py-1 text-[0.65rem] text-slate-500 dark:text-slate-500">{LEVEL_LABELS[level]}</p>
                <ul>
                  {topics.map((t) => (
                    <li key={t.id}>
                      <NavLink
                        to={topicPath(subject.id, t.id)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.8125rem] pointer-coarse:min-h-11 ${
                            isActive
                              ? 'bg-primary-soft font-semibold text-slate-900 dark:bg-slate-800 dark:text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
                          }`
                        }
                      >
                        <StatusDot status={getStatus(subject.id, t.id)} />
                        <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

export function LearnNav() {
  const { pathname } = useLocation();
  const current = currentSubjectId(pathname);
  // Explicit user choices; subjects without one follow the URL (the current subject is open).
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const { bookmarks } = useBookmarks();

  return (
    <nav aria-label="Learn" className="space-y-6 text-sm">
      <ul className="space-y-0.5">
        <NavItem to={LEARN} end icon="grid" label="Learn home" />
      </ul>
      <div>
        <p className="eyebrow mb-2 px-2.5 text-slate-500">Subjects</p>
        <ul className="space-y-0.5">
          {subjects.map((s) => {
            const expanded = toggled[s.id] ?? s.id === current;
            return <SubjectItem key={s.id} subject={s} expanded={expanded} onToggle={() => setToggled((t) => ({ ...t, [s.id]: !expanded }))} />;
          })}
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-2 px-2.5 text-slate-500">Practice</p>
        <ul className="space-y-0.5">
          <NavItem to={problemsPath} icon="puzzle" label="Problems" />
          <NavItem to={caseStudiesPath} icon="building" label="Case studies" />
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-2 px-2.5 text-slate-500">You</p>
        <ul className="space-y-0.5">
          <NavItem to={progressPath} icon="chart" label="Progress" />
          <NavItem
            to={bookmarksPath}
            icon="bookmark"
            label="Bookmarks"
            extra={
              bookmarks.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 text-xs font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <span className="sr-only">(</span>
                  {bookmarks.length}
                  <span className="sr-only">)</span>
                </span>
              )
            }
          />
        </ul>
      </div>
    </nav>
  );
}
