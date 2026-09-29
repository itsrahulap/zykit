import { useState, type ReactNode } from 'react';
import { applyTheme, getStoredTheme, type Theme } from '../../../shared/utils/theme';
import { Icon } from '../../../shared/ui/ui';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="rounded-xl p-2.5 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-white dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-900"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
    </button>
  );
}

export function Logo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge sm:h-11 sm:w-11">
      <Icon name="shield" className="h-6 w-6" />
    </span>
  );
}

export function Header() {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <a href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          <Logo />
          <span>CleanImage</span>
        </a>
        <div className="flex items-center gap-4">
          <p className="eyebrow hidden items-center gap-2 text-slate-600 sm:flex dark:text-slate-400">
            <Icon name="lock" className="h-4 w-4" /> Metadata inspector &amp; cleaner
          </p>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** Headline with a serif italic accent word. */
export function Headline({ children, accent, as: Tag = 'h1' }: { children: ReactNode; accent?: string; as?: 'h1' | 'h2' }) {
  return (
    <Tag className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
      {children}
      {accent && <em className="font-serif font-normal italic text-emerald-600 dark:text-emerald-400">{accent}</em>}
      {accent && '.'}
    </Tag>
  );
}

/** Thin status strip under the page heading. */
export function StatusStrip({ status, tone = 'neutral' }: { status: string; tone?: 'neutral' | 'busy' | 'good' }) {
  const pill = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    busy: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    good: 'bg-primary text-primary-ink',
  }[tone];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-5 dark:border-slate-800" aria-live="polite">
      <p className={`rounded-xl px-4 py-2.5 text-sm sm:text-base ${pill}`}>{status}</p>
      <p className="eyebrow flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon name="lock" className="h-3.5 w-3.5" /> Local processing
      </p>
    </div>
  );
}

export function HowItWorks() {
  const items = [
    { title: 'Nothing leaves your device', body: 'Files are read and processed by your browser in a background worker. No uploads, no server, no analytics.' },
    { title: 'No quality loss', body: 'Metadata is cut out of the file. The compressed image data is copied byte for byte, never re-encoded.' },
    { title: 'Verified output', body: 'The cleaned file is re-read and checked for leftover metadata, dimensions and decodability before you download it.' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.title} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{i.title}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{i.body}</p>
        </div>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 text-sm text-slate-600 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800 dark:text-slate-400">
        <p>CleanImage · Local file processing</p>
        <p className="max-w-xl sm:text-right">
          Removes supported embedded metadata from image files. It does not alter pixels, so it doesn't remove invisible watermarks
          and doesn't make an image “undetectable”. C2PA signatures are detected but not verified.
        </p>
      </div>
    </footer>
  );
}

export function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
      <Icon name="warn" className="h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} className="rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900" aria-label="Dismiss error">
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DetectorNote() {
  return (
    <section
      aria-labelledby="detector-note"
      className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      <Icon name="info" className="h-5 w-5 shrink-0 text-emerald-600" />
      <div>
        <h2 id="detector-note" className="font-semibold text-slate-900 dark:text-slate-100">
          Why an AI detector may still flag this image
        </h2>
        <p className="mt-1">
          CleanImage removed the metadata and Content Credentials stored in the file. AI detectors don't rely on those: they
          analyze the pixels themselves, and some generators also embed invisible watermarks (such as Google's SynthID) in the
          image content. The pixels are unchanged here, so detector results will be the same as for the original.
        </p>
      </div>
    </section>
  );
}
