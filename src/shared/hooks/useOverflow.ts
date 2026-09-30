import { useCallback, useEffect, useState } from 'react';

/**
 * Tracks whether an element's content overflows it (so it scrolls). Scroll containers use it to
 * become keyboard-focusable only when there is something to scroll (WCAG 2.1.1), which avoids
 * extra Tab stops on short content. `deps` re-measure after content changes that keep the size.
 */
export function useOverflow<T extends HTMLElement>(deps: readonly unknown[] = []) {
  const [el, setEl] = useState<T | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useCallback((node: T | null) => setEl(node), []);

  useEffect(() => {
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [el, ...deps]);

  return [ref, overflowing] as const;
}

/** Props that make an overflowing scroll container reachable and named for keyboard and screen reader users. */
export function scrollRegionProps(overflowing: boolean, label: string) {
  return overflowing ? ({ tabIndex: 0, role: 'region', 'aria-label': label } as const) : {};
}
