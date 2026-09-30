import { useDeferredValue, useMemo, useState } from 'react';
import stringEscaper from './index';
import { escapeText, FORMAT_IDS, FORMATS, unescapeText, type FormatId } from './features/string-escaper';
import { textError } from '../../shared/lib/textpos';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Checkbox, ErrorPanel, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { Select } from '../../shared/ui/Select';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Mode = 'escape' | 'unescape';
const INPUT_ID = 'string-escaper-input';
const SAMPLE = `He said "it's 5 o'clock" — café 😀
Path: C:\\Users\\me	(tab) and \${HOME} $PATH <b>&</b>`;

export default function StringEscaperPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('escape');
  const [format, setFormat] = useState<FormatId>('json');
  const [ascii, setAscii] = useState(false);

  const text = useDeferredValue(input);
  const info = FORMATS.find((f) => f.id === format)!;
  const result = useMemo(() => (mode === 'escape' ? escapeText(format, text, { ascii }) : unescapeText(format, text)), [mode, format, text, ascii]);
  const output = result.ok ? result.value : '';
  const roundTrip = useMemo(() => {
    if (!result.ok || !text) return null;
    const back = mode === 'escape' ? unescapeText(format, result.value) : escapeText(format, result.value, { ascii });
    return mode === 'escape' ? back.ok && back.value === text : back.ok;
  }, [result, text, mode, format, ascii]);

  useIncomingText(stringEscaper.id, (t) => setInput(t));
  useShareState(
    { input, mode, format, ascii },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.mode) setMode(s.mode);
      if (s.format) setFormat(s.format);
      if (s.ascii !== undefined) setAscii(s.ascii);
    },
    { mode: ['escape', 'unescape'], format: FORMAT_IDS },
  );

  const status = !text
    ? 'Paste text to escape it for a string literal, shell, SQL, regex, URL or markup.'
    : !result.ok
      ? `Can’t ${mode}: ${result.error}`
      : `${mode === 'escape' ? 'Escaped' : 'Unescaped'} for ${info.label} · ${pluralize([...output].length, 'character')}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={stringEscaper} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="any language">Escape strings for </Headline>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setInput(SAMPLE);
              setMode('escape');
            }}
          >
            Try an example
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={text && result.ok ? 'good' : 'neutral'} />

      <OptionsCard label="Escaping options">
        <Segmented<Mode>
          label="Direction"
          options={[
            { value: 'escape', label: 'Escape' },
            { value: 'unescape', label: 'Unescape' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Select<FormatId> label="Format" options={FORMATS.map((f) => ({ value: f.id, label: f.label }))} value={format} onChange={setFormat} />
        {info.asciiOption && mode === 'escape' && <Checkbox label="Escape non-ASCII too" checked={ascii} onChange={setAscii} />}
        <Button
          variant="ghost"
          disabled={!output}
          onClick={() => {
            setInput(output);
            setMode(mode === 'escape' ? 'unescape' : 'escape');
          }}
        >
          <Icon name="swap" className="h-4 w-4" /> Use output as input
        </Button>
      </OptionsCard>

      <p className="-mt-4 text-sm text-slate-600 dark:text-slate-400">{info.hint}</p>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label={mode === 'escape' ? 'Text' : 'Escaped text'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={14}
          placeholder={mode === 'escape' ? 'Text to escape' : 'Escaped text to decode'}
          aria-invalid={text && !result.ok ? true : undefined}
          onFileText={(t) => setInput(t)}
        />
        <div className="min-w-0 space-y-4">
          {!result.ok && text ? (
            <ErrorPanel
              title={mode === 'escape' ? 'Can’t escape' : 'Can’t unescape'}
              error={textError(text, result.offset ?? 0, result.error)}
              text={text}
              inputId={result.offset !== undefined ? INPUT_ID : undefined}
            />
          ) : (
            <OutputPanel title={mode === 'escape' ? 'Escaped' : 'Unescaped'} icon="code" text={output} fileName={mode === 'escape' ? 'escaped.txt' : 'unescaped.txt'} mime="text/plain" />
          )}
          {roundTrip !== null && (
            <p className={`flex items-center gap-2 text-sm ${roundTrip ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              <Icon name={roundTrip ? 'check' : 'warn'} className="h-4 w-4 shrink-0" />
              {roundTrip
                ? mode === 'escape'
                  ? 'Round trip checked: unescaping this gives back your text exactly.'
                  : 'Round trip checked: this text can be escaped again.'
                : 'Unescaping the output doesn’t give back the input exactly.'}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Escaping happens in your browser as you type; nothing is uploaded. For SQL, prefer query parameters, and for HTML, prefer your framework’s
        escaping — this is for when you need the literal by hand.
      </p>
    </div>
  );
}
