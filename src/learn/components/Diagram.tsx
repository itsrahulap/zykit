/** Plain-text diagram from lesson content, shown in a scrollable monospace block. */
export function Diagram({ text, label = 'Diagram' }: { text: string; label?: string }) {
  return (
    <figure className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <figcaption className="sr-only">{label}</figcaption>
      <pre className="w-max font-mono text-xs leading-relaxed text-slate-800 sm:text-sm dark:text-slate-300">{text.replace(/^\n+|\s+$/g, '')}</pre>
    </figure>
  );
}
