// Drag-and-drop a text file onto a tool's input. Returns handlers to spread on the drop target,
// whether a file is being dragged over it, and a friendly error (too large, not text).

import { useCallback, useRef, useState, type DragEvent } from 'react';
import { MAX_TEXT_FILE_BYTES, readTextFile, TextFileError } from '../lib/textFile';

export interface FileDropOptions {
  onText: (text: string, file: File) => void;
  maxBytes?: number;
  disabled?: boolean;
}

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

export function useFileDrop({ onText, maxBytes = MAX_TEXT_FILE_BYTES, disabled }: FileDropOptions) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const depth = useRef(0);

  const readFile = useCallback(
    (file: File) => {
      setError(null);
      readTextFile(file, maxBytes).then(
        (text) => onText(text, file),
        (err: unknown) => setError(err instanceof TextFileError ? err.message : `Couldn't read ${file.name}.`),
      );
    },
    [onText, maxBytes],
  );

  const bind = disabled
    ? {}
    : {
        onDragEnter: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          depth.current += 1;
          setDragging(true);
        },
        onDragOver: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        },
        onDragLeave: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        },
        onDrop: (e: DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) readFile(file);
        },
      };

  return { dragging, error, setError, readFile, bind };
}
