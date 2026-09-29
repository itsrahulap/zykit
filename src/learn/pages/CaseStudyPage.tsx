// /learn/case-studies/:caseStudyId — one full system design walkthrough.

import { Link, useParams } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Badge, Icon } from '../../shared/ui/ui';
import { adjacent } from '../components/problems/practice';
import { caseStudies, caseStudiesPath, caseStudyPath, findTopicAnywhere, getCaseStudyMeta, loadCaseStudy, topicPath, type CaseStudyMeta } from '../data';
import type { CaseStudy } from '../types/caseStudy';
import { useLoaded } from '../hooks/useLoaded';
import { caseStudyMetaFor } from '../seo';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { LoadError, LoadingState, NotFoundState } from '../components/PageStates';
import { Diagram } from '../components/Diagram';
import { InlineText, RichText } from '../components/RichText';
import { DifficultyBadge } from '../components/status';
import { PrevNext } from '../components/problems/bits';
import { Section } from '../components/problems/ProblemSections';
import { caseStudySections, methodTone } from '../components/case-studies/sections';

export default function CaseStudyPage() {
  const { caseStudyId = '' } = useParams();
  const meta = getCaseStudyMeta(caseStudyId);
  const loaded = useLoaded(caseStudyId, () => loadCaseStudy(caseStudyId));
  if (!meta || loaded.status === 'missing') return <NotFoundState what="case study" backTo={caseStudiesPath} backLabel="All case studies" />;
  if (loaded.status === 'loading') return <LoadingState label="Loading case study…" />;
  if (loaded.status === 'error') return <LoadError />;
  return <CaseStudyView key={meta.id} meta={meta} cs={loaded.value} />;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 leading-relaxed text-slate-700 marker:text-emerald-600 dark:text-slate-300 dark:marker:text-emerald-400">
      {items.map((item, i) => (
        <li key={i}>
          <InlineText text={item} />
        </li>
      ))}
    </ul>
  );
}

const card = 'rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900';

