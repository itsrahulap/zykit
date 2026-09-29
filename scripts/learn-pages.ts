// Static HTML bodies for every Learn page, written at build time by scripts/seo-plugin.ts.
// Crawlers and link previews get the real lesson text; React replaces #root when it mounts.

import type { Subject, Topic } from '../src/learn/types/content.ts';
import type { Problem, ProblemCategory } from '../src/learn/types/problem.ts';
import type { CaseStudy } from '../src/learn/types/caseStudy.ts';
import type { LearnMeta } from '../src/learn/seo.ts';

export interface LearnSources {
  site: { name: string; url: string };
  subjects: Subject[];
  problems: Problem[];
  categories: ProblemCategory[];
  caseStudies: CaseStudy[];
  seo: typeof import('../src/learn/seo.ts');
  html: typeof import('../src/learn/features/richTextHtml.ts');
}

export interface LearnPage {
  /** Output file relative to dist/, e.g. "learn/javascript/closures.html". */
  file: string;
  path: string;
  meta: LearnMeta;
  structuredData: unknown;
  body: string;
}

export function learnPages(src: LearnSources): LearnPage[] {
  const { site, seo } = src;
  const { escapeHtml: esc, richTextToHtml: rich, plainText } = src.html;
  const abs = (path: string) => `${site.url}${path}`;
  const link = (path: string, label: string) => `<a href="${esc(path)}">${esc(label)}</a>`;
  const section = (title: string, html: string) => (html ? `<section><h2>${esc(title)}</h2>${html}</section>` : '');
  const pre = (code: string) => `<pre><code>${esc(code)}</code></pre>`;
  const main = (crumbs: [string, string][], inner: string) =>
    `<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6"><nav aria-label="Breadcrumb">${crumbs.map(([p, l]) => link(p, l)).join(' / ')}</nav>${inner}</main>`;
  const breadcrumbs = (items: [string, string][]) => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([path, name], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  });
  const article = (path: string, meta: LearnMeta, crumbs: [string, string][], extra: Record<string, unknown> = {}) => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: meta.title,
        description: meta.description,
        url: abs(path),
        inLanguage: 'en',
        isAccessibleForFree: true,
        isPartOf: { '@type': 'WebSite', name: site.name, url: `${site.url}/` },
        ...extra,
      },
      breadcrumbs(crumbs),
    ],
  });
  const itemList = (path: string, meta: LearnMeta, crumbs: [string, string][], items: [string, string][]) => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: meta.title,
        description: meta.description,
        url: abs(path),
        mainEntity: { '@type': 'ItemList', itemListElement: items.map(([p, name], i) => ({ '@type': 'ListItem', position: i + 1, name, url: abs(p) })) },
      },
      breadcrumbs(crumbs),
    ],
  });

  const pages: LearnPage[] = [];
  const add = (path: string, meta: LearnMeta, structuredData: unknown, body: string) =>
    pages.push({ file: `${path.slice(1)}.html`, path, meta, structuredData, body });

  const learnCrumb: [string, string] = ['/learn', 'Learn'];
  const home: [string, string] = ['/', site.name];

  // /learn
  {
    const meta = seo.learnHomeMeta();
    const items = src.subjects.map((s): [string, string] => [`/learn/${s.id}`, s.title]);
    add(
      '/learn',
      meta,
      itemList('/learn', meta, [home, learnCrumb], items),
      main(
        [home],
        `<h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p><ul>${src.subjects
          .map((s) => `<li>${link(`/learn/${s.id}`, s.title)}: ${esc(s.description)}</li>`)
          .join('')}<li>${link('/learn/problems', 'DSA practice problems')}</li><li>${link('/learn/case-studies', 'System design case studies')}</li></ul>`,
      ),
    );
  }

  // Subjects and topics
  for (const s of src.subjects) {
    const sMeta = seo.subjectMetaFor({ ...s, topics: s.topics.map(topicMeta) });
    const sPath = `/learn/${s.id}`;
    const levels = ['beginner', 'intermediate', 'advanced'] as const;
    add(
      sPath,
      sMeta,
      itemList(sPath, sMeta, [home, learnCrumb, [sPath, s.title]], s.topics.map((t) => [`${sPath}/${t.id}`, t.title])),
      main(
        [home, learnCrumb],
        `<h1>${esc(s.title)}</h1><p>${esc(s.description)}</p>` +
          levels
            .map((lvl) => {
              const ts = s.topics.filter((t) => t.level === lvl);
              return ts.length ? section(lvl[0].toUpperCase() + lvl.slice(1), `<ol>${ts.map((t) => `<li>${link(`${sPath}/${t.id}`, t.title)}: ${esc(t.description)}</li>`).join('')}</ol>`) : '';
            })
            .join(''),
      ),
    );

    s.topics.forEach((t, i) => {
      const path = `${sPath}/${t.id}`;
      const meta = seo.topicMetaFor({ ...s, topics: [] }, topicMeta(t));
      const crumbs: [string, string][] = [home, learnCrumb, [sPath, s.title], [path, t.title]];
      const prev = s.topics[i - 1];
      const next = s.topics[i + 1];
      const examples = t.examples
        .map((e) => `${e.title ? `<h3>${esc(e.title)}</h3>` : ''}${pre(e.code)}${e.explanation ? rich(e.explanation) : ''}`)
        .join('');
      const body =
        `<article><h1>${esc(t.title)}</h1><p>${esc(t.description)}</p>` +
        section('What is it?', rich(t.explanation)) +
        section("Explain like I'm 10", rich(t.analogy)) +
        section('Examples', examples) +
        section('How it works', rich(t.howItWorks) + (t.diagram ? pre(t.diagram) : '')) +
        section('Why does it exist?', rich(t.whyItExists)) +
        section('When to use it', rich(t.whenToUse)) +
        section('When not to use it', rich(t.whenNotToUse)) +
        section('Common mistakes', t.commonMistakes.length ? `<ul>${t.commonMistakes.map((m) => `<li>${rich(m)}</li>`).join('')}</ul>` : '') +
        section('Practice exercises', t.exercises.length ? `<ol>${t.exercises.map((x) => `<li>${esc(x.difficulty)}: ${rich(x.prompt)}</li>`).join('')}</ol>` : '') +
        section('Interview questions', t.interviewQuestions.map((q) => `<h3>${esc(q.question)}</h3>${rich(q.answer)}`).join('')) +
        `<nav aria-label="Lessons">${prev ? `<p>Previous: ${link(`${sPath}/${prev.id}`, prev.title)}</p>` : ''}${next ? `<p>Next: ${link(`${sPath}/${next.id}`, next.title)}</p>` : ''}</nav></article>`;
      add(path, meta, article(path, meta, crumbs, { about: s.title, educationalLevel: t.level, keywords: (t.keywords ?? []).join(', ') }), main(crumbs.slice(0, -1), body));
    });
  }

  // Problems
  const pHome: [string, string] = ['/learn/problems', 'Problems'];
  {
    const meta = seo.problemsHomeMeta();
    add(
      '/learn/problems',
      meta,
      itemList('/learn/problems', meta, [home, learnCrumb, pHome], src.categories.map((c) => [`/learn/problems/${c.id}`, c.title])),
      main(
        [home, learnCrumb],
        `<h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p><ul>${src.categories.map((c) => `<li>${link(`/learn/problems/${c.id}`, c.title)}: ${esc(c.description)}</li>`).join('')}</ul>`,
      ),
    );
  }
  for (const c of src.categories) {
    const cPath = `/learn/problems/${c.id}`;
    const list = src.problems.filter((p) => p.category === c.id);
    const meta = seo.categoryMetaFor(c, list.length);
    add(
      cPath,
      meta,
      itemList(cPath, meta, [home, learnCrumb, pHome, [cPath, c.title]], list.map((p) => [`${cPath}/${p.id}`, p.title])),
      main([home, learnCrumb, pHome], `<h1>${esc(meta.title)}</h1><p>${esc(c.description)}</p><ol>${list.map((p) => `<li>${link(`${cPath}/${p.id}`, p.title)} (${esc(p.difficulty)})</li>`).join('')}</ol>`),
    );
    for (const p of list) {
      const path = `${cPath}/${p.id}`;
      const meta = seo.problemMetaFor({ id: p.id, title: p.title, difficulty: p.difficulty, category: p.category, file: '' }, plainText(p.description));
      const crumbs: [string, string][] = [home, learnCrumb, pHome, [cPath, c.title], [path, p.title]];
      const body =
        `<article><h1>${esc(p.title)}</h1><p>Difficulty: ${esc(p.difficulty)}</p>${rich(p.description)}` +
        section('Examples', p.examples.map((e) => `<p><strong>Input:</strong> <code>${esc(e.input)}</code><br><strong>Output:</strong> <code>${esc(e.output)}</code></p>${e.explanation ? rich(e.explanation) : ''}`).join('')) +
        section('Constraints', p.constraints?.length ? `<ul>${p.constraints.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>` : '') +
        section('Approach', rich(p.approachOverview)) +
        section(
          'Solutions',
          p.solutions
            .map((sol) => `<h3>${esc(sol.approach)}</h3>${rich(sol.explanation)}${pre(sol.code)}<p>Time: ${esc(sol.timeComplexity)} · Space: ${esc(sol.spaceComplexity)}</p>`)
            .join(''),
        ) +
        '</article>';
      add(path, meta, article(path, meta, crumbs, { educationalLevel: p.difficulty, learningResourceType: 'Practice problem' }), main(crumbs.slice(0, -1), body));
    }
  }

  // Case studies
  const csHome: [string, string] = ['/learn/case-studies', 'Case studies'];
  {
    const meta = seo.caseStudiesHomeMeta();
    add(
      '/learn/case-studies',
      meta,
      itemList('/learn/case-studies', meta, [home, learnCrumb, csHome], src.caseStudies.map((c) => [`/learn/case-studies/${c.id}`, c.title])),
      main([home, learnCrumb], `<h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p><ul>${src.caseStudies.map((c) => `<li>${link(`/learn/case-studies/${c.id}`, c.title)}: ${esc(c.summary)}</li>`).join('')}</ul>`),
    );
  }
  for (const c of src.caseStudies) {
    const path = `/learn/case-studies/${c.id}`;
    const meta = seo.caseStudyMetaFor({ id: c.id, title: c.title, difficulty: c.difficulty, summary: c.summary, relatedTopics: [], file: '' });
    const crumbs: [string, string][] = [home, learnCrumb, csHome, [path, c.title]];
    const list = (items: string[]) => (items.length ? `<ul>${items.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>` : '');
    const body =
      `<article><h1>${esc(c.title)}</h1><p>${esc(c.summary)}</p>` +
      section('Problem statement', rich(c.problemStatement)) +
      section('Requirements', `<h3>Functional</h3>${list(c.requirements.functional)}<h3>Non-functional</h3>${list(c.requirements.nonFunctional)}`) +
      section('Capacity estimation', `<ul>${c.capacityEstimation.map((e) => `<li>${esc(e.label)}: ${esc(e.value)}${e.note ? ` (${esc(e.note)})` : ''}</li>`).join('')}</ul>${c.capacityNotes ? rich(c.capacityNotes) : ''}`) +
      section('API design', c.apiDesign?.length ? `<ul>${c.apiDesign.map((a) => `<li><code>${esc(a.method)} ${esc(a.path)}</code>: ${esc(a.description)}</li>`).join('')}</ul>` : '') +
      section('Data model', c.dataModel ? rich(c.dataModel) : '') +
      section('High-level design', rich(c.highLevelDesign) + (c.highLevelDiagram ? pre(c.highLevelDiagram) : '')) +
      section('Deep dives', c.deepDives.map((d) => `<h3>${esc(d.title)}</h3>${rich(d.explanation)}${d.diagram ? pre(d.diagram) : ''}`).join('')) +
      section('Bottlenecks and scaling', rich(c.bottlenecksAndScaling)) +
      section('Trade-offs', c.tradeOffs.map((t) => `<h3>${esc(t.decision)}</h3>${rich(t.explanation)}`).join('')) +
      section('Interview tips', list(c.interviewTips ?? [])) +
      '</article>';
    add(path, meta, article(path, meta, crumbs, { educationalLevel: c.difficulty }), main(crumbs.slice(0, -1), body));
  }

  return pages;
}

function topicMeta(t: Topic) {
  return { id: t.id, title: t.title, level: t.level, description: t.description, prerequisites: t.prerequisites ?? [], relatedTopics: t.relatedTopics };
}
