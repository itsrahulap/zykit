// Per-viewer tool preferences: starred tools and recently opened ones. Saved in this browser
// only, kept in sync across components and tabs by createStore.

import { useCallback } from 'react';
import { createStore } from './store';

export const FAVORITES_KEY = 'zykit-favorites';
export const RECENT_TOOLS_KEY = 'zykit-recent-tools';
export const MAX_RECENT_TOOLS = 8;

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Adds `id` if missing, removes it if present. */
export function toggleId(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Moves `id` to the front, keeping at most `max` distinct ids. */
export function pushRecent(list: readonly string[], id: string, max = MAX_RECENT_TOOLS): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, max);
}

const favoritesStore = createStore<string[]>(FAVORITES_KEY, []);
const recentStore = createStore<string[]>(RECENT_TOOLS_KEY, []);

export function useFavorites() {
  const favorites = ids(favoritesStore.use());
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  const toggleFavorite = useCallback((id: string) => favoritesStore.set(toggleId(ids(favoritesStore.get()), id)), []);
  return { favorites, isFavorite, toggleFavorite };
}

export const useRecentTools = () => ids(recentStore.use());

export function recordToolVisit(id: string) {
  const current = ids(recentStore.get());
  if (current[0] !== id) recentStore.set(pushRecent(current, id));
}
