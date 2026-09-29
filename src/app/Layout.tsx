import { useEffect } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router';
import { homeMeta, toolMeta } from '../config/seo';
import { SITE } from '../config/site';
import { TOOLS, toolPath } from '../tools/registry';
import type { ToolDefinition } from '../tools/types';
import { IconTile } from '../shared/ui/page';
import { CommandPaletteProvider, SearchButton } from '../shared/ui/CommandPaletteProvider';
import { openShortcutsHelp, ShortcutsHelpHost } from '../shared/ui/ShortcutsHelpHost';
import { ThemeToggle } from '../shared/ui/ThemeToggle';
import { Icon } from '../shared/ui/ui';

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
  `eyebrow rounded-lg px-1.5 py-2 sm:px-2 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`;

function SiteHeader() {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 border-b border-slate-200 pb-6 sm:gap-x-4 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          <IconTile icon="grid" />
          <span>{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-4">
          <NavLink to="/" end className={navClass}>
            Tools
          </NavLink>
          <NavLink to="/learn" className={navClass}>
            Learn
          </NavLink>
          <NavLink to="/blog" className={navClass}>
            Blog
          </NavLink>
          <SearchButton compact className="ml-0.5 sm:ml-0" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

const footerLink = 'text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white';
const footerHeading = 'eyebrow mb-3 text-slate-900 dark:text-slate-100';

function GitHubMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Tool links grouped by category: big categories get their own column, small ones share one. */
function toolColumns() {
  const tools = TOOLS.filter((t) => t.status !== 'coming-soon');
  const groups = [...new Set(tools.map((t) => t.category))].map((category) => ({ category, tools: tools.filter((t) => t.category === category) }));
  const big = groups.filter((g) => g.tools.length > 4);
  const small = groups.filter((g) => g.tools.length <= 4);
  return [...big.map((g) => [g]), ...(small.length ? [small] : [])];
}

const YEAR = new Date().getFullYear();

function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 text-sm lg:grid-cols-[minmax(0,1.3fr)_minmax(0,3fr)]">
          <div className="max-w-sm space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              <IconTile icon="grid" />
              {SITE.name}
            </Link>
            <p className="text-slate-600 dark:text-slate-400">{SITE.description}</p>
            <ul className="flex flex-wrap gap-2" aria-label="Privacy">
              {['No uploads', 'No tracking', 'Open source'].map((p) => (
                <li key={p} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-ink">
                  {p}
                </li>
              ))}
            </ul>
            <a
              href={SITE.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
            >
              <GitHubMark className="h-4 w-4" /> Star on GitHub
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <nav aria-label="Tools" className="contents">
              {toolColumns().map((column) => (
                <div key={column[0].category} className="space-y-6">
                  {column.map((g) => (
                    <div key={g.category}>
                      <p className={footerHeading}>{g.category}</p>
                      <ul className="space-y-2">
                        {g.tools.map((t) => (
                          <li key={t.id}>
                            <Link to={toolPath(t)} className={footerLink}>
                              {t.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </nav>
            <nav aria-label="Explore">
              <p className={footerHeading}>Explore</p>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className={footerLink}>
                    All tools
                  </Link>
                </li>
                <li>
                  <Link to="/learn" className={footerLink}>
                    Learn
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className={footerLink}>
                    Blog
                  </Link>
                </li>
                <li>
                  <a href={`${SITE.repo}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer" className={footerLink}>
                    Contribute
                  </a>
                </li>
                <li>
                  <a href={`${SITE.repo}/issues/new/choose`} target="_blank" rel="noreferrer" className={footerLink}>
                    Report an issue
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400">
          <p>
            © {YEAR} {SITE.name} ·{' '}
            <a href={`${SITE.repo}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-slate-900 hover:underline dark:hover:text-white">
              MIT licensed
            </a>
          </p>
          <button type="button" onClick={openShortcutsHelp} aria-keyshortcuts="?" className="self-start hover:text-slate-900 hover:underline pointer-coarse:min-h-11 sm:self-auto dark:hover:text-white">
            Keyboard shortcuts
          </button>
          <p className="flex items-center gap-1.5">
            <Icon name="lock" className="h-3.5 w-3.5" /> Everything runs in your browser. Your files never leave your device.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  usePageMeta();
  return (
    <CommandPaletteProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Outlet />
        </main>
        <SiteFooter />
        <ShortcutsHelpHost />
        <ScrollRestoration />
      </div>
    </CommandPaletteProvider>
  );
}
