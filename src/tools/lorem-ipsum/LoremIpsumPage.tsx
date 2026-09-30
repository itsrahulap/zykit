import { useMemo, useState } from 'react';
import loremIpsum from './index';
import { countWords, generateLorem, LIMITS, randomSeed, type Format, type Unit, type WordList } from './features/lorem-ipsum';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Checkbox, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useShareState } from '../../shared/hooks/useShareState';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const UNIT_LABEL: Record<Unit, string> = { paragraphs: 'Paragraphs', sentences: 'Sentences', words: 'Words', list: 'List items' };
const inputCls =
  'w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export default function LoremIpsumPage() {
  const [words, setWords] = useState<WordList>('lorem');
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [format, setFormat] = useState<Format>('plain');
  const [seed, setSeed] = useState(() => randomSeed());

  useShareState(
    { words, unit, count, startWithLorem, format, seed },
    (s) => {
      if (s.words) setWords(s.words);
      if (s.unit) setUnit(s.unit);
      if (s.count !== undefined) setCount(s.count);
      if (s.startWithLorem !== undefined) setStartWithLorem(s.startWithLorem);
      if (s.format) setFormat(s.format);
      if (s.seed !== undefined) setSeed(s.seed);
    },
    { words: ['lorem', 'english'], unit: ['paragraphs', 'sentences', 'words', 'list'], format: ['plain', 'html', 'markdown'] },
  );

  const max = LIMITS[unit];
  const n = Math.max(1, Math.min(max, Math.floor(count) || 1));
  const output = useMemo(() => generateLorem({ words, unit, count: n, startWithLorem, format, seed }), [words, unit, n, startWithLorem, format, seed]);
  const ext = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'txt';
  const mime = format === 'html' ? 'text/html' : format === 'markdown' ? 'text/markdown' : 'text/plain';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={loremIpsum} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="text">Placeholder </Headline>
        <Button variant="secondary" onClick={() => setSeed(randomSeed())}>
          <Icon name="dice" className="h-4 w-4" /> Regenerate
        </Button>
      </div>

      <StatusStrip status={`${pluralize(countWords(output), 'word')} · ${output.length.toLocaleString('en-US')} characters`} tone="good" />

      <OptionsCard label="Text options">
        <Segmented<WordList>
          label="Words"
          options={[
            { value: 'lorem', label: 'Lorem ipsum' },
            { value: 'english', label: 'English' },
          ]}
          value={words}
          onChange={setWords}
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>How many</span>
          <input type="number" min={1} max={max} value={count} onChange={(e) => setCount(Number(e.target.value))} className={inputCls} />
        </label>
        <Segmented<Unit>
          label="Unit"
          options={(Object.keys(UNIT_LABEL) as Unit[]).map((u) => ({ value: u, label: UNIT_LABEL[u] }))}
          value={unit}
          onChange={setUnit}
        />
        <Segmented<Format>
          label="Format"
          options={[
            { value: 'plain', label: 'Plain' },
            { value: 'html', label: 'HTML' },
            { value: 'markdown', label: 'Markdown' },
          ]}
          value={format}
          onChange={setFormat}
        />
        {words === 'lorem' && <Checkbox label={'Start with “Lorem ipsum dolor sit amet…”'} checked={startWithLorem} onChange={setStartWithLorem} />}
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>Seed</span>
          <input value={seed} onChange={(e) => setSeed(e.target.value)} className={`${inputCls} w-32 font-mono`} spellCheck={false} autoComplete="off" />
        </label>
        {count > max && <p className="basis-full text-sm text-amber-700 dark:text-amber-400">Limited to {max.toLocaleString('en-US')} {UNIT_LABEL[unit].toLowerCase()}.</p>}
      </OptionsCard>

      <OutputPanel title="Generated text" icon="text" text={output} fileName={`lorem-ipsum.${ext}`} mime={mime} kind={format === 'markdown' ? 'markdown' : 'text'} />

      <p className="text-sm text-slate-500 dark:text-slate-400">
        The same seed always gives the same text, so a share link reproduces exactly what you see. &ldquo;English&rdquo; uses ordinary words for
        mock-ups where Latin would distract.
      </p>
    </div>
  );
}
