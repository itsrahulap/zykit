import { useEffect } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router';
import { SITE } from '../config/site';
import { TOOLS, toolPath } from '../tools/registry';
import type { ToolDefinition } from '../tools/types';
import { IconTile } from '../shared/ui/page';
import { ThemeToggle } from '../shared/ui/ThemeToggle';

export interface RouteHandle {
  tool?: ToolDefinition;
  title?: string;
}

function usePageTitle() {
  const matches = useMatches();
  const handle = [...matches].reverse().find((m) => m.handle)?.handle as RouteHandle | undefined;
  const title = handle?.tool?.name ?? handle?.title;
  useEffect(() => {
    document.title = title ? `${title} · ${SITE.name}` : `${SITE.name} · ${SITE.tagline}`;
  }, [title]);
}

// index.html ships a canonical for "/"; point it at the current route so tool pages aren't treated as duplicates.
function useCanonical() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', new URL(pathname, SITE.url).href);
  }, [pathname]);
}

function SiteHeader() {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          <IconTile icon="grid" />
          <span>{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `eyebrow rounded-lg px-2 py-2 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`
            }
          >
            All tools
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-6 border-t border-slate-200 pt-8 text-sm text-slate-600 sm:flex-row sm:justify-between dark:border-slate-800 dark:text-slate-400">
        <div className="max-w-md">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{SITE.name}</p>
          <p className="mt-1">{SITE.description}</p>
        </div>
        <nav aria-label="Tools">
          <p className="eyebrow mb-2 text-slate-500">Tools</p>
          <ul className="space-y-1">
            {TOOLS.filter((t) => t.status !== 'coming-soon').map((t) => (
              <li key={t.id}>
                <Link to={toolPath(t)} className="hover:text-slate-900 hover:underline dark:hover:text-white">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function Layout() {
  usePageTitle();
  useCanonical();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
