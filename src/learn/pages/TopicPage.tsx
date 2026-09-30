// /learn/:subjectId/:topicId — one lesson: explanation, analogy, runnable examples, how it
// works, when (not) to use it, mistakes, exercises, interview questions and related material.

import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Segmented } from '../../shared/ui/tool';
import { Badge, Icon } from '../../shared/ui/ui';
import { CodeExampleBlock } from '../components/CodeExampleBlock';
import { Diagram } from '../components/Diagram';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { LoadError, LoadingState, NotFoundState } from '../components/PageStates';
import { InlineText, RichText } from '../components/RichText';
import { DifficultyBadge, LevelBadge, StatusDot } from '../components/status';
import { cardClass, cardLinkClass, primaryLinkClass, secondaryLinkClass } from '../components/learnUi';
import {
  caseStudyPath,
  categoryPath,
  findTopicAnywhere,
  getAdjacentTopics,
  getCaseStudiesForTopic,
  getCategory,
  getProblemCategoriesForTopic,
  getProblemsInCategory,
  getSubjectMeta,
  getTopicMeta,
  LEARN,
  loadTopic,
  subjectPath,
  topicPath,
  type SubjectMeta,
  type TopicMeta,
} from '../data';
import { PROGRESS_LABELS, recordVisit, useBookmarks, useProgress } from '../hooks/useLearnState';
import { useLoaded } from '../hooks/useLoaded';
import { toolIdsForTopic } from '../data/toolLinks';
import { getTool } from '../../tools/registry';
import { ToolCardGrid } from '../../tools/ToolCardGrid';
import type { ToolDefinition } from '../../tools/types';
import { topicMetaFor } from '../seo';
import type { ProgressStatus, Topic } from '../types/content';

const STATUS_OPTIONS = (['not-started', 'learning', 'completed', 'needs-review'] as const).map((value) => ({
  value,
  label: PROGRESS_LABELS[value],
}));

export default function TopicPage() {
  const { subjectId = '', topicId = '' } = useParams();
  const subject = getSubjectMeta(subjectId);
  const meta = subject && getTopicMeta(subjectId, topicId);
  if (!subject || !meta) {
    return subject ? (
      <NotFoundState what="lesson" backTo={subjectPath(subject.id)} backLabel={`Back to ${subject.title}`} />
    ) : (
      <NotFoundState what="lesson" backTo={LEARN} />
    );
  }
  // Keyed so every piece of per-topic state (open playgrounds, disclosures) resets on navigation.
  return <TopicLoader key={`${subject.id}/${meta.id}`} subject={subject} meta={meta} />;
}

function TopicLoader({ subject, meta }: { subject: SubjectMeta; meta: TopicMeta }) {
  useDocumentMeta(topicMetaFor(subject, meta));
  const loaded = useLoaded(`${subject.id}/${meta.id}`, () => loadTopic(subject.id, meta.id));

  useEffect(() => {
    recordVisit(subject.id, meta.id);
  }, [subject.id, meta.id]);

  if (loaded.status === 'loading') return <LoadingState label="Loading lesson…" />;
  if (loaded.status === 'error') return <LoadError />;
  if (loaded.status === 'missing') return <NotFoundState what="lesson" backTo={subjectPath(subject.id)} backLabel={`Back to ${subject.title}`} />;
  return <TopicView subject={subject} topic={loaded.value} />;
}

interface SectionDef {
  id: string;
  title: string;
}

