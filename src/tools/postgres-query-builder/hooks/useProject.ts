// Project state with undo/redo and browser persistence. A saved project is re-validated like an
// import on load, so a stale or edited localStorage entry can't break the page.

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyProject, type Project } from '../features/model';
import { exportProject, importProject, pruneProject } from '../features/project';

export const STORAGE_KEY = 'zykit-postgres-query-builder';
const MAX_HISTORY = 100;

function loadSaved(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const res = importProject(raw);
    return res.ok ? res.project : null;
  } catch {
    return null;
  }
}

export function useProject() {
  const [state, setState] = useState(() => ({ past: [] as Project[], present: loadSaved() ?? emptyProject(), future: [] as Project[] }));
  // During a drag, moves update `present` without adding history; the gesture start is recorded once.
  const gesture = useRef<Project | null>(null);

  const lastEdit = useRef({ key: '', at: 0 });

  /**
   * Apply a change as one undoable step. Removed tables/columns also drop what pointed at them.
   * Changes with the same `mergeKey` within a second (typing in one field) share one undo step.
   */
  const apply = useCallback((fn: (p: Project) => Project, mergeKey?: string) => {
    const now = Date.now();
    const merge = !!mergeKey && lastEdit.current.key === mergeKey && now - lastEdit.current.at < 1000;
    lastEdit.current = { key: mergeKey ?? '', at: now };
    setState((s) => {
      const next = pruneProject(fn(s.present));
      if (merge && s.past.length) return { ...s, present: next, future: [] };
      return { past: [...s.past, s.present].slice(-MAX_HISTORY), present: next, future: [] };
    });
  }, []);

  /** Live update during a gesture (dragging a table); call endGesture() when it finishes. */
  const applyLive = useCallback((fn: (p: Project) => Project) => {
    setState((s) => {
      gesture.current ??= s.present;
      return { ...s, present: fn(s.present) };
    });
  }, []);

  const endGesture = useCallback(() => {
    const start = gesture.current;
    gesture.current = null;
    if (start) setState((s) => (s.present === start ? s : { past: [...s.past, start].slice(-MAX_HISTORY), present: s.present, future: [] }));
  }, []);

  const undo = useCallback(() => setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s)), []);
  const redo = useCallback(() => setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)), []);

  // Save shortly after changes settle (dragging fires many updates), and right away if the page is
  // closed or reloaded before then.
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, exportProject(state.present));
      } catch {
        // Storage full or blocked: the project still works for this visit.
      }
    };
    const t = setTimeout(save, 400);
    window.addEventListener('pagehide', save);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pagehide', save);
    };
  }, [state.present]);

  return { project: state.present, apply, applyLive, endGesture, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
