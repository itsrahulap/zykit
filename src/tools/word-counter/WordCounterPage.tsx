import { useDeferredValue, useMemo, useState } from 'react';
import wordCounter from './index';
import { computeStats, formatDuration, READING_WPM, SPEAKING_WPM } from './features/count';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { OpenFileButton } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

const SAMPLE = `The quick brown fox jumps over the lazy dog. It's a pangram: it uses every letter of the alphabet!

Writers use word counts to hit targets, and speakers use them to time talks. 👋🏽 Emoji count as one character here.`;

const n = (v: number) => v.toLocaleString('en-US');

export default function WordCounterPage() {
  const [input, setInput] = useState('');
  const [ignoreStopWords, setIgnoreStopWords] = useState(true);

  useIncomingText(wordCounter.id, (t) => setInput(t));
  useShareState({ input, ignoreStopWords }, (r) => {
    if (r.input !== undefined) setInput(r.input);
    if (r.ignoreStopWords !== undefined) setIgnoreStopWords(r.ignoreStopWords);
  });

  // Counting runs on a deferred copy so typing stays responsive on large texts.
  const text = useDeferredValue(input);
  const stale = text !== input;
  const stats = useMemo(() => computeStats(text, { ignoreStopWords }), [text, ignoreStopWords]);

  const headline = [
    { label: 'Words', value: n(stats.words) },
    { label: 'Characters', value: n(stats.graphemes) },
    { label: 'Sentences', value: n(stats.sentences) },
    { label: 'Reading time', value: formatDuration(stats.readingSeconds) },
  ];

  const status = !text ? 'Type or paste text to count it as you go.' : `${pluralize(stats.words, 'word')} · ${pluralize(stats.graphemes, 'character')}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={wordCounter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="word">Count every </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".txt,.md,.markdown,.html,.csv,.log,text/*" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : text ? 'good' : 'neutral'} />

      <dl aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label} className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <dt className="eyebrow text-slate-500 dark:text-slate-400">{h.label}</dt>
            <dd data-testid={`stat-${h.label.toLowerCase().replace(/\s+/g, '-')}`} className="mt-2 truncate text-2xl font-bold sm:text-3xl tabular-nums text-slate-900 dark:text-white">
              {h.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <CodeArea label="Your text" value={input} onChange={(e) => setInput(e.target.value)} rows={16} placeholder="Start typing or paste text…" className="font-sans!" spellCheck onFileText={(t) => setInput(t)} />

        <div className="min-w-0 space-y-6">
          <Panel eyebrow="Details" icon="info">
            <DetailRows
              rows={[
                ['Words', n(stats.words)],
                ['Characters', n(stats.graphemes)],
                ['Characters (no spaces)', n(stats.charactersNoSpaces)],
                ['UTF-16 code units', n(stats.characters)],
                ['Sentences', n(stats.sentences)],
                ['Paragraphs', n(stats.paragraphs)],
                ['Lines', n(stats.lines)],
                ['Size (UTF-8)', `${formatBytes(stats.bytes)}${stats.bytes >= 1024 ? ` (${n(stats.bytes)} bytes)` : ''}`],
                ['Average word length', `${stats.averageWordLength.toFixed(1)} characters`],
                ['Longest word', stats.longestWord || '—'],
                [`Reading time (${READING_WPM} wpm)`, formatDuration(stats.readingSeconds)],
                [`Speaking time (${SPEAKING_WPM} wpm)`, formatDuration(stats.speakingSeconds)],
              ]}
            />
          </Panel>

          <Panel eyebrow="Most frequent words" icon="chart">
            <label className="mb-4 inline-flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
              <input
                type="checkbox"
                checked={ignoreStopWords}
                onChange={(e) => setIgnoreStopWords(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-600"
              />
              Ignore common words (the, and, of…)
            </label>
            {stats.topWords.length ? (
              <ol aria-label="Top words" className="space-y-2">
                {stats.topWords.map((w) => (
                  <li key={w.word} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{w.word}</span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                    >
                      <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${(w.count / stats.topWords[0].count) * 100}%` }} />
                    </span>
                    <span className="w-10 text-right tabular-nums text-slate-600 dark:text-slate-400">{n(w.count)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No words yet.</p>
            )}
          </Panel>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Characters are counted as you see them, so an emoji or an accented letter counts once. Your text stays in your browser.
      </p>
    </div>
  );
}