function CaseStudyView({ meta, cs }: { meta: CaseStudyMeta; cs: CaseStudy }) {
  useDocumentMeta(caseStudyMetaFor(meta));
  const topics = (cs.relatedTopics ?? []).map((id) => findTopicAnywhere(id, 'system-design')).filter((t) => t !== undefined);
  const sections = caseStudySections(cs, topics.length > 0);
  const has = (id: string) => sections.some((s) => s.id === id);
  const { prev, next } = adjacent(caseStudies, cs.id);

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <article className="min-w-0 space-y-12">
        <header className="space-y-5">
          <LearnBreadcrumb trail={[{ label: 'Case studies', to: caseStudiesPath }, { label: cs.title }]} />
          <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Icon name="building" className="h-4 w-4" /> System design case study
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">Design {cs.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={cs.difficulty} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {cs.deepDives.length} deep dives · {cs.tradeOffs.length} trade-offs
            </span>
          </div>
          <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-400">{cs.summary}</p>
        </header>

        {has('problem') && (
          <Section id="problem" title="The problem">
            <RichText text={cs.problemStatement} />
          </Section>
        )}

        {has('requirements') && (
          <Section id="requirements" title="Requirements">
            <div className="grid gap-4 lg:grid-cols-2">
              {cs.requirements.functional.length > 0 && (
                <div className={card}>
                  <h3 className="eyebrow mb-4 text-slate-600 dark:text-slate-400">Functional</h3>
                  <BulletList items={cs.requirements.functional} />
                </div>
              )}
              {cs.requirements.nonFunctional.length > 0 && (
                <div className={card}>
                  <h3 className="eyebrow mb-4 text-slate-600 dark:text-slate-400">Non-functional</h3>
                  <BulletList items={cs.requirements.nonFunctional} />
                </div>
              )}
            </div>
          </Section>
        )}

        {has('capacity') && (
          <Section id="capacity" title="Capacity estimation">
            {cs.capacityEstimation.length > 0 && (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" tabIndex={0} role="region" aria-label="Capacity estimates">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                    <tr>
                      <th scope="col" className="eyebrow px-4 py-3 font-semibold text-slate-600 sm:px-5 dark:text-slate-400">Estimate</th>
                      <th scope="col" className="eyebrow px-4 py-3 font-semibold text-slate-600 sm:px-5 dark:text-slate-400">Value</th>
                      <th scope="col" className="eyebrow px-4 py-3 font-semibold text-slate-600 sm:px-5 dark:text-slate-400">How we got there</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cs.capacityEstimation.map((e, i) => (
                      <tr key={i} className="align-top">
                        <th scope="row" className="px-4 py-3 font-medium text-slate-900 sm:px-5 dark:text-slate-100">{e.label}</th>
                        <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-emerald-800 sm:px-5 dark:text-emerald-300">{e.value}</td>
                        <td className="px-4 py-3 text-slate-600 sm:px-5 dark:text-slate-400">{e.note ? <InlineText text={e.note} /> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {cs.capacityNotes && <RichText text={cs.capacityNotes} />}
          </Section>
        )}

        {has('api') && cs.apiDesign && (
          <Section id="api" title="API design">
            <ul className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {cs.apiDesign.map((ep, i) => (
                <li key={i} className="space-y-2 px-4 py-4 sm:px-6">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-mono">
                      <Badge tone={methodTone(ep.method)}>{ep.method}</Badge>
                    </span>
                    <code className="min-w-0 break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{ep.path}</code>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <InlineText text={ep.description} />
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {has('data-model') && cs.dataModel && (
          <Section id="data-model" title="Data model">
            <RichText text={cs.dataModel} />
          </Section>
        )}

        {has('high-level-design') && (
          <Section id="high-level-design" title="High-level design">
            <RichText text={cs.highLevelDesign} />
            {cs.highLevelDiagram && <Diagram text={cs.highLevelDiagram} label={`High-level architecture of ${cs.title}`} />}
          </Section>
        )}

        {has('deep-dives') && (
          <Section id="deep-dives" title="Deep dives">
            <ol className="space-y-4">
              {cs.deepDives.map((dive, i) => (
                <li key={i} className={`${card} space-y-4`}>
                  <h3 className="flex items-baseline gap-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">{String(i + 1).padStart(2, '0')}</span>
                    {dive.title}
                  </h3>
                  <RichText text={dive.explanation} />
                  {dive.diagram && <Diagram text={dive.diagram} label={dive.title} />}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {has('scaling') && (
          <Section id="scaling" title="Bottlenecks & scaling">
            <RichText text={cs.bottlenecksAndScaling} />
          </Section>
        )}

        {has('trade-offs') && (
          <Section id="trade-offs" title="Trade-offs">
            <ul className="space-y-4">
              {cs.tradeOffs.map((t, i) => (
                <li key={i} className={`${card} space-y-3`}>
                  <h3 className="flex items-start gap-2 font-semibold text-slate-900 dark:text-slate-100">
                    <Icon name="swap" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      <InlineText text={t.decision} />
                    </span>
                  </h3>
                  <RichText text={t.explanation} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {has('interview-tips') && cs.interviewTips && (
          <Section id="interview-tips" title="Interview tips" icon="lightbulb">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6 dark:border-amber-900 dark:bg-amber-950/40">
              <BulletList items={cs.interviewTips} />
            </div>
          </Section>
        )}

        {has('related') && (
          <Section id="related" title="Related concepts">
            <ul className="flex flex-wrap gap-2">
              {topics.map(({ subject, topic }) => (
                <li key={`${subject.id}/${topic.id}`}>
                  <Link
                    to={topicPath(subject.id, topic.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-200 hover:ring-emerald-500 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:ring-emerald-500"
                  >
                    <Icon name="book" className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /> {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <PrevNext
          label="More case studies"
          prev={prev && { to: caseStudyPath(prev.id), title: `Design ${prev.title}` }}
          next={next && { to: caseStudyPath(next.id), title: `Design ${next.title}` }}
        />
      </article>

      <aside className="hidden xl:block">
        <nav aria-label="On this page" className="sticky top-8">
          <p className="eyebrow mb-3 text-slate-500 dark:text-slate-400">On this page</p>
          <ol className="space-y-1 border-l border-slate-200 text-sm dark:border-slate-800">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-slate-600 hover:border-emerald-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    </div>
  );
}
