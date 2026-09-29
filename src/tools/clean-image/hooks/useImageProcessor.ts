import { useCallback, useEffect, useRef, useState } from 'react';
import { LIMITS } from '../config/limits';
import type { ProcessingStage } from '../features/pipeline';
import type { ImageMetadataReport } from '../features/metadata/metadata.types';
import type { SanitizeOptions } from '../features/sanitizer/sanitizer.types';
import { AppError } from '../../../shared/lib/errors';
import { formatBytes } from '../../../shared/utils/format.utils';
import { ImageWorkerClient } from '../workers/image.client';
import type { CleanResponse } from '../workers/worker.protocol';

export type AppState =
  | { status: 'idle' }
  | { status: 'analyzing'; file: File; stage: ProcessingStage }
  | { status: 'ready'; file: File; report: ImageMetadataReport; previewUrl: string }
  | { status: 'sanitizing'; file: File; report: ImageMetadataReport; previewUrl: string; stage: ProcessingStage }
  | {
      status: 'completed';
      file: File;
      report: ImageMetadataReport;
      previewUrl: string;
      result: CleanResponse;
      cleanedBlob: Blob;
      cleanedUrl: string;
    };

function toMessage(err: unknown): string | null {
  if (err instanceof AppError) return err.code === 'CANCELLED' ? null : err.message;
  return "We couldn't process this image. The file may be corrupted or use a format that isn't currently supported.";
}

export function useImageProcessor() {
  const [state, setState] = useState<AppState>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const client = useRef<ImageWorkerClient | null>(null);
  const abort = useRef<AbortController | null>(null);
  const urls = useRef<string[]>([]);

  const getClient = () => (client.current ??= new ImageWorkerClient());

  const createUrl = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  };
  const revokeAll = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };

  useEffect(
    () => () => {
      abort.current?.abort();
      client.current?.dispose();
      revokeAll();
    },
    [],
  );

  const selectFile = useCallback(async (file: File) => {
    abort.current?.abort();
    revokeAll();
    setError(null);
    if (file.size > LIMITS.MAX_FILE_SIZE) {
      setState({ status: 'idle' });
      setError(`This file is ${formatBytes(file.size)}. The maximum supported size is ${formatBytes(LIMITS.MAX_FILE_SIZE)}.`);
      return;
    }
    if (file.size === 0) {
      setState({ status: 'idle' });
      setError('This file is empty.');
      return;
    }
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState({ status: 'analyzing', file, stage: 'reading' });
    try {
      const report = await getClient().analyze(file, {
        signal: ctrl.signal,
        onStage: (stage) => setState((s) => (s.status === 'analyzing' ? { ...s, stage } : s)),
      });
      // Only create a preview after the header passed the pixel-limit check in the worker.
      setState({ status: 'ready', file, report, previewUrl: createUrl(file) });
    } catch (err) {
      if (ctrl.signal.aborted && abort.current !== ctrl) return; // superseded by a newer file
      setState({ status: 'idle' });
      setError(toMessage(err));
    }
  }, []);

  const clean = useCallback(
    async (options: SanitizeOptions) => {
      if (state.status !== 'ready' && state.status !== 'completed') return;
      const { file, report, previewUrl } = state;
      const ctrl = new AbortController();
      abort.current = ctrl;
      setError(null);
      setState({ status: 'sanitizing', file, report, previewUrl, stage: 'reading' });
      try {
        const result = await getClient().clean(file, options, {
          signal: ctrl.signal,
          onStage: (stage) => setState((s) => (s.status === 'sanitizing' ? { ...s, stage } : s)),
        });
        const cleanedBlob = new Blob([result.buffer], { type: report.mimeType });
        setState({ status: 'completed', file, report, previewUrl, result, cleanedBlob, cleanedUrl: createUrl(cleanedBlob) });
      } catch (err) {
        setState({ status: 'ready', file, report, previewUrl });
        setError(toMessage(err));
      }
    },
    [state],
  );

  const cancel = useCallback(() => {
    abort.current?.abort();
    setState((s) => {
      if (s.status === 'sanitizing') return { status: 'ready', file: s.file, report: s.report, previewUrl: s.previewUrl };
      return { status: 'idle' };
    });
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    revokeAll();
    setError(null);
    setState({ status: 'idle' });
  }, []);

  return { state, error, dismissError: () => setError(null), selectFile, clean, cancel, reset };
}
