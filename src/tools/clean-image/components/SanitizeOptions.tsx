import { useState } from 'react';
import { formatOrientation } from '../features/metadata/exif.parser';
import { shouldRemove, type ImageMetadataReport, type SanitizeMode } from '../features/metadata/metadata.types';
import type { SanitizeOptions as Options } from '../features/sanitizer/sanitizer.types';
import { pluralize } from '../../../shared/utils/format.utils';
import { Button, Icon } from '../../../shared/ui/ui';

export function SanitizeOptions({ report, onClean, busy }: { report: ImageMetadataReport; onClean: (o: Options) => void; busy: boolean }) {
  const [mode, setMode] = useState<SanitizeMode>('privacy');
  const [preserveOrientation, setPreserveOrientation] = useState(true);

  const removable = (m: SanitizeMode) => report.blocks.filter((b) => shouldRemove(b.action, m)).length;
  const hasIcc = report.blocks.some((b) => b.category === 'ICC');
  const rotated = report.orientation !== undefined && report.orientation !== 1;
  const count = removable(mode);

  const modes: { id: SanitizeMode; title: string; badge?: string; body: string }[] = [
    {
      id: 'privacy',
      title: 'Clean privacy metadata',
      badge: 'Recommended',
      body: 'Removes EXIF (GPS, camera, dates, author), XMP, IPTC, comments, text chunks, C2PA and other embedded data. Keeps the color profile so colors look the same.',
    },
    {
      id: 'all',
      title: 'Remove all supported metadata',
      body: 'Also removes the ICC color profile. Only the data needed to decode the image is kept.',
    },
  ];

  return (
    <section aria-labelledby="clean-title" className="rounded-3xl border border-primary-edge bg-primary-soft p-6 sm:p-10 dark:border-emerald-900 dark:bg-emerald-950/60">
      <p className="eyebrow text-emerald-800 dark:text-emerald-300">Ready to share?</p>
      <h2 id="clean-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        Strip what you don&rsquo;t want to share.
      </h2>
      <p className="mb-6 mt-2 text-slate-700 dark:text-slate-300">
        Metadata is removed without re-encoding, so image quality is unchanged. The result is verified before download.
      </p>
      <fieldset>
        <legend className="sr-only">Cleaning mode</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {modes.map((m) => (
            <label
              key={m.id}
              className={`cursor-pointer rounded-2xl border-2 p-5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                mode === m.id
                  ? 'border-emerald-600 bg-white dark:bg-slate-900'
                  : 'border-transparent bg-white/60 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900'
              }`}
            >
              <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="sr-only" />
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</span>
                {m.badge && <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{m.badge}</span>}
              </span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{m.body}</span>
              <span className="mt-2 block text-xs font-medium text-slate-500">
                {mode === m.id ? '● Selected' : '○'} · {pluralize(removable(m.id), 'container')} to remove
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {mode === 'all' && hasIcc && (
        <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" role="note">
          <Icon name="warn" className="h-5 w-5 shrink-0" />
          This image has an ICC color profile. Removing it may make colors look different, especially for wide-gamut (e.g. Display P3) images.
        </p>
      )}

      {rotated && (
        <label className="mt-4 flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={preserveOrientation}
            onChange={(e) => setPreserveOrientation(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-emerald-600"
          />
          <span>
            <span className="font-medium">Keep image orientation</span> — this image is marked {formatOrientation(report.orientation!)}.
            Keeping only this single tag prevents the image from appearing rotated.
          </span>
        </label>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => onClean({ mode, preserveOrientation })} disabled={busy || count === 0}>
          <Icon name="shield" className="h-4 w-4" />
          {count === 0 ? 'Nothing to remove' : 'Clean image'}
        </Button>
        {count === 0 && <span className="text-sm text-slate-500">This image has no removable metadata in this mode.</span>}
      </div>
    </section>
  );
}
