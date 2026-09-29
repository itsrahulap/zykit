// A tiny localStorage-backed store shared by every component that reads it, so marking a
// topic complete on its page updates the sidebar, subject list and home page at once.
// Storage can be unavailable (private mode, blocked site data); state then lives in memory.

import { useSyncExternalStore } from 'react';

export function createStore<T>(key: string, fallback: T) {
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  let state = read();
  const listeners = new Set<() => void>();

  const set = (next: T) => {
    state = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // keep the in-memory value
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    // Keep tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        state = read();
        l();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener('storage', onStorage);
    };
  };

  return {
    get: () => state,
    set,
    use: () => useSyncExternalStore(subscribe, () => state, () => fallback),
  };
}
