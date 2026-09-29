import { CATEGORY_LABELS, type ImageMetadataReport } from '../features/metadata/metadata.types';
import { compareCategories, type CategoryOutcome, type MetadataDiff } from '../features/validation/metadata.diff';
import { formatBytes, pluralize } from '../../../shared/utils/format.utils';
import { Badge, Card } from '../../../shared/ui/ui';

const OUTCOME: Record<CategoryOutcome, { tone: 'green' | 'neutral' | 'amber' | 'red'; label: string }> = {
  removed: { tone: 'green', label: 'Removed' },
  kept: { tone: 'neutral', label: 'Kept' },
  partial: { tone: 'amber', label: 'Partially kept' },
  added: { tone: 'red', label: 'Added' },
};

export function BeforeAfter({ original, cleaned, diff }: { original: ImageMetadataReport; cleaned: ImageMetadataReport; diff: MetadataDiff }) {
  const rows = compareCategories(original, cleaned);
  const saved = original.fileSize - cleaned.fileSize;
  const footnotes: string[] = [];
  if (rows.some((r) => r.category === 'EXIF' && r.outcome === 'partial'))
    footnotes.push('EXIF: only the Orientation tag was kept so the image displays upright. All other EXIF fields were removed.');
  if (rows.some((r) => r.category === 'ICC' && r.outcome === 'kept'))
    footnotes.push('ICC: the color profile was kept so colors render correctly. Use "Remove all supported metadata" to remove it.');
  if (rows.some((r) => r.category === 'C2PA' && r.outcome === 'removed'))
    footnotes.push('C2PA: the embedded manifest was removed from this file. Copies of the provenance record stored elsewhere (e.g. by the issuing service) are not affected.');

  return (
    <Card
      title="Before / after"
      subtitle={`${pluralize(diff.removed.length, 'field')} removed · ${pluralize(diff.retained.length, 'field')} kept · ${formatBytes(Math.abs(saved))} ${saved >= 0 ? 'smaller' : 'larger'}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th scope="col" className="py-2 pr-4 font-medium">Metadata</th>
              <th scope="col" className="py-2 pr-4 font-medium">Before</th>
              <th scope="col" className="py-2 pr-4 font-medium">After</th>
              <th scope="col" className="py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.category}>
                <th scope="row" className="py-2.5 pr-4 text-left font-medium text-slate-800 dark:text-slate-200">{CATEGORY_LABELS[r.category]}</th>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.before ? pluralize(r.before, 'field') : r.beforeBlocks ? 'Present' : '—'}</td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.after ? pluralize(r.after, 'field') : r.afterBlocks ? 'Present' : '—'}</td>
                <td className="py-2.5">
                  <Badge tone={OUTCOME[r.outcome].tone}>
                    {OUTCOME[r.outcome].label}
                    {r.outcome !== 'removed' && r.outcome !== 'added' ? '*' : ''}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnotes.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          {footnotes.map((f) => (
            <li key={f}>* {f}</li>
          ))}
        </ul>
      )}
      {diff.added.length > 0 && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300" role="alert">
          Unexpected: {pluralize(diff.added.length, 'field')} appeared in the output that were not in the original:{' '}
          {diff.added.map((e) => e.key).join(', ')}.
        </p>
      )}
    </Card>
  );
}
