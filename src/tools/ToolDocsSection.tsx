// A tool's user documentation (its docs.ts), rendered by ToolPageExtras under the tool:
// how to use, how it works, limits, privacy and FAQs. The same content is written into the
// tool's static SEO page by scripts/seo-plugin.ts.

import { InlineText, RichText } from '../learn/components/RichText';
import { Icon } from '../shared/ui/ui';
import type { ToolDocs } from './types';

export const docsHeading = 'eyebrow mb-4 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400';

export function ToolDocsSection({ name, docs }: { name: string; docs: ToolDocs }) {
  return (
    <div className="space-y-12 [overflow-wrap:anywhere]">
      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-label="How to use">
          <h2 id="how-to-use" className={docsHeading}>
            How to use {name}
          </h2>
          <ol className="space-y-3">
            {docs.howToUse.map((step, i) => (
              <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-ink">{i + 1}</span>
                <span className="min-w-0 pt-0.5">
                  <InlineText text={step} />
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits" className={docsHeading}>
            Limits
          </h2>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            {docs.limits.map((limit, i) => (
              <li key={i} className="flex gap-2">
                <Icon name="info" className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <InlineText text={limit} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className={docsHeading}>
          How it works
        </h2>
        <RichText text={docs.howItWorks} className="max-w-3xl" />
      </section>

      <section aria-labelledby="privacy" className="flex gap-3 rounded-2xl bg-primary-soft p-5 text-primary-ink dark:bg-slate-800/60 dark:text-slate-200">
        <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <h2 id="privacy" className="font-semibold">
            Privacy
          </h2>
          <p className="mt-1">
            <InlineText text={docs.privacy} />
          </p>
        </div>
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq" className={docsHeading}>
          Frequently asked questions
        </h2>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {docs.faqs.map((f, i) => (
            <details key={i} className="group p-4 sm:px-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <InlineText text={f.question} />
                </span>
                <Icon name="chevron-right" className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
              </summary>
              <p className="mt-2 text-slate-700 dark:text-slate-300">
                <InlineText text={f.answer} />
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
