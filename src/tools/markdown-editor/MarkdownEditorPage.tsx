import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import markdownEditor from './index';
import { applyEdit, insertTable, link, linePrefix, wrap, type Edit } from './features/editing';
import { countText, documentTitle, standaloneHtml } from './features/markdown';
import { loadRenderer, type Renderer } from './features/sanitize';
import { Notices, OpenFileButton } from '../../shared/ui/convert';
import { DropZone } from '../../shared/ui/DropZone';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';
import { pluralize } from '../../shared/utils/format.utils';

const STORAGE_KEY = 'zykit-markdown';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const EDITOR_ID = 'markdown-input';

const WELCOME = `# Welcome to the Markdown editor

Write on the left, see the result on the right. Your draft is saved **in this browser** only.

## What works

- *Emphasis*, **bold**, ~~strikethrough~~ and \`inline code\`
- Links like [Zykit](https://zykit.dev) and autolinks: www.example.com
- [x] Task lists
- [ ] Tables, quotes and code blocks

| Feature | Supported |
| :------ | :-------: |
| Tables  | Yes       |
| Anchors | [Jump](#what-works) |

> Tip: select text and press Ctrl+B, Ctrl+I or Ctrl+K.

\`\`\`js
console.log('Hello');
\`\`\`
`;

function loadDraft(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? WELCOME;
  } catch {
    return WELCOME;
  }
}

const toolButton =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 pointer-coarse:h-11 pointer-coarse:min-w-11 dark:text-slate-300 dark:hover:bg-slate-800';
const smallButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

type MakeEdit = (text: string, start: number, end: number) => Edit;

const TOOLS: { label: string; title: string; make: MakeEdit; className?: string }[] = [
  { label: 'B', title: 'Bold (Ctrl+B)', make: (t, s, e) => wrap(t, s, e, '**', '**', 'bold text') },
  { label: 'I', title: 'Italic (Ctrl+I)', make: (t, s, e) => wrap(t, s, e, '_', '_', 'italic text'), className: 'italic font-serif' },
  { label: '</>', title: 'Inline code', make: (t, s, e) => wrap(t, s, e, '`', '`', 'code'), className: 'font-mono text-xs' },
  { label: 'Link', title: 'Link (Ctrl+K)', make: link },
  { label: 'H', title: 'Heading', make: (t, s, e) => linePrefix(t, s, e, '## ') },
  { label: '•', title: 'Bulleted list', make: (t, s, e) => linePrefix(t, s, e, '- ') },
  { label: '1.', title: 'Numbered list', make: (t, s, e) => linePrefix(t, s, e, '', true) },
  { label: '❝', title: 'Quote', make: (t, s, e) => linePrefix(t, s, e, '> ') },
  { label: 'Table', title: 'Insert table', make: insertTable },
];

