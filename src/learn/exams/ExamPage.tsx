// /learn/exams/<examId>: exam overview, timed mock tests, untimed practice with instant feedback,
// results with per-domain scores and a full review. Progress is kept in localStorage (examStore).

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline } from '../../shared/ui/page';
import { Button, Icon } from '../../shared/ui/ui';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { cardClass, SectionHeading, StatTile } from '../components/learnUi';
import { LoadError, LoadingState, NotFoundState } from '../components/PageStates';
import { ProgressBar } from '../components/ProgressBar';
import { InlineText, RichText } from '../components/RichText';
import { buildMockTest, buildPractice, formatClock, isCorrect, scoreTest, type Score, type TestItem } from './engine';
import { examStore, getExam, recordAttempt, type Attempt } from './index';
import type { Exam, ExamQuestion } from './types';

type Mode = { kind: 'mock' } | { kind: 'practice'; label: string };
type View = { name: 'home' } | { name: 'test'; mode: Mode; items: TestItem[]; key: number } | { name: 'results'; mode: Mode; items: TestItem[]; answers: Record<string, number[]>; flagged: string[]; score: Score; seconds: number };

const LETTERS = 'ABCDEFGH';
const pct = (r: number) => `${Math.round(r * 100)}%`;
const chooseHint = (q: ExamQuestion) => (q.answer.length > 1 ? `Choose ${q.answer.length === 2 ? 'two' : q.answer.length === 3 ? 'three' : q.answer.length}.` : null);

