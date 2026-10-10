import { useDeferredValue, useMemo, useState } from 'react';
import htmlToMarkdown from './index';
import { DEFAULT_OPTIONS, htmlToMarkdown as convert, type H2mOptions } from './features/html-to-markdown';
import { Checkbox, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const SAMPLE = `<h1>Release notes</h1>
<p>Version <strong>2.0</strong> is <em>out</em>. See the <a href="https://example.com/docs" title="Docs">docs</a>.</p>
<ul><li>Faster builds<ul><li>Cached <code>node_modules</code></li></ul></li><li>New logo <img src="logo.png" alt="Logo"></li></ul>
<blockquote><p>Ship it.</p></blockquote>
<pre><code class="language-js">console.log("hi");</code></pre>
<table><tr><th>Name</th><th align="right">Qty</th></tr><tr><td>Apple</td><td align="right">3</td></tr></table>
<hr>`;

const MAX_CHARS = 5_000_000;

export default function HtmlToMarkdownPage() {
  const [input, setInput] = useState('');
  const [heading, setHeading] = useState<H2mOptions['heading']>(DEFAULT_OPTIONS.heading);
  const [bullet, setBullet] = useState<H2mOptions['bullet']>(DEFAULT_OPTIONS.bullet);
  const [fence, setFence] = useState<H2mOptions['fence']>(DEFAULT_OPTIONS.fence);
  const [pasted, setPasted] = useState(false);
  const text = useDeferredValue(input);
  const tooLarge = text.length > MAX_CHARS;

  const output = useMemo(() => {
    if (!text.trim() || tooLarge) return '';
    // The document is inert: scripts don't run and images don't load.
    return convert(new DOMParser().parseFromString(text, 'text/html'), { heading, bullet, fence });
  }, [text, tooLarge, heading, bullet, fence]);

  useIncomingText(htmlToMarkdown.id, (t) => setInput(t));
  useShareState(
    { input, heading, bullet, fence },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.heading) setHeading(s.heading);
      if (s.bullet) setBullet(s.bullet);
      if (s.fence) setFence(s.fence);
    },
    { heading: ['atx', 'setext'], bullet: ['-', '*', '+'], fence: ['```', '~~~', 'indent'] },
  );

  const status = tooLarge
    ? 'This input is too large to convert here (limit: about 5 MB).'
    : !text.trim()
      ? 'Paste HTML or rich text to convert it.'
      : `Converted · ${pluralize(output.split('\n').filter(Boolean).length, 'line')}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={htmlToMarkdown} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="Markdown">HTML to </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".html,.htm,text/html" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={output ? 'good' : 'neutral'} />

      <OptionsCard label="Conversion options">
        <Segmented<H2mOptions['heading']>
          label="Heading style"
          options={[
            { value: 'atx', label: '# ATX' },
            { value: 'setext', label: 'Underlined' },
          ]}
          value={heading}
          onChange={setHeading}
        />
        <Segmented<H2mOptions['bullet']>
          label="Bullet"
          options={[{ value: '-', label: '-' }, { value: '*', label: '*' }, { value: '+', label: '+' }]}
          value={bullet}
          onChange={setBullet}
        />
        <Segmented<H2mOptions['fence']>
          label="Code blocks"
          options={[
            { value: '```', label: '```' },
            { value: '~~~', label: '~~~' },
            { value: 'indent', label: 'Indented' },
          ]}
          value={fence}
          onChange={setFence}
        />
        <Checkbox label="Show paste area" checked={pasted} onChange={setPasted} />
      </OptionsCard>

      {pasted && (
        <div
          role="textbox"
          aria-label="Paste rich text here"
          aria-multiline="true"
          tabIndex={0}
          onPaste={(e) => {
            e.preventDefault();
            const d = e.clipboardData;
            setInput(d.getData('text/html') || d.getData('text/plain'));
          }}
          className="rounded-2xl border-2 border-dashed border-field-edge bg-white p-6 text-center text-sm text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-400"
        >
          Click here and paste formatted text (Ctrl/⌘+V). Its HTML is captured into the input.
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          label="Input HTML"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder="<h1>Hello</h1>"
          onFileText={(t) => setInput(t)}
          hint="or paste rich text via the paste area"
        />
        {output ? (
          <OutputPanel title="Markdown" icon="file" text={output} fileName="converted.md" mime="text/markdown" kind="markdown" />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">The Markdown appears here.</p>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your HTML is parsed in your browser into a detached document: scripts never run, images never load, and nothing is uploaded.
      </p>
    </div>
  );
}
