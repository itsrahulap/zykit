// Build step for search engines and link previews. The app is a single-page app, so without this every URL
// serves the same index.html. After `vite build` it writes, from the tool registry:
//   dist/index.html            home page metadata, JSON-LD and a static tool list inside #root
//   dist/tools/<id>.html       one page per tool with its own title, description, canonical, OG tags,
//                              JSON-LD and readable content (served at /tools/<id> via the rewrites in vercel.json)
//   dist/learn/**.html         every Learn page (subjects, lessons, problems, case studies) with its full text
//                              (see scripts/learn-pages.ts)
//   dist/blog.html             the blog home, plus dist/blog/<slug>.html per post (src/blog/html.ts)
//   dist/sitemap.xml
// React replaces the static #root content when it mounts, so users see the normal app.

import { existsSync } from 'node:fs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { runnerImport, type Plugin, type ResolvedConfig } from 'vite';
import { learnPages, type LearnSources } from './learn-pages.ts';

interface Tool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
}
interface Meta {
  title: string;
  description: string;
  url: string;
}
/** Mirrors ToolDocs in src/tools/types.ts (not imported: that file pulls in .tsx UI types). */
interface ToolDocsData {
  howToUse: string[];
  howItWorks: string;
  limits: string[];
  privacy: string;
  faqs: { question: string; answer: string }[];
}
interface DocsHtmlModule {
  toolDocsHtml(name: string, docs: ToolDocsData): string;
}
interface SeoModule {
  homeMeta(): Meta;
  toolMeta(tool: Tool): Meta;
  homeStructuredData(tools: Tool[]): unknown;
  toolStructuredData(tool: Tool): unknown;
  toolPageStructuredData(tool: Tool, docs?: ToolDocsData): unknown;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// JSON inside <script> must not be able to close the tag.
const jsonLd = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function replaceOrThrow(html: string, pattern: RegExp, value: string) {
  if (!pattern.test(html)) throw new Error(`seo-plugin: index.html is missing ${pattern}`);
  return html.replace(pattern, value);
}

function renderPage(template: string, meta: Meta, structuredData: unknown, body: string) {
  let html = template;
  html = replaceOrThrow(html, /<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = replaceOrThrow(html, /(<meta name="description" content=")[^"]*/, `$1${esc(meta.description)}`);
  html = replaceOrThrow(html, /(<link rel="canonical" href=")[^"]*/, `$1${esc(meta.url)}`);
  html = replaceOrThrow(html, /(<meta property="og:title" content=")[^"]*/, `$1${esc(meta.title)}`);
  html = replaceOrThrow(html, /(<meta property="og:description" content=")[^"]*/, `$1${esc(meta.description)}`);
  html = replaceOrThrow(html, /(<meta property="og:url" content=")[^"]*/, `$1${esc(meta.url)}`);
  html = replaceOrThrow(html, /<\/head>/, `  ${jsonLd(structuredData)}\n  </head>`);
  return replaceOrThrow(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`);
}

const toolLinks = (tools: Tool[]) =>
  `<ul>${tools.map((t) => `<li><a href="/tools/${t.id}">${esc(t.name)}</a>: ${esc(t.tagline)}</li>`).join('')}</ul>`;

function homeBody(tools: Tool[], meta: Meta) {
  return `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6"><h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p>${toolLinks(tools)}</main>`;
}

function toolBody(tool: Tool, tools: Tool[], docsHtml = '') {
  const others = tools.filter((t) => t.id !== tool.id);
  return (
    `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6"><p><a href="/">All tools</a></p>` +
    `<h1>${esc(tool.name)}</h1><p>${esc(tool.tagline)}</p><p>${esc(tool.description)}</p>` +
    `<ul>${tool.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` +
    `${docsHtml}<h2>More tools</h2>${toolLinks(others)}</main>`
  );
}

interface BlogModule {
  blogPages(): { file: string; path: string; post?: unknown }[];
  blogHomeHtml(title: string, description: string): string;
  postHtml(post: unknown): string;
}
interface BlogSeoModule {
  blogHomeMeta(): { title: string; description: string };
  postMeta(post: unknown): { title: string; description: string };
  blogStructuredData(): unknown;
  postStructuredData(post: unknown): unknown;
}

function sitemap(urls: string[]) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function seoPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'zykit-seo',
    apply: 'build',
    configResolved(c) {
      config = c;
    },
    async closeBundle(error?: Error) {
      // If the bundle failed there's no dist/index.html; skip so Vite reports the real error instead of an ENOENT.
      if (error) return;
      const root = config.root;
      const outDir = resolve(root, config.build.outDir);
      const opts = { root, configFile: false as const, logLevel: 'error' as const };
      const load = <T>(path: string) => runnerImport<T>(join(root, path), opts).then((r) => r.module);
      const [seo, registry, site, content, problems, caseStudies, learnSeo, html] = await Promise.all([
        load<SeoModule>('src/config/seo.ts'),
        load<{ TOOLS: Tool[] }>('src/tools/registry.ts'),
        load<{ SITE: LearnSources['site'] }>('src/config/site.ts'),
        load<{ subjects: LearnSources['subjects'] }>('src/learn/content/index.ts'),
        load<{ allProblems: LearnSources['problems']; problemCategories: LearnSources['categories'] }>('src/learn/content/problems/index.ts'),
        load<{ caseStudies: LearnSources['caseStudies'] }>('src/learn/content/case-studies/index.ts'),
        load<LearnSources['seo']>('src/learn/seo.ts'),
        load<LearnSources['html']>('src/learn/features/richTextHtml.ts'),
      ]);
      const learn = learnPages({
        site: site.SITE,
        subjects: content.subjects,
        problems: problems.allProblems,
        categories: problems.problemCategories,
        caseStudies: caseStudies.caseStudies,
        seo: learnSeo,
        html,
      });
      const learnMeta = (p: (typeof learn)[number]): Meta => ({ title: `${p.meta.title} · ${site.SITE.name}`, description: p.meta.description, url: `${site.SITE.url}${p.path}` });
      const tools = registry.TOOLS.filter((t) => t.status !== 'coming-soon');
      const template = await readFile(join(outDir, 'index.html'), 'utf8').catch(() => null);
      if (template === null) {
        config.logger.warn('seo: dist/index.html not found (did the build fail?), skipping page generation');
        return;
      }
      // Each tool's user docs (src/tools/<id>/docs.ts), for its static page and FAQ structured data.
      const docsHtml = await load<DocsHtmlModule>('src/tools/docsHtml.ts');
      const docs = new Map<string, ToolDocsData>();
      for (const t of tools) {
        if (existsSync(join(root, 'src/tools', t.id, 'docs.ts'))) docs.set(t.id, (await load<{ default: ToolDocsData }>(`src/tools/${t.id}/docs.ts`)).default);
      }
      const docsFor = (t: Tool) => {
        const d = docs.get(t.id);
        return d ? docsHtml.toolDocsHtml(t.name, d) : '';
      };
      const [blog, blogSeo] = await Promise.all([load<BlogModule>('src/blog/html.ts'), load<BlogSeoModule>('src/blog/seo.ts')]);
      const blogPages = blog.blogPages().map((b) => {
        const m = b.post ? blogSeo.postMeta(b.post) : blogSeo.blogHomeMeta();
        const meta: Meta = { title: `${m.title} · ${site.SITE.name}`, description: m.description, url: `${site.SITE.url}${b.path}` };
        const html = b.post
          ? renderPage(template, meta, blogSeo.postStructuredData(b.post), blog.postHtml(b.post))
          : renderPage(template, meta, blogSeo.blogStructuredData(), blog.blogHomeHtml(m.title, m.description));
        return { file: b.file, meta, html };
      });

      const home = seo.homeMeta();
      const pages: [string, string][] = [
        ['index.html', renderPage(template, home, seo.homeStructuredData(tools), homeBody(tools, home))],
        ...tools.map((t): [string, string] => [
          `tools/${t.id}.html`,
          renderPage(template, seo.toolMeta(t), seo.toolPageStructuredData(t, docs.get(t.id)), toolBody(t, tools, docsFor(t))),
        ]),
        ...learn.map((p): [string, string] => [p.file, renderPage(template, learnMeta(p), p.structuredData, p.body)]),
        ...blogPages.map((b): [string, string] => [b.file, b.html]),
      ];
      for (const [file, page] of pages) {
        await mkdir(dirname(join(outDir, file)), { recursive: true });
        await writeFile(join(outDir, file), page);
      }
      await writeFile(join(outDir, 'sitemap.xml'), sitemap([home.url, ...tools.map((t) => seo.toolMeta(t).url), ...learn.map((p) => learnMeta(p).url), ...blogPages.map((b) => b.meta.url)]));
      config.logger.info(`seo: wrote ${pages.length} pages and sitemap.xml`);
    },
  };
}
