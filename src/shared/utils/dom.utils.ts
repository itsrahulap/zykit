// Small browser helpers: save text as a file, jump to a position in a textarea.

export function downloadText(text: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Focus a textarea and select the character at `offset`. */
export function selectInTextarea(id: string, offset: number) {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (!el) return;
  el.focus();
  el.setSelectionRange(offset, Math.min(offset + 1, el.value.length));
}
