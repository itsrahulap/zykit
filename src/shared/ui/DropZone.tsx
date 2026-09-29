// Wraps a tool's input so a text file can be dropped onto it, with a visible drop state and
// a friendly error when the file is too large or isn't text.

import type { ReactNode } from 'react';
import { useFileDrop, type FileDropOptions } from '../hooks/useFileDrop';
import { Icon } from './ui';

export function DropZone({ children, className = '', label = 'Drop a file to open it', ...options }: FileDropOptions & { children: ReactNode; className?: string; label?: string }) {
  const { dragging, error, bind } = useFileDrop(options);
  return (
    <div className={`relative min-w-0 ${className}`} data-dropzone="" data-dragging={dragging || undefined} {...bind}>
      {children}
      {dragging && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50/90 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
        >
          <Icon name="upload" className="h-5 w-5" /> {label}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-400">
          <Icon name="warn" className="mt-0.5 h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{error}</span>
        </p>
      )}
    </div>
  );
}
