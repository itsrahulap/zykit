// /learn/case-studies — every worked system design walkthrough.

import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline } from '../../shared/ui/page';
import { Icon } from '../../shared/ui/ui';
import { caseStudies, caseStudyPath, findTopicAnywhere } from '../data';
import { caseStudiesHomeMeta } from '../seo';
import { LearnBreadcrumb } from '../components/LearnBreadcrumb';
import { DifficultyBadge } from '../components/status';

export default function CaseStudiesPage() {
  useDocumentMeta(caseStudiesHomeMeta());
  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <LearnBreadcrumb trail={[{ label: 'Case studies' }]} />
        <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Icon name="building" className="h-4 w-4" /> Real system designs
        </p>
        <Headline accent="for real">Design systems </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Full worked walkthroughs of real products: requirements, capacity estimation, APIs, data models, the high-level design, deep dives
          into the hard parts and the trade-offs behind each decision, the way a system design interview goes.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {caseStudies.map((cs, i) => {
          const concepts = cs.relatedTopics
            .map((id) => findTopicAnywhere(id, 'system-design')?.topic.title)
            .filter((t) => t !== undefined)
            .slice(0, 3);
          return (
            <li key={cs.id}>
              <Link
                to={caseStudyPath(cs.id)}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="eyebrow text-slate-500 dark:text-slate-400">Case {String(i + 1).padStart(2, '0')}</span>
                  <DifficultyBadge difficulty={cs.difficulty} />
                </span>
                <span className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
                  Design {cs.title}
                </span>
                <span className="mt-2 flex-1 text-slate-600 dark:text-slate-400">{cs.summary}</span>
                {concepts.length > 0 && (
                  <span className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="sr-only">Covers: </span>
                    {concepts.join(' · ')}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
