import { useEffect } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router';
import { homeMeta, toolMeta } from '../config/seo';
import { SITE } from '../config/site';
import { TOOLS, toolPath } from '../tools/registry';
import type { ToolDefinition } from '../tools/types';
import { IconTile } from '../shared/ui/page';
import { ThemeToggle } from '../shared/ui/ThemeToggle';

export interface RouteHandle {
  tool?: ToolDefinition;
  title?: string;
  /** The page sets its own title and description (see useDocumentMeta). */
  pageMeta?: boolean;
}

function setMeta(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content);
}

// index.html (and the per-page HTML written at build time) ships metadata for the page that was loaded;
// keep it in sync on client-side navigation so rendered pages report their own title, description and canonical.
function usePageMeta() {
  const matches = useMatches();
  const { pathname } = useLocation();
  const handle = [...matches].reverse().find((m) => m.handle)?.handle as RouteHandle | undefined;
  const tool = handle?.tool;
  const title = handle?.title;
  const pageMeta = handle?.pageMeta;
  useEffect(() => {
    // Content pages (e.g. Learn lessons) set their own metadata via useDocumentMeta.
    if (pageMeta) return;
    const meta = tool ? toolMeta(tool) : homeMeta();
    const url = new URL(pathname, SITE.url).href;
    document.title = tool || !title ? meta.title : `${title} · ${SITE.name}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
    setMeta('meta[name="description"]', meta.description);
    setMeta('meta[property="og:title"]', document.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[property="og:url"]', url);
    // Unknown URLs still return the app with HTTP 200; keep them out of search results.
    const noindex = !tool && Boolean(title);
    let robots = document.querySelector('meta[name="robots"]');
    if (noindex && !robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.append(robots);
    }
    robots?.setAttribute('content', noindex ? 'noindex' : 'index, follow');
  }, [tool, title, pathname, pageMeta]);
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `eyebrow rounded-lg px-2 py-2 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`;

function SiteHeader() {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          <IconTile icon="grid" />
          <span>{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-4">
          <NavLink to="/" end className={navClass}>
            Tools
          </NavLink>
          <NavLink to="/learn" className={navClass}>
            Learn
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
  usePageMeta();
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
