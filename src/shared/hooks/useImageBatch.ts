// State for the batch image tools: the processing queue, page-wide file intake and object URLs.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError } from '../lib/errors';
import type { RenderJob, RenderResult } from '../lib/image';
import { ImageClient, isImageFile, MAX_BATCH_FILES } from '../lib/imageClient';

export interface BatchResult extends RenderResult {
  url: string;
  name: string;
  type: string;
}

export interface BatchItem {
  id: number;
  file: File;
  status: 'queued' | 'working' | 'done' | 'error';
  result?: BatchResult;
  error?: string;
}

const errorMessage = (e: unknown) => (e instanceof AppError ? e.message : "We couldn't process this image. The file may be damaged.");

/**
 * A queue of images processed one at a time. When `key` (the serialised settings) changes, every
 * file is re-processed with the new settings; in-flight work is cancelled.
 */
export function useImageBatch({
  key,
  makeJob,
  outputName,
}: {
  key: string;
  makeJob: (file: File) => Promise<RenderJob> | RenderJob;
  outputName: (file: File, type: string, result: RenderResult) => string;
}) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<BatchItem[]>([]);
  const client = useRef<ImageClient | null>(null);
  const gen = useRef(0);
  const running = useRef(false);
  const nextId = useRef(1);
  const opts = useRef({ makeJob, outputName });
  useEffect(() => {
    opts.current = { makeJob, outputName };
  });

  const commit = useCallback((next: BatchItem[]) => {
    list.current = next;
    setItems(next);
  }, []);
  const patch = useCallback(
    (id: number, p: Partial<BatchItem>) => commit(list.current.map((i) => (i.id === id ? { ...i, ...p } : i))),
    [commit],
  );

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    const g = gen.current;
    client.current ??= new ImageClient();
    try {
      for (;;) {
        if (g !== gen.current) break;
        const next = list.current.find((i) => i.status === 'queued');
        if (!next) break;
        patch(next.id, { status: 'working' });
        try {
          const job = await opts.current.makeJob(next.file);
          const r = await client.current.run(next.file, job);
          if (g !== gen.current) break;
          const current = list.current.find((i) => i.id === next.id);
          if (!current) continue;
          if (current.result) URL.revokeObjectURL(current.result.url);
          const result: BatchResult = { ...r, url: URL.createObjectURL(r.blob), name: opts.current.outputName(next.file, job.type, r), type: job.type };
          patch(next.id, { status: 'done', result, error: undefined });
        } catch (e) {
          if (g !== gen.current || (e instanceof AppError && e.code === 'CANCELLED')) break;
          patch(next.id, { status: 'error', error: errorMessage(e) });
        }
      }
    } finally {
      running.current = false;
      if (g !== gen.current) void pump();
    }
  }, [patch]);

  const restart = useCallback(() => {
    gen.current++;
    client.current?.cancel();
    commit(list.current.map((i) => ({ ...i, status: 'queued' })));
    void pump();
  }, [commit, pump]);

  // Re-run everything when the settings change (debounced for sliders).
  const firstKey = useRef(key);
  useEffect(() => {
    if (key === firstKey.current) return;
    firstKey.current = key;
    const t = setTimeout(() => list.current.length && restart(), 250);
    return () => clearTimeout(t);
  }, [key, restart]);

  useEffect(
    () => () => {
      client.current?.cancel();
      for (const i of list.current) if (i.result) URL.revokeObjectURL(i.result.url);
    },
    [],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const images = files.filter(isImageFile);
      if (!images.length) {
        setError(files.length ? "That doesn't look like an image file." : null);
        return;
      }
      const room = MAX_BATCH_FILES - list.current.length;
      setError(images.length > room ? `Up to ${MAX_BATCH_FILES} images at a time; the rest were skipped.` : null);
      const added = images.slice(0, Math.max(0, room)).map((file): BatchItem => ({ id: nextId.current++, file, status: 'queued' }));
      commit([...list.current, ...added]);
      void pump();
    },
    [commit, pump],
  );

  const remove = useCallback(
    (id: number) => {
      const item = list.current.find((i) => i.id === id);
      if (item?.result) URL.revokeObjectURL(item.result.url);
      commit(list.current.filter((i) => i.id !== id));
      if (item?.status === 'working') {
        // Stop the removed file's work; the rest of the queue carries on.
        gen.current++;
        client.current?.cancel();
        void pump();
      }
    },
    [commit, pump],
  );

  const clear = useCallback(() => {
    gen.current++;
    client.current?.cancel();
    for (const i of list.current) if (i.result) URL.revokeObjectURL(i.result.url);
    commit([]);
    setError(null);
  }, [commit]);

  const busy = items.some((i) => i.status === 'queued' || i.status === 'working');
  return { items, busy, error, dismissError: () => setError(null), addFiles, remove, clear };
}

/** Accept files pasted (Ctrl+V) or dropped anywhere on the page. */
export function usePageFileIntake(onFiles: (files: File[]) => void, enabled = true) {
  const cb = useRef(onFiles);
  useEffect(() => {
    cb.current = onFiles;
  });
  useEffect(() => {
    if (!enabled) return;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        cb.current(files);
      }
    };
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      cb.current(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener('paste', onPaste);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [enabled]);
}


/** Object URL for a File/Blob, revoked when it changes or the component unmounts. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      // oxlint-disable-next-line react/set-state-in-effect -- object URLs are an external resource tied to this effect
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
