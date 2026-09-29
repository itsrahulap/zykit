import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { LEARN } from '../data';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="py-24 text-center text-slate-500 dark:text-slate-400">
      {label}
    </div>
  );
}

export function NotFoundState({ what = 'page', backTo = LEARN, backLabel = 'Back to Learn' }: { what?: string; backTo?: string; backLabel?: string }) {
  useDocumentMeta({ title: 'Not found', noindex: true });
  return (
    <div className="py-16 text-center">
      <p className="eyebrow text-slate-500">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">This {what} doesn&rsquo;t exist.</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">It may have moved, or the link is mistyped.</p>
      <Link to={backTo} className="mt-8 inline-block font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400">
        {backLabel}
      </Link>
    </div>
  );
}

export function LoadError() {
  return (
    <div role="alert" className="py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">This lesson couldn&rsquo;t be loaded.</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Check your connection and reload the page.</p>
    </div>
  );
}
