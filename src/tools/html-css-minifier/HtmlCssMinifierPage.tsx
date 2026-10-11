import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import htmlCssMinifier from './index';
import { beautifyCss, beautifyHtml, gzipSize, minifyCss, minifyHtml } from './features/html-css-minifier';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { Checkbox, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { utf8Length } from '../json-formatter/features/json';
import { formatBytes } from '../../shared/utils/format.utils';

type Lang = 'html' | 'css';
type Action = 'minify' | 'beautify';
type Indent = '2' | '4' | 'tab';

const MAX_INPUT_CHARS = 5_000_000;

const SAMPLES: Record<Lang, string> = {
  html: `<!DOCTYPE html>
<html>
  <head>
    <!-- page title -->
    <title>Hello</title>
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <div class="box">
      <p>Hello   <b>world</b>  !</p>
      <pre>  keep
    this  </pre>
    </div>
  </body>
</html>`,
  css: `/*! MIT license */
/* layout */
.box > p , .box a:hover {
  margin : 0 auto ;
  width : calc( 100% - 2 * 8px ) ;
  background : url( "a b.png" ) no-repeat ;
}
@media (min-width: 600px) {
  .box { padding: 1rem; }
}`,
};

function sizePct(before: number, after: number) {
  return before ? `${(((before - after) / before) * 100).toFixed(1)}%` : '0%';
}

export default function HtmlCssMinifierPage() {
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<Lang>('html');
  const [action, setAction] = useState<Action>('minify');
  const [indent, setIndent] = useState<Indent>('2');
  const [unquote, setUnquote] = useState(false);

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;

  const output = useMemo(() => {
    if (!text.trim() || tooLarge) return '';
    const unit = indent === 'tab' ? '\t' : ' '.repeat(Number(indent));
    if (lang === 'css') return action === 'minify' ? minifyCss(text) : beautifyCss(text, unit);
    return action === 'minify' ? minifyHtml(text, { unquote }) : beautifyHtml(text, unit, { unquote });
  }, [text, tooLarge, lang, action, indent, unquote]);

  const [gzip, setGzip] = useState<{ for: string; before: number | null; after: number | null } | null>(null);
  useEffect(() => {
    if (!output) return;
    let live = true;
    void Promise.all([gzipSize(text), gzipSize(output)]).then(([before, after]) => live && setGzip({ for: output + '\0' + text, before, after }));
    return () => {
      live = false;
    };
  }, [text, output]);

  const openText = (t: string, file?: File) => {
    if (file && /\.css$/i.test(file.name)) setLang('css');
    else if (file && /\.html?$/i.test(file.name)) setLang('html');
    setInput(t);
  };
  useIncomingText(htmlCssMinifier.id, (t) => setInput(t));
  useShareState(
    { input, lang, action, indent, unquote },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.lang) setLang(s.lang);
      if (s.action) setAction(s.action);
      if (s.indent) setIndent(s.indent);
      if (s.unquote !== undefined) setUnquote(s.unquote);
    },
    { lang: ['html', 'css'], action: ['minify', 'beautify'], indent: ['2', '4', 'tab'] },
  );

  const before = utf8Length(text);
  const after = utf8Length(output);
  const g = gzip && gzip.for === output + '\0' + text ? gzip : null;
  const status = tooLarge
    ? 'This input is too large to process here (limit: 5 million characters).'
    : !output
      ? `Paste ${lang.toUpperCase()} to ${action} it.`
      : `${action === 'minify' ? 'Minified' : 'Beautified'} ${lang.toUpperCase()}: ${formatBytes(before)} to ${formatBytes(after)} (${action === 'minify' ? 'saved' : 'change'} ${sizePct(before, after)}).`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={htmlCssMinifier} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="safely">Shrink HTML and CSS, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLES[lang])}>
            Try an example
          </Button>
          <OpenFileButton accept=".html,.htm,.css,text/html,text/css" onText={openText} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : output ? 'good' : 'neutral'} />

      <OptionsCard label="Options">
        <Segmented<Lang>
          label="Language"
          options={[
            { value: 'html', label: 'HTML' },
            { value: 'css', label: 'CSS' },
          ]}
          value={lang}
          onChange={setLang}
        />
        <Segmented<Action>
          label="Action"
          options={[
            { value: 'minify', label: 'Minify' },
            { value: 'beautify', label: 'Beautify' },
          ]}
          value={action}
          onChange={setAction}
        />
        {action === 'beautify' && (
          <Segmented<Indent>
            label="Indent"
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
              { value: 'tab', label: 'Tab' },
            ]}
            value={indent}
            onChange={setIndent}
          />
        )}
        {lang === 'html' && <Checkbox label="Remove attribute quotes where safe" checked={unquote} onChange={setUnquote} />}
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id="html-css-minifier-input"
          label={`Input ${lang.toUpperCase()}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder={lang === 'html' ? '<div>\n  <p>Hello</p>\n</div>' : 'a {\n  color: red;\n}'}
          onFileText={openText}
        />
        <div className="min-w-0 space-y-6">
          {output && (
            <>
              <OutputPanel
                title={lang.toUpperCase()}
                icon="code"
                text={output}
                fileName={lang === 'css' ? (action === 'minify' ? 'styles.min.css' : 'styles.css') : action === 'minify' ? 'index.min.html' : 'index.html'}
                mime={lang === 'css' ? 'text/css' : 'text/html'}
              />
              <section aria-label="Size" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Size</h2>
                <dl className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <dt className="sr-only">Measure</dt>
                  <dd className="eyebrow text-slate-600 dark:text-slate-400">&nbsp;</dd>
                  <dd className="eyebrow text-slate-600 dark:text-slate-400">Before</dd>
                  <dd className="eyebrow text-slate-600 dark:text-slate-400">After</dd>
                  <dt>Bytes</dt>
                  <dd data-testid="bytes-before">{before.toLocaleString()}</dd>
                  <dd data-testid="bytes-after">{after.toLocaleString()}</dd>
                  <dt>Gzip (estimate)</dt>
                  <dd data-testid="gzip-before">{g ? (g.before === null ? 'n/a' : g.before.toLocaleString()) : '…'}</dd>
                  <dd data-testid="gzip-after">{g ? (g.after === null ? 'n/a' : g.after.toLocaleString()) : '…'}</dd>
                </dl>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {action === 'minify' ? 'Saved' : 'Change'} {sizePct(before, after)} as bytes
                  {g && g.before !== null && g.after !== null ? `, ${sizePct(g.before, g.after)} after gzip` : ''}.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
