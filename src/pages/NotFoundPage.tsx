import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="eyebrow text-slate-500">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">This page doesn&rsquo;t exist.</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">The tool may have moved, or the link is mistyped.</p>
      <Link to="/" className="mt-8 inline-block font-semibold text-emerald-700 underline underline-offset-4 dark:text-emerald-400">
        Browse all tools
      </Link>
    </div>
  );
}
