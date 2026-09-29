// Small browser helpers: save a blob or text as a file, jump to a position in a textarea.

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, fileName: string, type: string) {
  downloadBlob(new Blob([text], { type }), fileName);
}

/** Focus a textarea and select the character at `offset`. */
export function selectInTextarea(id: string, offset: number) {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (!el) return;
  el.focus();
  el.setSelectionRange(offset, Math.min(offset + 1, el.value.length));
}
