import { useEffect, useId, useRef, useState } from 'react';
import { LIMITS } from '../config/limits';
import { ACCEPTED_TYPES } from '../utils/file.utils';
import { formatBytes } from '../utils/format.utils';
import { Button, Icon } from './ui';

export function ImageUploader({ onFile, compact = false }: { onFile: (file: File) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) onFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile]);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
    if (input.current) input.current.value = '';
  };

  const hidden = (
    <input ref={input} type="file" accept={ACCEPTED_TYPES} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files)} />
  );

  if (compact) {
    return (
      <>
        {hidden}
        <Button variant="secondary" onClick={() => input.current?.click()} aria-label="Select a different image">
          <Icon name="upload" className="h-4 w-4" /> New image
        </Button>
      </>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
        dragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
          : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      {hidden}
      <div className="mb-4 rounded-full bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <Icon name="upload" className="h-7 w-7" />
      </div>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Drop an image here</p>
      <p id={hintId} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        JPEG, PNG or WebP · up to {formatBytes(LIMITS.MAX_FILE_SIZE)} · or paste from clipboard
      </p>
      <Button className="mt-5" onClick={() => input.current?.click()} aria-describedby={hintId}>
        Select image
      </Button>
    </div>
  );
}
