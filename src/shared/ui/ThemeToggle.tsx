import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, THEME_EVENT, currentTheme, type Theme } from '../utils/theme';
import { Icon } from './ui';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  // The command palette can switch the theme too.
  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="rounded-xl p-2.5 text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-white dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-900"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
    </button>
  );
}
