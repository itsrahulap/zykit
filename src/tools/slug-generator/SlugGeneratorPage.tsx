import { useDeferredValue, useMemo, useState } from 'react';
import slugGenerator from './index';
import { DEFAULT_SLUG_OPTIONS, slugifyLines, type Separator } from './features/slug';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Checkbox } from '../../shared/ui/convert';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const SAMPLE = `10 Tips & Tricks for Crème Brûlée
Straße nach Łódź — Ærø Edition
The Quick Brown Fox Jumps Over the Lazy Dog`;

const option = 'inline-flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300';

export default function SlugGeneratorPage() {
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState<Separator>(DEFAULT_SLUG_OPTIONS.separator);
  const [lowercase, setLowercase] = useState(true);
  const [ampersand, setAmpersand] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [maxLength, setMaxLength] = useState('');

  const text = useDeferredValue(input);
  const max = Math.max(0, Math.floor(Number(maxLength) || 0));
  const slugs = useMemo(
    () => (text.trim() ? slugifyLines(text, { separator, lowercase, ampersand, removeStopWords, maxLength: max }) : []),
    [text, separator, lowercase, ampersand, removeStopWords, max],
  );
  const output = slugs.join('\n');
  const count = slugs.filter(Boolean).length;

  useIncomingText(slugGenerator.id, (t) => setInput(t));
  useShareState({ input, separator, lowercase, ampersand, removeStopWords, maxLength }, (r) => {
    if (r.input !== undefined) setInput(r.input);
    if (r.separator !== undefined) setSeparator(r.separator);
    if (r.lowercase !== undefined) setLowercase(r.lowercase);
    if (r.ampersand !== undefined) setAmpersand(r.ampersand);
    if (r.removeStopWords !== undefined) setRemoveStopWords(r.removeStopWords);
    if (r.maxLength !== undefined) setMaxLength(r.maxLength);
  }, { separator: ['-', '_', '.'] as const });
  useToolShortcuts({ getOutput: () => (count ? output : '') });

  const status = !text.trim()
    ? 'Type or paste a title. Each line becomes its own slug.'
    : count === 0
      ? 'No letters or digits to turn into a slug.'
      : `${pluralize(count, 'slug')} generated`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={slugGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="slugs">Turn titles into clean </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={count ? 'good' : 'neutral'} />

      <section
        aria-label="Slug options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<Separator>
          label="Separator"
          options={[
            { value: '-', label: 'Hyphen -' },
            { value: '_', label: 'Underscore _' },
            { value: '.', label: 'Dot .' },
          ]}
          value={separator}
          onChange={setSeparator}
        />
        <Checkbox label="Lowercase" checked={lowercase} onChange={setLowercase} />
        <Checkbox label={<>&amp; → &ldquo;and&rdquo;</>} checked={ampersand} onChange={setAmpersand} />
        <Checkbox label="Remove stop words" checked={removeStopWords} onChange={setRemoveStopWords} />
        <label className={option}>
          Max length
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="None"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
            className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 pointer-coarse:min-h-11 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          label="Text"
          hint="one per line"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          placeholder="My First Blog Post"
          onFileText={(t) => setInput(t)}
        />

        <section aria-label="Slugs" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="link" className="h-4 w-4" /> Slugs
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <CopyButton text={output} label={slugs.length > 1 ? 'Copy all' : 'Copy'} />
              <SendToMenu text={count ? output : ''} />
            </div>
          </header>
          <div className="p-4">
            {count ? (
              <CodeBlock className="max-h-[32rem] overflow-y-auto">{output}</CodeBlock>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Your slugs will appear here.</p>
            )}
          </div>
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Accents are removed (é → e) and letters like ß, æ, ø and ł are spelled out in ASCII. Other scripts, such as Cyrillic or Greek, are kept
        as they are. Everything runs in your browser.
      </p>
    </div>
  );
}
