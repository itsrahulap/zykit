import { useEffect, useId, useRef, useState } from 'react';
import { LIMITS } from '../config/limits';
import { ACCEPTED_TYPES } from '../utils/file.utils';
import { formatBytes } from '../../../shared/utils/format.utils';
import { Button, Icon } from '../../../shared/ui/ui';

export function ImageUploader({
  onFile,
  variant = 'dropzone',
  label = 'Choose a file',
  listenPaste = variant === 'dropzone',
}: {
  onFile: (file: File) => void;
  variant?: 'dropzone' | 'button' | 'secondary';
  label?: string;
  listenPaste?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    if (!listenPaste) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) onFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile, listenPaste]);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
    if (input.current) input.current.value = '';
  };

  const hidden = (
    <input ref={input} type="file" accept={ACCEPTED_TYPES} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => pick(e.target.files)} />
  );

  if (variant !== 'dropzone') {
    return (
      <>
        {hidden}
        <Button variant={variant === 'button' ? 'primary' : 'secondary'} onClick={() => input.current?.click()}>
          {label} <span aria-hidden="true">↗</span>
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
      className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
        dragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
          : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      {hidden}
      <div className="mb-4 rounded-2xl bg-primary p-3 text-primary-ink">
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