function Section({ id, title, children }: SectionDef & { children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-6">
      <h2 id={id} className="mb-4 scroll-mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TopicView({ subject, topic }: { subject: SubjectMeta; topic: Topic }) {
  const navigate = useNavigate();
  const { getStatus, setStatus } = useProgress();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const status = getStatus(subject.id, topic.id);
  const bookmarked = isBookmarked(subject.id, topic.id);
  const { prev, next } = getAdjacentTopics(subject.id, topic.id);

  const prerequisites = (topic.prerequisites ?? []).map((id) => findTopicAnywhere(id, subject.id)).filter((x) => x !== undefined);
  const related = topic.relatedTopics.map((id) => findTopicAnywhere(id, subject.id)).filter((x) => x !== undefined);
  const caseStudies = subject.id === 'system-design' ? getCaseStudiesForTopic(topic.id) : [];
  const categories =
    subject.id === 'dsa' ? getProblemCategoriesForTopic(topic.id).map((id) => getCategory(id)).filter((c) => c !== undefined) : [];
  const tools = toolIdsForTopic(subject.id, topic.id)
    .map((id) => getTool(id))
    .filter((t): t is ToolDefinition => t !== undefined && t.status !== 'coming-soon');

  const sections: (SectionDef & { show: boolean })[] = [
    { id: 'what-is-it', title: 'What is it?', show: true },
    { id: 'explain-like-im-10', title: 'Explain like I’m 10', show: Boolean(topic.analogy) },
    { id: 'examples', title: topic.examples.length === 1 ? 'Example' : 'Examples', show: topic.examples.length > 0 },
    { id: 'how-it-works', title: 'How it works', show: true },
    { id: 'why-it-exists', title: 'Why does it exist?', show: Boolean(topic.whyItExists) },
    { id: 'when-to-use', title: 'When to use it', show: Boolean(topic.whenToUse || topic.whenNotToUse) },
    { id: 'common-mistakes', title: 'Common mistakes', show: topic.commonMistakes.length > 0 },
    { id: 'practice', title: 'Practice exercises', show: topic.exercises.length > 0 },
    { id: 'practice-problems', title: 'Practice problems', show: categories.length > 0 },
    { id: 'real-world-examples', title: 'Real-world examples', show: caseStudies.length > 0 },
    { id: 'try-it-in-a-tool', title: 'Try it in a tool', show: tools.length > 0 },
    { id: 'interview-questions', title: 'Interview questions', show: topic.interviewQuestions.length > 0 },
    { id: 'related-topics', title: 'Related topics', show: related.length > 0 },
  ];
  const shown = sections.filter((s) => s.show);
  const def = (id: string) => sections.find((s) => s.id === id)!;

  const completeAndContinue = () => {
    setStatus(subject.id, topic.id, 'completed');
    if (next) navigate(topicPath(subject.id, next.id));
  };

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-10">
      <article className="min-w-0 space-y-12">
        <header className="space-y-5">
          <LearnBreadcrumb trail={[{ label: subject.title, to: subjectPath(subject.id) }, { label: topic.title }]} />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={topic.level} />
              <span className="eyebrow text-slate-500 dark:text-slate-400">{subject.title}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white">{topic.title}</h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              <InlineText text={topic.description} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Segmented<ProgressStatus>
              label="Your progress"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(s) => setStatus(subject.id, topic.id, s)}
            />
            <button
              type="button"
              aria-pressed={bookmarked}
              onClick={() => toggleBookmark(subject.id, topic.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset pointer-coarse:min-h-11 ${
                bookmarked
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900'
                  : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <Icon name="bookmark" className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>

          {prerequisites.length > 0 && (
            <div className={`${cardClass} p-4 sm:p-5`}>
              <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Before this, make sure you understand</h2>
              <TopicLinks items={prerequisites} fromSubject={subject.id} />
            </div>
          )}
        </header>

        <Section {...def('what-is-it')}>
          <RichText text={topic.explanation} />
        </Section>

        {topic.analogy && (
          <Section {...def('explain-like-im-10')}>
            <div className="flex gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
              <Icon name="lightbulb" className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="font-serif text-lg italic leading-relaxed text-slate-800 dark:text-amber-50">
                <InlineText text={topic.analogy} />
              </p>
            </div>
          </Section>
        )}

        {topic.examples.length > 0 && (
          <Section {...def('examples')}>
            <div className="space-y-8">
              {topic.examples.map((example, i) => (
                <CodeExampleBlock key={i} example={example} />
              ))}
            </div>
          </Section>
        )}

        <Section {...def('how-it-works')}>
          <RichText text={topic.howItWorks} />
          {topic.diagram && (
            <div className="mt-5">
              <Diagram text={topic.diagram} label={`Diagram: ${topic.title}`} />
            </div>
          )}
        </Section>

        {topic.whyItExists && (
          <Section {...def('why-it-exists')}>
            <RichText text={topic.whyItExists} />
          </Section>
        )}

        {(topic.whenToUse || topic.whenNotToUse) && (
          <Section {...def('when-to-use')}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${cardClass} p-5`}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                  <Icon name="check" className="h-5 w-5" /> When to use it
                </h3>
                <RichText text={topic.whenToUse} className="text-[15px]" />
              </div>
              <div className={`${cardClass} p-5`}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
                  <Icon name="x" className="h-5 w-5" /> When not to use it
                </h3>
                <RichText text={topic.whenNotToUse} className="text-[15px]" />
              </div>
            </div>
          </Section>
        )}

        {topic.commonMistakes.length > 0 && (
          <Section {...def('common-mistakes')}>
            <ul className="space-y-3">
              {topic.commonMistakes.map((m, i) => (
                <li key={i} className="flex gap-3 leading-relaxed text-slate-700 dark:text-slate-300">
                  <Icon name="warn" className="mt-1 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="min-w-0">
                    <InlineText text={m} />
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {topic.exercises.length > 0 && (
          <Section {...def('practice')}>
            <ol className="space-y-3">
              {topic.exercises.map((ex, i) => (
                <li key={i} className={`${cardClass} flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4`}>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">{i + 1}.</span>
                    <DifficultyBadge difficulty={ex.difficulty} />
                  </span>
                  <p className="min-w-0 leading-relaxed text-slate-700 dark:text-slate-300">
                    <InlineText text={ex.prompt} />
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {categories.length > 0 && (
          <Section {...def('practice-problems')}>
            <p className="mb-4 text-slate-600 dark:text-slate-400">Ready to apply this? Try real coding problems that use this pattern.</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={categoryPath(c.id)} className={`${cardLinkClass} flex h-full flex-col gap-1 p-4`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{c.title}</span>
                      <Badge>{getProblemsInCategory(c.id).length} problems</Badge>
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{c.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {caseStudies.length > 0 && (
          <Section {...def('real-world-examples')}>
            <p className="mb-4 text-slate-600 dark:text-slate-400">See this idea used in a full system design walkthrough.</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {caseStudies.map((c) => (
                <li key={c.id}>
                  <Link to={caseStudyPath(c.id)} className={`${cardLinkClass} flex h-full items-start gap-3 p-4`}>
                    <Icon name="building" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        Design {c.title} <DifficultyBadge difficulty={c.difficulty} />
                      </span>
                      <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{c.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tools.length > 0 && (
          <Section {...def('try-it-in-a-tool')}>
            <ToolCardGrid tools={tools} />
          </Section>
        )}

        {topic.interviewQuestions.length > 0 && (
          <Section {...def('interview-questions')}>
            <div className="space-y-3">
              {topic.interviewQuestions.map((q, i) => (
                <details key={i} className={`${cardClass} group overflow-hidden`}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 pointer-coarse:min-h-11 dark:text-white dark:hover:bg-slate-800/60 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <InlineText text={q.question} />
                    </span>
                    <Icon
                      name="chevron-right"
                      className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    />
                  </summary>
                  <div className="border-t border-slate-100 px-5 py-4 leading-relaxed text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    <InlineText text={q.answer} />
                  </div>
                </details>
              ))}
            </div>
          </Section>
        )}

        {related.length > 0 && (
          <Section {...def('related-topics')}>
            <TopicLinks items={related} fromSubject={subject.id} />
          </Section>
        )}

        <footer className="space-y-6 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <StatusDot status={status} /> <span aria-hidden="true">{PROGRESS_LABELS[status]}</span>
            </p>
            {status === 'completed' ? (
              next ? (
                <Link to={topicPath(subject.id, next.id)} className={primaryLinkClass}>
                  Continue to {next.title} <Icon name="arrow" className="h-4 w-4" />
                </Link>
              ) : (
                <Link to={subjectPath(subject.id)} className={secondaryLinkClass}>
                  <Icon name="check" className="h-4 w-4" /> Completed · back to {subject.title}
                </Link>
              )
            ) : (
              <button type="button" onClick={completeAndContinue} className={`${primaryLinkClass} whitespace-normal text-left`}>
                <Icon name="check" className="h-4 w-4 shrink-0" />
                {next ? 'Mark as completed and continue' : 'Mark as completed'}
              </button>
            )}
          </div>

          <nav aria-label="Lessons" className="grid gap-3 sm:grid-cols-2">
            {prev ? <AdjacentLink subjectId={subject.id} topic={prev} direction="prev" /> : <span className="hidden sm:block" />}
            {next && <AdjacentLink subjectId={subject.id} topic={next} direction="next" />}
          </nav>
        </footer>
      </article>

      <div className="hidden xl:block">
        <nav aria-label="On this page" className="sticky top-6">
          <p className="eyebrow mb-3 text-slate-500 dark:text-slate-400">On this page</p>
          <ol className="space-y-1 border-l border-slate-200 text-sm dark:border-slate-800">
            {shown.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-l border-transparent py-1 pl-3 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}

function TopicLinks({ items, fromSubject }: { items: { subject: SubjectMeta; topic: TopicMeta }[]; fromSubject: string }) {
  const { getStatus } = useProgress();
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(({ subject, topic }) => (
        <li key={`${subject.id}/${topic.id}`} className="max-w-full">
          <Link
            to={topicPath(subject.id, topic.id)}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:border-emerald-500 hover:text-emerald-800 pointer-coarse:min-h-11 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
          >
            <StatusDot status={getStatus(subject.id, topic.id)} />
            <span className="min-w-0 truncate">{topic.title}</span>
            {subject.id !== fromSubject && <span className="shrink-0 text-xs font-normal text-slate-500 dark:text-slate-400">· {subject.title}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AdjacentLink({ subjectId, topic, direction }: { subjectId: string; topic: TopicMeta; direction: 'prev' | 'next' }) {
  const isNext = direction === 'next';
  return (
    <Link
      to={topicPath(subjectId, topic.id)}
      rel={isNext ? 'next' : 'prev'}
      className={`${cardLinkClass} flex flex-col gap-1 p-4 ${isNext ? 'sm:col-start-2 sm:items-end sm:text-right' : ''}`}
    >
      <span className="eyebrow flex items-center gap-1 text-slate-500 dark:text-slate-400">
        {!isNext && <Icon name="chevron-left" className="h-3.5 w-3.5" />}
        {isNext ? 'Next' : 'Previous'}
        {isNext && <Icon name="chevron-right" className="h-3.5 w-3.5" />}
      </span>
      <span className="font-semibold text-slate-900 dark:text-white">{topic.title}</span>
    </Link>
  );
}
