// Build step for search engines and link previews. The app is a single-page app, so without this every URL
// serves the same index.html. After `vite build` it writes, from the tool registry:
//   dist/index.html            home page metadata, JSON-LD and a static tool list inside #root
//   dist/tools/<id>.html       one page per tool with its own title, description, canonical, OG tags,
//                              JSON-LD and readable content (served at /tools/<id>; see vercel.json cleanUrls)
//   dist/learn/**.html         every Learn page (subjects, lessons, problems, case studies) with its full text
//                              (see scripts/learn-pages.ts)
//   dist/claude-code.html      the Claude Code section: overview plus claude-code/<plugin-id>.html per plugin
//                              (src/pages/claude-code/plugins.ts)
//   dist/sitemap.xml
// React replaces the static #root content when it mounts, so users see the normal app.

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
interface SeoModule {
  homeMeta(): Meta;
  toolMeta(tool: Tool): Meta;
  homeStructuredData(tools: Tool[]): unknown;
  toolStructuredData(tool: Tool): unknown;
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

function toolBody(tool: Tool, tools: Tool[]) {
  const others = tools.filter((t) => t.id !== tool.id);
  return (
    `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6"><p><a href="/">All tools</a></p>` +
    `<h1>${esc(tool.name)}</h1><p>${esc(tool.tagline)}</p><p>${esc(tool.description)}</p>` +
    `<ul>${tool.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` +
    `<h2>More tools</h2>${toolLinks(others)}</main>`
  );
}

interface ClaudeCodePlugin {
  id: string;
  name: string;
  tagline: string;
  marketplace: string;
  purpose: string;
  howItWorks: string[];
  howToUse: string;
  commands?: string[];
  prompts: string[];
  useCases: string[];
  whenNotToUse: string;
  caveat?: string;
}
interface ClaudeCodeModule {
  CLAUDE_CODE_PATH: string;
  PLUGINS: ClaudeCodePlugin[];
  PARTS: { name: string; text: string }[];
  LIFECYCLE: { step: string; text: string }[];
  installCommands(prefix: string): string[];
  pluginInstallCommands(p: ClaudeCodePlugin, prefix: string): string[];
  pluginPath(p: ClaudeCodePlugin): string;
  claudeCodeMeta(): { title: string; description: string };
  pluginMeta(p: ClaudeCodePlugin): { title: string; description: string };
}

const list = (items: string[]) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

function claudeCodeBody(cc: ClaudeCodeModule, meta: Meta) {
  const plugins = cc.PLUGINS.map((p) => `<li><a href="${cc.pluginPath(p)}">${esc(p.name)}</a>: ${esc(p.tagline)}. ${esc(p.purpose)}</li>`).join('');
  return (
    `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6"><h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p>` +
    `<h2>What is a plugin?</h2><ul>${cc.PARTS.map((p) => `<li><strong>${esc(p.name)}</strong>: ${esc(p.text)}</li>`).join('')}</ul>` +
    `<h2>How it works</h2><ol>${cc.LIFECYCLE.map((l) => `<li><strong>${esc(l.step)}</strong>: ${esc(l.text)}</li>`).join('')}</ol>` +
    `<h2>Install</h2><pre>${esc(cc.installCommands('/plugin').join('\n'))}</pre>` +
    `<h2>The plugins</h2><ul>${plugins}</ul></main>`
  );
}

function pluginBody(cc: ClaudeCodeModule, p: ClaudeCodePlugin) {
  return (
    `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6"><p><a href="${cc.CLAUDE_CODE_PATH}">Claude Code</a></p>` +
    `<h1>${esc(p.name)}</h1><p>${esc(p.tagline)}</p><p>${esc(p.purpose)}</p>` +
    `<h2>How it works</h2>${p.howItWorks.map((x) => `<p>${esc(x)}</p>`).join('')}` +
    `<h2>Install</h2><pre>${esc(cc.pluginInstallCommands(p, '/plugin').join('\n'))}</pre>` +
    `<h2>How to use</h2><p>${esc(p.howToUse)}</p>${p.commands ? list(p.commands) : ''}${list(p.prompts)}` +
    `<h2>Use cases</h2>${list(p.useCases)}<h2>When not to use it</h2><p>${esc(p.whenNotToUse)}</p>` +
    `${p.caveat ? `<p>${esc(p.caveat)}</p>` : ''}</main>`
  );
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
    async closeBundle() {
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
      const cc = await load<ClaudeCodeModule>('src/pages/claude-code/plugins.ts');
      const ccPage = (path: string, m: { title: string; description: string }): Meta => ({
        title: `${m.title} · ${site.SITE.name}`,
        description: m.description,
        url: `${site.SITE.url}${path}`,
      });
      const ccMeta = ccPage(cc.CLAUDE_CODE_PATH, cc.claudeCodeMeta());
      const ccPages = cc.PLUGINS.map((p) => ({ plugin: p, meta: ccPage(cc.pluginPath(p), cc.pluginMeta(p)) }));
      const techArticle = (m: Meta) => ({ '@context': 'https://schema.org', '@type': 'TechArticle', headline: m.title, description: m.description, url: m.url });
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
      const template = await readFile(join(outDir, 'index.html'), 'utf8');

      const home = seo.homeMeta();
      const pages: [string, string][] = [
        ['index.html', renderPage(template, home, seo.homeStructuredData(tools), homeBody(tools, home))],
        ...tools.map((t): [string, string] => [
          `tools/${t.id}.html`,
          renderPage(template, seo.toolMeta(t), seo.toolStructuredData(t), toolBody(t, tools)),
        ]),
        ...learn.map((p): [string, string] => [p.file, renderPage(template, learnMeta(p), p.structuredData, p.body)]),
        [`${cc.CLAUDE_CODE_PATH.slice(1)}.html`, renderPage(template, ccMeta, techArticle(ccMeta), claudeCodeBody(cc, ccMeta))],
        ...ccPages.map(({ plugin, meta }): [string, string] => [
          `${cc.pluginPath(plugin).slice(1)}.html`,
          renderPage(template, meta, techArticle(meta), pluginBody(cc, plugin)),
        ]),
      ];
      for (const [file, page] of pages) {
        await mkdir(dirname(join(outDir, file)), { recursive: true });
        await writeFile(join(outDir, file), page);
      }
      await writeFile(join(outDir, 'sitemap.xml'), sitemap([home.url, ...tools.map((t) => seo.toolMeta(t).url), ...learn.map((p) => learnMeta(p).url), ccMeta.url, ...ccPages.map((p) => p.meta.url)]));
      config.logger.info(`seo: wrote ${pages.length} pages and sitemap.xml`);
    },
  };
}
