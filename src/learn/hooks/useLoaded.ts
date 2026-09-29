import { useEffect, useState } from 'react';

export type Loaded<T> = { status: 'loading' } | { status: 'ready'; value: T } | { status: 'missing' } | { status: 'error'; error: unknown };

/** Runs an async loader whenever `key` changes; resolves to 'missing' when the loader returns undefined. */
export function useLoaded<T>(key: string, load: () => Promise<T | undefined>): Loaded<T> {
  const [state, setState] = useState<{ key: string; value: Loaded<T> }>({ key, value: { status: 'loading' } });
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setState({ key, value: value === undefined ? { status: 'missing' } : { status: 'ready', value } }),
      (error: unknown) => live && setState({ key, value: { status: 'error', error } }),
    );
    return () => {
      live = false;
    };
    // `load` is recreated each render; `key` identifies what it loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state.value : { status: 'loading' };
}
