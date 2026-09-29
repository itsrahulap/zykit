import type { Analysis } from '../features/analyze';
import { truncate } from '../features/analyze';
import { Icon } from '../../../shared/ui/ui';

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};

/** Remote images can't load under this site's CSP, so the preview shows where the image would come from. */
function ImagePlaceholder({ url, alt, ratio }: { url: string | null; alt: string | null; ratio: string }) {
  return (
    <div className={`flex ${ratio} w-full flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center dark:bg-slate-800`}>
      <Icon name="image" className="h-8 w-8 text-slate-400" />
      {url ? (
        <>
          <p className="max-w-full font-mono text-xs break-all text-slate-600 dark:text-slate-300">{url}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{alt ? `Alt: ${alt} · ` : ''}Not loaded (privacy)</p>
        </>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">No image</p>
      )}
    </div>
  );
}

export function Previews({ a }: { a: Analysis }) {
  const p = a.preview;
  const host = hostOf(p.url) || p.siteName;
  const googleTitle = a.title.value ?? p.title;
  const googleDesc = a.description.value ?? '';
  const large = p.twitterCard === 'summary_large_image';
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure className="min-w-0 lg:col-span-2">
        <figcaption className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Google result</figcaption>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm break-all text-slate-700 dark:text-slate-300">{p.url ? truncate(p.url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\//g, ' › '), 70) : 'example.com'}</p>
          <p className="mt-1 text-xl break-words text-[#1a0dab] dark:text-[#8ab4f8]">{truncate(googleTitle, 60)}</p>
          <p className="mt-1 text-sm break-words text-slate-600 dark:text-slate-400">{googleDesc ? truncate(googleDesc, 160) : <em>Google will choose a snippet from the page.</em>}</p>
        </div>
      </figure>

      <figure className="min-w-0">
        <figcaption className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Facebook / LinkedIn</figcaption>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
          <ImagePlaceholder url={p.image} alt={p.imageAlt} ratio="aspect-[1.91/1]" />
          <div className="border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs break-all text-slate-500 uppercase dark:text-slate-400">{host || 'example.com'}</p>
            <p className="font-semibold break-words text-slate-900 dark:text-white">{truncate(p.title, 88)}</p>
            {p.description && <p className="text-sm break-words text-slate-600 dark:text-slate-400">{truncate(p.description, 120)}</p>}
          </div>
        </div>
      </figure>

      <figure className="min-w-0">
        <figcaption className="eyebrow mb-2 text-slate-600 dark:text-slate-400">X card ({p.twitterCard})</figcaption>
        {large ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <ImagePlaceholder url={p.twitterImage} alt={a.twitter['twitter:image:alt'] ?? p.imageAlt} ratio="aspect-[2/1]" />
            <div className="p-3">
              <p className="text-sm break-all text-slate-500 dark:text-slate-400">{host || 'example.com'}</p>
              <p className="break-words text-slate-900 dark:text-white">{truncate(a.twitter['twitter:title'] || p.title, 70)}</p>
            </div>
          </div>
        ) : (
          <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <div className="flex w-24 shrink-0 items-center justify-center bg-slate-100 sm:w-32 dark:bg-slate-800" aria-label={p.twitterImage ? 'Image not loaded' : 'No image'}>
              <Icon name="image" className="h-8 w-8 text-slate-400" />
            </div>
            <div className="min-w-0 p-3">
              <p className="text-sm break-all text-slate-500 dark:text-slate-400">{host || 'example.com'}</p>
              <p className="break-words text-slate-900 dark:text-white">{truncate(a.twitter['twitter:title'] || p.title, 70)}</p>
              <p className="text-sm break-words text-slate-600 dark:text-slate-400">{truncate(a.twitter['twitter:description'] || p.description, 100)}</p>
              {p.twitterImage && <p className="mt-1 font-mono text-xs break-all text-slate-500">{p.twitterImage}</p>}
            </div>
          </div>
        )}
      </figure>
    </div>
  );
}
