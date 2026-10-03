import { hostOf } from '../features/meta';
import type { SizeDef } from '../features/layout';

interface CardProps {
  src: string;
  title: string;
  description: string;
  url: string;
  siteName: string;
  size: SizeDef;
}

// Approximations of how each platform lays out a link card. Colours are fixed on purpose: the
// platforms don't follow this site's theme.
const wrap = 'min-w-0 overflow-hidden text-left';

export function FacebookCard({ src, title, description, url, size }: CardProps) {
  const sq = size.card === 'summary';
  return (
    <div className={`${wrap} border border-slate-300 bg-slate-100 text-slate-900`}>
      <img src={src} alt="" className={`w-full object-cover ${sq ? 'aspect-[1.91/1]' : 'aspect-[1.91/1]'}`} />
      <div className="space-y-0.5 p-3">
        <p className="truncate text-xs tracking-wide text-slate-600 uppercase">{hostOf(url)}</p>
        <p className="line-clamp-2 text-base leading-snug font-semibold">{title || 'Your title'}</p>
        <p className="line-clamp-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

export function XCard({ src, title, description, url, size }: CardProps) {
  if (size.card === 'summary')
    return (
      <div className={`${wrap} flex rounded-2xl border border-slate-300 bg-white text-slate-900`}>
        <img src={src} alt="" className="aspect-square w-28 shrink-0 object-cover sm:w-36" />
        <div className="min-w-0 space-y-0.5 p-3">
          <p className="truncate text-xs text-slate-600">{hostOf(url)}</p>
          <p className="line-clamp-1 text-sm font-semibold">{title || 'Your title'}</p>
          <p className="line-clamp-2 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    );
  return (
    <div className={`${wrap} rounded-2xl border border-slate-300 bg-white text-slate-900`}>
      <div className="relative">
        <img src={src} alt="" className="aspect-[2/1] w-full object-cover" />
        <p className="absolute bottom-2 left-2 max-w-[85%] truncate rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">{title || 'Your title'}</p>
      </div>
      <p className="truncate px-3 py-2 text-xs text-slate-600">From {hostOf(url)}</p>
    </div>
  );
}

export function LinkedInCard({ src, title, url, size }: CardProps) {
  return (
    <div className={`${wrap} rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm`}>
      <img src={src} alt="" className={`w-full object-cover ${size.card === 'summary' ? 'aspect-[1.91/1]' : 'aspect-[1.91/1]'}`} />
      <div className="space-y-0.5 bg-sky-50 p-3">
        <p className="line-clamp-2 text-sm leading-snug font-semibold">{title || 'Your title'}</p>
        <p className="truncate text-xs text-slate-600">{hostOf(url)}</p>
      </div>
    </div>
  );
}

export function SlackCard({ src, title, description, url, siteName }: CardProps) {
  return (
    <div className={`${wrap} flex gap-3 bg-white text-slate-900`}>
      <div className="w-1 shrink-0 rounded-full bg-slate-300" />
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-bold">{siteName || hostOf(url)}</p>
        <p className="line-clamp-2 text-sm font-bold text-sky-700">{title || 'Your title'}</p>
        <p className="line-clamp-2 text-sm text-slate-700">{description}</p>
        <img src={src} alt="" className="mt-1 max-h-[22rem] w-full max-w-sm rounded-lg border border-slate-200 object-cover" />
      </div>
    </div>
  );
}
