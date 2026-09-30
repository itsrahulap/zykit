// Follows the OS setting (prefers-color-scheme) until the user picks a theme with the toggle;
// that choice is stored per browser and wins from then on.

export type Theme = 'light' | 'dark';
const KEY = 'zykit-theme';

function systemTheme(): Theme {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** The stored choice, or the OS preference when nothing is stored. */
export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Storage unavailable; fall back to the OS preference.
  }
  return systemTheme();
}

/** Fired on window whenever applyTheme runs, so every theme control stays in sync. */
export const THEME_EVENT = 'zykit-theme';

export const currentTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

/** Applies `theme`; `persist: false` (used at startup) leaves an OS-derived theme unstored so it keeps following the OS. */
export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.dispatchEvent(new Event(THEME_EVENT));
  if (!persist) return;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}
