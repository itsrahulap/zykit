// Light by default; dark only when the user picks it. Stored per browser as a convenience.

export type Theme = 'light' | 'dark';
const KEY = 'toolstack-theme';

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}
