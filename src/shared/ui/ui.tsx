import type { ReactNode } from 'react';

export function Card({ title, subtitle, action, children, className = '' }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

type Tone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'violet';

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
  red: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary:
      'bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge hover:bg-primary-hover disabled:bg-slate-200 disabled:ring-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400',
    secondary:
      'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 sm:py-3 sm:text-base disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export type IconName =
  | 'shield' | 'upload' | 'check' | 'warn' | 'x' | 'minus' | 'download' | 'info' | 'sparkle' | 'lock' | 'sun' | 'moon'
  | 'grid' | 'arrow' | 'image' | 'key' | 'diff' | 'code' | 'braces' | 'hash' | 'swap' | 'copy' | 'play' | 'stop';

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    shield: <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z M9 12l2 2 4-4" />,
    upload: <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    warn: <path d="M12 9v4m0 3.5v.01M10.3 3.9L2.5 17.5A2 2 0 004.2 20.5h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    minus: <path d="M6 12h12" />,
    download: <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />,
    info: <path d="M12 8h.01M11 12h1v5h1M12 21a9 9 0 100-18 9 9 0 000 18z" />,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />,
    lock: <path d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z" />,
    sun: <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66l1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14l-1.41-1.41M12 16a4 4 0 100-8 4 4 0 000 8z" />,
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    arrow: <path d="M7 17L17 7M9 7h8v8" />,
    image: <path d="M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15 9.5a1.5 1.5 0 100-.01" />,
    moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
    key: <path d="M14.5 13.5a5 5 0 10-4-4L3 17v4h4v-2h2v-2h2l3.5-3.5z M16.5 7.5v.01" />,
    diff: <path d="M6 3v12M6 15a3 3 0 100 6 3 3 0 000-6zM18 21V9M18 9a3 3 0 100-6 3 3 0 000 6zM6 9h6M12 15h6" />,
    code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
    braces: <path d="M8 3H7a2 2 0 00-2 2v4a2 2 0 01-2 2v2a2 2 0 012 2v4a2 2 0 002 2h1M16 3h1a2 2 0 012 2v4a2 2 0 002 2v2a2 2 0 00-2 2v4a2 2 0 01-2 2h-1" />,
    hash: <path d="M10 3L8 21M16 3l-2 18M4 8.5h17M3 15.5h17" />,
    swap: <path d="M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7" />,
    copy: <path d="M9 9h11v11H9z M5 15H4V4h11v1" />,
    play: <path d="M7 4.5v15l12-7.5-12-7.5z" />,
    stop: <path d="M6 6h12v12H6z" />,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
