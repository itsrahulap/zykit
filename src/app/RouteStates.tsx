import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950" role="status">
      Loading…
    </div>
  );
}

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center" role="alert">
      <h1 className="text-3xl font-bold tracking-tight">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p className="mt-3 text-slate-600">
        {notFound ? "This page doesn't exist." : "This tool couldn't be loaded. Check your connection and reload the page."}
      </p>
      <Link to="/" className="mt-6 inline-block font-semibold text-emerald-700 underline underline-offset-4">
        Back to all tools
      </Link>
    </div>
  );
}