export default function MarkdownEditorPage() {
  const [text, setText] = useState(loadDraft);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    loadRenderer().then(
      (r) => live && setRenderer(r),
      () => live && setError('The Markdown renderer failed to load. Reload the page to try again.'),
    );
    return () => {
      live = false;
    };
  }, []);

  // Save the draft shortly after typing stops.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, text);
      } catch {
        // Storage full or disabled: the draft just isn't kept.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [text]);

  const source = useDeferredValue(text);
  const rendered = useMemo(() => (renderer ? renderer.render(source) : null), [renderer, source]);
  const counts = useMemo(() => countText(source), [source]);

  const apply = (make: MakeEdit) => {
    const el = ref.current;
    if (!el) return;
    const e = make(el.value, el.selectionStart, el.selectionEnd);
    const expected = applyEdit(el.value, e);
    el.focus();
    el.setSelectionRange(e.from, e.to);
    // execCommand keeps the browser's undo history; fall back to setting the value.
    let ok = false;
    try {
      ok = e.insert ? document.execCommand('insertText', false, e.insert) : document.execCommand('delete');
    } catch {
      ok = false;
    }
    if (!ok || el.value !== expected) {
      setText(expected);
      requestAnimationFrame(() => ref.current?.setSelectionRange(e.selStart, e.selEnd));
    } else el.setSelectionRange(e.selStart, e.selEnd);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const k = e.key.toLowerCase();
    const tool = k === 'b' ? TOOLS[0] : k === 'i' ? TOOLS[1] : k === 'k' ? TOOLS[3] : null;
    if (!tool) return;
    e.preventDefault();
    apply(tool.make);
  };

  const openText = (t: string) => setText(t);

  const html = rendered?.html ?? '';
  const downloadMd = () => downloadText(text, 'document.md', 'text/markdown');

  useIncomingText(markdownEditor.id, (t) => setText(t));
  useToolShortcuts({ getOutput: () => (renderer ? html : ''), onDownload: () => text && downloadMd() });
  useShareState({ text }, (s) => {
    if (s.text !== undefined) setText(s.text);
  });
  const status = !renderer ? (error ? 'Renderer unavailable.' : 'Loading the Markdown renderer…') : `${pluralize(counts.words, 'word')} · ${pluralize(counts.chars, 'character')}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={markdownEditor} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="preview">Markdown, with a live </Headline>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".md,.markdown,.mdown,.txt,text/markdown,text/plain" onText={openText} maxBytes={MAX_FILE_BYTES} label="Open .md" />
          <Button variant="secondary" onClick={() => setText(WELCOME)}>
            Example
          </Button>
          <Button variant="ghost" disabled={!text} onClick={() => setText('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={!renderer || source !== text ? 'busy' : 'good'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <div className="lg:hidden">
        <Segmented<'edit' | 'preview'>
          label="View"
          options={[
            { value: 'edit', label: 'Edit' },
            { value: 'preview', label: 'Preview' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section
          aria-label="Editor"
          className={`min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${tab === 'edit' ? '' : 'hidden'} lg:block`}
        >
          <div role="toolbar" aria-label="Formatting" aria-controls={EDITOR_ID} className="flex flex-wrap gap-0.5 border-b border-slate-100 px-2 py-2 dark:border-slate-800">
            {TOOLS.map((t) => (
              <button
                key={t.title}
                type="button"
                title={t.title}
                aria-label={t.title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(t.make)}
                className={`${toolButton} ${t.className ?? ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <DropZone onText={openText} maxBytes={MAX_FILE_BYTES}>
            <label htmlFor={EDITOR_ID} className="sr-only">
              Markdown
            </label>
            <textarea
              id={EDITOR_ID}
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={24}
              spellCheck
              placeholder="# Start writing…"
              className="block h-[32rem] w-full resize-y rounded-b-3xl bg-transparent p-4 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-slate-100 lg:h-[40rem]"
            />
          </DropZone>
        </section>

        <section
          aria-label="Preview"
          className={`min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${tab === 'preview' ? '' : 'hidden'} lg:block`}
        >
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="file" className="h-4 w-4" /> Preview
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <CopyButton text={html} label="Copy HTML" disabled={!renderer} />
              <SendToMenu text={text} kind="markdown" />
              <button type="button" aria-label="Download .md" className={smallButton} disabled={!text} onClick={downloadMd}>
                <Icon name="download" className="h-4 w-4" /> .md
              </button>
              <button
                type="button"
                aria-label="Download .html"
                className={smallButton}
                disabled={!renderer || !text}
                onClick={() => downloadText(standaloneHtml(documentTitle(text), html), 'document.html', 'text/html')}
              >
                <Icon name="download" className="h-4 w-4" /> .html
              </button>
            </div>
          </header>
          <div className="h-[32rem] overflow-auto p-4 sm:p-6 lg:h-[40rem]">
            {rendered ? (
              <div className="md-preview" data-testid="md-preview" dangerouslySetInnerHTML={{ __html: rendered.html }} />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{error ? 'Preview unavailable.' : 'Loading preview…'}</p>
            )}
          </div>
        </section>
      </div>

      {rendered && rendered.blockedImages > 0 && (
        <Notices
          items={[
            `${pluralize(rendered.blockedImages, 'remote image was', 'remote images were')} not loaded. This site blocks outside requests, so only embedded (data:) images show in the preview; the exported .md keeps the links.`,
          ]}
        />
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Everything stays in your browser. The preview is sanitized: scripts, iframes, forms, inline styles and event handlers are removed, links open in a new
        tab, and remote images don&rsquo;t load.
      </p>
    </div>
  );
}
