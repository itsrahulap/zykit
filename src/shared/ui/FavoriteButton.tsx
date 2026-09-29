// Star toggle for a tool, used on tool pages (in the breadcrumb row) and home cards.

import { useFavorites } from '../lib/toolPrefs';

export function StarIcon({ filled, className = 'h-5 w-5' }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
    </svg>
  );
}

export function FavoriteButton({ tool, className = '' }: { tool: { id: string; name: string }; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const on = isFavorite(tool.id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Favorite ${tool.name}`}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => {
        // Cards wrap the button in a link; starring shouldn't open the tool.
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(tool.id);
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-colors pointer-coarse:h-11 pointer-coarse:w-11 motion-reduce:transition-none ${
        on
          ? 'bg-amber-50 text-amber-500 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-900'
          : 'bg-white text-slate-400 ring-slate-200 hover:text-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:ring-slate-700 dark:hover:text-slate-200'
      } ${className}`}
    >
      <StarIcon filled={on} />
    </button>
  );
}