export default function ExamPage() {
  const { examId = '' } = useParams();
  const entry = getExam(examId);
  const [bank, setBank] = useState<ExamQuestion[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View>({ name: 'home' });

  useDocumentMeta(
    entry
      ? { title: `${entry.exam.title} (${entry.exam.code}) practice exam`, description: entry.exam.description }
      : { title: 'Not found', noindex: true },
  );
  useEffect(() => {
    entry?.load().then(setBank, () => setFailed(true));
  }, [entry]);
  useEffect(() => window.scrollTo(0, 0), [view.name]);

  if (!entry) return <NotFoundState what="exam" />;
  if (failed) return <LoadError />;
  if (!bank) return <LoadingState label="Loading questions…" />;
  const { exam } = entry;

  const start = (mode: Mode, items: TestItem[]) => setView({ name: 'test', mode, items, key: Date.now() });
  return view.name === 'test' ? (
    <TestRunner
      key={view.key}
      exam={exam}
      mode={view.mode}
      items={view.items}
      onQuit={() => setView({ name: 'home' })}
      onFinish={(answers, flagged, seconds) => {
        const score = scoreTest(exam, view.items, answers);
        const store = examStore(exam.id);
        const attempt: Attempt = {
          at: new Date().toISOString(),
          mode: view.mode.kind,
          label: view.mode.kind === 'mock' ? 'Full mock test' : view.mode.label,
          correct: score.correct,
          total: score.total,
          passed: score.passed,
          seconds,
          byDomain: score.byDomain.map(({ id, correct, total }) => ({ id, correct, total })),
        };
        store.set(recordAttempt(store.get(), attempt, score.missed, view.items.map((i) => i.question.id)));
        setView({ name: 'results', mode: view.mode, items: view.items, answers, flagged, score, seconds });
      }}
    />
  ) : view.name === 'results' ? (
    <Results exam={exam} view={view} bank={bank} onStart={start} onHome={() => setView({ name: 'home' })} />
  ) : (
    <ExamHome exam={exam} bank={bank} onStart={start} />
  );
}

function ExamHome({ exam, bank, onStart }: { exam: Exam; bank: ExamQuestion[]; onStart: (mode: Mode, items: TestItem[]) => void }) {
  const { attempts, missed } = examStore(exam.id).use();
  const [count, setCount] = useState(20);
  const missedQs = bank.filter((q) => missed.includes(q.id));
  const mocks = attempts.filter((a) => a.mode === 'mock');
  const best = mocks.reduce((b, a) => Math.max(b, a.correct / a.total), 0);

  return (
    <div className="space-y-12">
      <header className="space-y-5">
        <LearnBreadcrumb trail={[{ label: 'Exam practice' }, { label: exam.code }]} />
        <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Icon name="check" className="h-4 w-4" /> Exam practice · {exam.code}
        </p>
        <Headline accent="Cloud Practitioner">AWS Certified </Headline>
        <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-400">
          {bank.length} practice questions across all four exam domains, each with an explanation. Take full-length timed mock tests, or practice one domain at
          a time and see the answer straight away.
        </p>
        <ul className="max-w-3xl space-y-1.5 text-slate-700 dark:text-slate-300">
          {exam.facts.map((f) => (
            <li key={f} className="flex gap-2">
              <Icon name="info" className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              <span>
                <InlineText text={f} />
              </span>
            </li>
          ))}
        </ul>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Questions in bank" value={bank.length} />
        <StatTile label="Mock tests taken" value={mocks.length} />
        <StatTile label="Best mock score" value={mocks.length ? pct(best) : '–'} hint={`Pass: ${pct(exam.passRatio)}`} />
        <StatTile label="To review" value={missed.length} hint="questions you got wrong" />
      </dl>

      <section aria-labelledby="mock" className={`${cardClass} space-y-4 p-6 sm:p-8`}>
        <h2 id="mock" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Full mock test
        </h2>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          {exam.questionCount} questions in {exam.minutes} minutes, drawn from every domain by the real exam weights, in random order with shuffled options. No
          answers until you submit, like the real thing.
        </p>
        <Button onClick={() => onStart({ kind: 'mock' }, buildMockTest(exam, bank))}>
          <Icon name="play" className="h-4 w-4" /> Start mock test
        </Button>
      </section>

      <section aria-labelledby="practice" className="space-y-5">
        <SectionHeading id="practice">Practice by domain</SectionHeading>
        <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          Questions per set
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {[10, 20, 40, 1000].map((n) => (
              <option key={n} value={n}>
                {n === 1000 ? 'All' : n}
              </option>
            ))}
          </select>
        </label>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {exam.domains.map((d) => {
            const qs = bank.filter((q) => q.domain === d.id);
            return (
              <li key={d.id} className={`${cardClass} flex flex-col p-5`}>
                <span className="eyebrow text-slate-500">{pct(d.weight)} of the exam</span>
                <span className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{d.title}</span>
                <span className="mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{qs.length} questions</span>
                <Button variant="secondary" className="mt-4" onClick={() => onStart({ kind: 'practice', label: d.title }, buildPractice(qs, count))}>
                  Practice
                </Button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => onStart({ kind: 'practice', label: 'All domains' }, buildPractice(bank, count))}>
            Practice all domains
          </Button>
          <Button variant="secondary" disabled={!missedQs.length} onClick={() => onStart({ kind: 'practice', label: 'Missed questions' }, buildPractice(missedQs, count))}>
            Practice my mistakes ({missedQs.length})
          </Button>
        </div>
      </section>

      {attempts.length > 0 && (
        <section aria-labelledby="history">
          <SectionHeading id="history">Your attempts</SectionHeading>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Set</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attempts.map((a) => (
                  <tr key={a.at} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(a.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="py-2 pr-4">{a.label}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {a.correct}/{a.total} ({pct(a.correct / a.total)})
                    </td>
                    <td className="py-2 pr-4">{formatClock(a.seconds)}</td>
                    <td className={`py-2 font-medium ${a.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{a.passed ? 'Pass' : 'Below pass'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function TestRunner({
  exam,
  mode,
  items,
  onQuit,
  onFinish,
}: {
  exam: Exam;
  mode: Mode;
  items: TestItem[];
  onQuit: () => void;
  onFinish: (answers: Record<string, number[]>, flagged: string[], seconds: number) => void;
}) {
  const timed = mode.kind === 'mock';
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = exam.minutes * 60 - elapsed;
  const finish = () => onFinish(answers, flagged, elapsed);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (timed && remaining <= 0) finish();
  });
  // Warn before leaving the page mid-test.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const { question: q, order } = items[index];
  const selected = answers[q.id] ?? [];
  const multi = q.answer.length > 1;
  const isChecked = checked.includes(q.id);
  const answeredCount = items.filter((i) => answers[i.question.id]?.length).length;

  const toggle = (opt: number) => {
    if (isChecked) return;
    const next = multi ? (selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]) : [opt];
    setAnswers({ ...answers, [q.id]: next });
  };
  const submit = () => {
    const blank = items.length - answeredCount;
    if (!blank || window.confirm(`You have ${blank} unanswered question${blank === 1 ? '' : 's'}. They count as wrong. Submit anyway?`)) finish();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <p className="eyebrow text-slate-600 dark:text-slate-400">
          {mode.kind === 'mock' ? `${exam.code} mock test` : `Practice · ${mode.label}`}
        </p>
        <div className="flex items-center gap-3">
          {timed ? (
            <span role="timer" aria-label="Time remaining" className={`font-mono text-lg font-semibold ${remaining < 300 ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {formatClock(remaining)}
            </span>
          ) : (
            <span className="font-mono text-sm text-slate-500">{formatClock(elapsed)}</span>
          )}
          <Button variant="ghost" onClick={() => window.confirm('Quit this test? Your answers will be lost.') && onQuit()}>
            Quit
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article aria-labelledby="question" className="min-w-0 max-w-4xl space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Question {index + 1} of {items.length} · {exam.domains.find((d) => d.id === q.domain)?.title}
          </p>
          <div id="question" className="text-lg font-medium text-slate-900 dark:text-white">
            <RichText text={q.question} className="!text-slate-900 dark:!text-white" />
          </div>
          {chooseHint(q) && <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{chooseHint(q)}</p>}

          <fieldset className="space-y-2">
            <legend className="sr-only">Options</legend>
            {order.map((opt, pos) => {
              const on = selected.includes(opt);
              const right = q.answer.includes(opt);
              const tone = isChecked
                ? right
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                  : on
                    ? 'border-red-400 bg-red-50 dark:bg-red-950/40'
                    : 'border-slate-200 dark:border-slate-800'
                : on
                  ? 'border-emerald-600 bg-primary-soft dark:bg-slate-800'
                  : 'border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600';
              return (
                <label key={opt} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-slate-800 dark:text-slate-200 ${tone}`}>
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={q.id}
                    checked={on}
                    disabled={isChecked}
                    onChange={() => toggle(opt)}
                    className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <span className="font-mono text-sm text-slate-500">{LETTERS[pos]}.</span>
                  <span className="min-w-0">
                    <InlineText text={q.options[opt]} />
                  </span>
                </label>
              );
            })}
          </fieldset>

          {isChecked && <Feedback q={q} selected={selected} />}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <Icon name="chevron-left" className="h-4 w-4" /> Previous
            </Button>
            {!timed && !isChecked && (
              <Button disabled={!selected.length} onClick={() => setChecked([...checked, q.id])}>
                Check answer
              </Button>
            )}
            {index < items.length - 1 ? (
              <Button variant={timed || isChecked ? 'primary' : 'secondary'} onClick={() => setIndex(index + 1)}>
                Next <Icon name="chevron-right" className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit}>{timed ? 'Submit test' : 'Finish'}</Button>
            )}
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={flagged.includes(q.id)}
                onChange={() => setFlagged(flagged.includes(q.id) ? flagged.filter((f) => f !== q.id) : [...flagged, q.id])}
                className="h-4 w-4 accent-amber-500"
              />
              Flag for review
            </label>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ProgressBar value={answeredCount} max={items.length} label="Answered" />
          <nav aria-label="Questions" className="grid grid-cols-8 gap-1.5 lg:grid-cols-6">
            {items.map((it, i) => {
              const id = it.question.id;
              const done = answers[id]?.length;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={`Question ${i + 1}${done ? ', answered' : ''}${flagged.includes(id) ? ', flagged' : ''}`}
                  aria-current={i === index ? 'step' : undefined}
                  onClick={() => setIndex(i)}
                  className={`relative h-9 rounded-lg text-xs font-semibold ${i === index ? 'ring-2 ring-emerald-600' : ''} ${done ? 'bg-primary text-primary-ink' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {i + 1}
                  {flagged.includes(id) && <span aria-hidden="true" className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </button>
              );
            })}
          </nav>
          <Button className="w-full" onClick={submit}>
            {timed ? 'Submit test' : 'Finish and see results'}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Feedback({ q, selected }: { q: ExamQuestion; selected: number[] }) {
  const ok = isCorrect(q, selected);
  return (
    <div role="status" className={`rounded-2xl p-4 ${ok ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100' : 'bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100'}`}>
      <p className="font-semibold">{ok ? 'Correct' : `Not quite. Correct: ${q.answer.map((a) => q.options[a]).join('; ')}`}</p>
      <RichText text={q.explanation} className="mt-2 !text-current" />
    </div>
  );
}

function Results({
  exam,
  view,
  bank,
  onStart,
  onHome,
}: {
  exam: Exam;
  view: Extract<View, { name: 'results' }>;
  bank: ExamQuestion[];
  onStart: (mode: Mode, items: TestItem[]) => void;
  onHome: () => void;
}) {
  const { score, items, answers, flagged, seconds, mode } = view;
  const [filter, setFilter] = useState<'all' | 'wrong' | 'flagged'>(score.missed.length ? 'wrong' : 'all');
  const shown = useMemo(
    () => items.filter(({ question }) => (filter === 'wrong' ? score.missed.includes(question.id) : filter === 'flagged' ? flagged.includes(question.id) : true)),
    [filter, items, score.missed, flagged],
  );
  const missedQs = bank.filter((q) => score.missed.includes(q.id));

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <LearnBreadcrumb trail={[{ label: 'Exam practice' }, { label: exam.code }]} />
        <p className="eyebrow text-slate-500">{mode.kind === 'mock' ? 'Mock test result' : `Practice result · ${mode.label}`}</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {pct(score.ratio)}{' '}
          <span className={score.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>{score.passed ? 'Pass' : 'Below pass'}</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {score.correct} of {score.total} correct in {formatClock(seconds)}. The pass mark here is {pct(exam.passRatio)}.
        </p>
        <div className="flex flex-wrap gap-3">
          {mode.kind === 'mock' && <Button onClick={() => onStart({ kind: 'mock' }, buildMockTest(exam, bank))}>Take another mock test</Button>}
          {missedQs.length > 0 && (
            <Button variant="secondary" onClick={() => onStart({ kind: 'practice', label: 'Missed questions' }, buildPractice(missedQs, missedQs.length))}>
              Practice the {missedQs.length} you missed
            </Button>
          )}
          <Button variant="ghost" onClick={onHome}>
            Back to exam overview
          </Button>
        </div>
      </header>

      <section aria-labelledby="by-domain" className="space-y-4">
        <SectionHeading id="by-domain">Score by domain</SectionHeading>
        <ul className="grid gap-4 md:grid-cols-2">
          {score.byDomain.map((d) => (
            <li key={d.id} className={`${cardClass} space-y-2 p-5`}>
              <p className="flex justify-between gap-3 font-semibold text-slate-900 dark:text-white">
                <span>{d.title}</span>
                <span>
                  {d.correct}/{d.total}
                </span>
              </p>
              <ProgressBar value={d.correct} max={d.total} label={`${d.title} score`} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="review" className="space-y-4">
        <SectionHeading id="review">Review answers</SectionHeading>
        <div role="group" aria-label="Show" className="inline-flex rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800">
          {(
            [
              ['wrong', `Incorrect (${score.missed.length})`],
              ['flagged', `Flagged (${flagged.length})`],
              ['all', `All (${items.length})`],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
              className={`rounded-lg px-3 py-1.5 font-medium ${filter === v ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ol className="space-y-4">
          {shown.map(({ question: q, order }) => {
            const mine = answers[q.id] ?? [];
            const ok = isCorrect(q, mine);
            return (
              <li key={q.id} className={`${cardClass} max-w-4xl space-y-3 p-5`}>
                <p className="flex items-center gap-2 text-sm">
                  <span className={`font-semibold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {ok ? 'Correct' : mine.length ? 'Incorrect' : 'Not answered'}
                  </span>
                  <span className="text-slate-500">· Question {items.findIndex((i) => i.question.id === q.id) + 1}</span>
                </p>
                <RichText text={q.question} className="font-medium !text-slate-900 dark:!text-white" />
                <ul className="space-y-1.5 text-sm">
                  {order.map((opt, pos) => (
                    <li
                      key={opt}
                      className={`flex gap-2 rounded-lg px-3 py-2 ${q.answer.includes(opt) ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100' : mine.includes(opt) ? 'bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <span className="font-mono text-slate-500">{LETTERS[pos]}.</span>
                      <span className="min-w-0 flex-1">
                        <InlineText text={q.options[opt]} />
                      </span>
                      {q.answer.includes(opt) && <span className="font-semibold">Correct</span>}
                      {!q.answer.includes(opt) && mine.includes(opt) && <span className="font-semibold">Your answer</span>}
                    </li>
                  ))}
                </ul>
                <RichText text={q.explanation} className="text-sm" />
              </li>
            );
          })}
          {shown.length === 0 && <li className="text-slate-500">Nothing here.</li>}
        </ol>
      </section>
    </div>
  );
}
