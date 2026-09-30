// Building blocks shared by the data-conversion tools (YAML, XML, CSV ↔ JSON, CSV viewer).

import { useRef, useState, type ReactNode } from 'react';
import type { DataKind } from '../../tools/types';
import { kindFromMime } from '../lib/dataKind';
import { useToolShortcuts } from '../hooks/useToolShortcuts';
import { errorSnippet, type TextError } from '../lib/textpos';
import { MAX_TEXT_FILE_BYTES, readTextFile, TextFileError } from '../lib/textFile';
import { formatBytes } from '../utils/format.utils';
import { Panel } from './Panel';
import { SendToMenu } from './SendToMenu';
import { CodeBlock, CopyButton } from './tool';
import { Icon, type IconName } from './ui';
import { downloadText, selectInTextarea } from '../utils/dom.utils';

/** Output longer than this is truncated on screen; copy and download still get all of it. */
export const MAX_PREVIEW_CHARS = 1_000_000;

export function Checkbox({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-600"
      />
      {label}
    </label>
  );
}

export function OptionsCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      {children}
    </section>
  );
}

/**
 * Syntax error with a caret snippet and a "jump to error" link. Without `inputId` the
 * error has no position (e.g. the input parsed but can't be converted): only the message shows.
 */
export function ErrorPanel({ error, text, inputId, title = 'Syntax error' }: { error: TextError; text: string; inputId?: string; title?: string }) {
  return (
    <Panel eyebrow={title} icon="warn" className="border-red-200 dark:border-red-900">
      <p className="font-medium break-words text-red-800 dark:text-red-300">{error.message}</p>
      {inputId && (
        <>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Line {error.line}, column {error.column}
          </p>
          <CodeBlock className="mt-4 whitespace-pre! break-normal! overflow-x-auto">{errorSnippet(text, error)}</CodeBlock>
        </>
      )}
      {inputId && (
        <button
          type="button"
          onClick={() => selectInTextarea(inputId, error.offset)}
          className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400"
        >
          Jump to error in input
        </button>
      )}
    </Panel>
  );
}

const toolbarButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

/**
 * Output card with copy, "Send to…" and download. Long output is previewed, not rendered in full.
 * It's the page's main output: Ctrl/⌘+Shift+C copies it and Ctrl/⌘+S downloads it.
 */
export function OutputPanel({
  title,
  icon = 'braces',
  text,
  fileName,
  mime,
  busy,
  kind,
}: {
  title: string;
  icon?: IconName;
  text: string;
  fileName: string;
  mime: string;
  busy?: boolean;
  /** What the output is, for "Send to…"; inferred from `mime` when omitted. */
  kind?: DataKind;
}) {
  const preview = text.length > MAX_PREVIEW_CHARS ? text.slice(0, MAX_PREVIEW_CHARS) : text;
  const ext = fileName.slice(fileName.lastIndexOf('.'));
  const download = () => downloadText(text, fileName, mime);
  useToolShortcuts({ getOutput: () => text, onDownload: () => text && download() });
  return (
    <section aria-label="Output" aria-busy={busy} className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
        <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Icon name={icon} className="h-4 w-4" /> {title}
        </h2>
        <div className="flex flex-wrap items-center gap-1">
          <CopyButton text={text} />
          <SendToMenu text={text} kind={kind ?? kindFromMime(mime)} disabled={busy} />
          <button type="button" disabled={!text} onClick={download} className={toolbarButton}>
            <Icon name="download" className="h-4 w-4" /> Download {ext}
          </button>
        </div>
      </header>
      <div className="p-4">
        <CodeBlock className={`max-h-[36rem] overflow-y-auto ${busy ? 'opacity-60' : ''}`}>{preview}</CodeBlock>
        {preview.length < text.length && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Showing the first {formatBytes(MAX_PREVIEW_CHARS)} of the output. Copy or download to get all of it.
          </p>
        )}
      </div>
    </section>
  );
}

export function Notices({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div role="status" className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      {items.map((w) => (
        <p key={w} className="flex gap-2 break-words">
          <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{w}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * "Open file" button backed by a hidden file input. With `onText` the file is read as text
 * (size-capped, binary refused) and a friendly error shows next to the button; `onFile`
 * hands over the raw File instead.
 */
export function OpenFileButton({
  accept,
  onFile,
  onText,
  maxBytes = MAX_TEXT_FILE_BYTES,
  label = 'Open file',
}: {
  accept: string;
  onFile?: (file: File) => void;
  onText?: (text: string, file: File) => void;
  maxBytes?: number;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const handle = (f: File) => {
    setError(null);
    if (onFile) onFile(f);
    if (onText)
      readTextFile(f, maxBytes).then(
        (t) => onText(t, f),
        (err: unknown) => setError(err instanceof TextFileError ? err.message : `Couldn't read ${f.name}.`),
      );
  };
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="file-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-field-edge hover:bg-slate-50 pointer-coarse:min-h-11 sm:px-5 sm:py-3 sm:text-base dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <Icon name="upload" className="h-4 w-4" /> {label}
      </button>
      {error && (
        <p role="alert" className="flex basis-full items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
          <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{error}</span>
        </p>
      )}
    </>
  );
}
