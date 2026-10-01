// Rendered under every tool page by the tool route (src/app/router.tsx): the tool's docs, related
// tools and the Learn lessons behind this tool. Loaded alongside the tool's own chunk, never on the home page.

import { Link } from 'react-router';
import { getSubjectMeta, getTopicMeta, topicPath } from '../learn/data';
import { topicsForTool } from '../learn/data/toolLinks';
import { Icon } from '../shared/ui/ui';
import { relatedTools } from './related';
import { ToolCardGrid, toolCardClass as card } from './ToolCardGrid';
import { ToolDocsSection } from './ToolDocsSection';
import type { ToolDefinition, ToolDocs } from './types';

const heading = 'eyebrow mb-4 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400';

export default function ToolPageExtras({ tool, docs }: { tool: ToolDefinition; docs?: ToolDocs }) {
  const related = relatedTools(tool.id);
  const lessons = topicsForTool(tool.id)
    .map((r) => ({ subject: getSubjectMeta(r.subjectId), topic: getTopicMeta(r.subjectId, r.topicId) }))
    .filter((l) => l.subject && l.topic)
    .slice(0, 6);
  if (!docs && related.length === 0 && lessons.length === 0) return null;
  return (
    <div className="mt-16 space-y-12">
      {docs && <ToolDocsSection name={tool.name} docs={docs} />}
      {lessons.length > 0 && (
        <section aria-labelledby="learn-the-concept">
          <h2 id="learn-the-concept" className={heading}>
            Learn the concept
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map(({ subject, topic }) => (
              <li key={`${subject!.id}/${topic!.id}`}>
                <Link to={topicPath(subject!.id, topic!.id)} className={`${card} p-4`}>
                  <Icon name="book" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="min-w-0">
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{subject!.title}</span>
                    <span className="block font-semibold text-slate-900 dark:text-white">{topic!.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600 dark:text-slate-400">{topic!.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {related.length > 0 && (
        <section aria-labelledby="related-tools">
          <h2 id="related-tools" className={heading}>
            Related tools
          </h2>
          <ToolCardGrid tools={related} />
        </section>
      )}
    </div>
  );
}
