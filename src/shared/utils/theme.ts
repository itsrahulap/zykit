// Light by default; dark only when the user picks it. Stored per browser as a convenience.

export type Theme = 'light' | 'dark';
const KEY = 'zykit-theme';

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Fired on window whenever applyTheme runs, so every theme control stays in sync. */
export const THEME_EVENT = 'zykit-theme';

export const currentTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.dispatchEvent(new Event(THEME_EVENT));
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}
