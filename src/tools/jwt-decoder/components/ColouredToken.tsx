const SEGMENT_COLOURS = {
  header: 'text-rose-700 dark:text-rose-400',
  payload: 'text-violet-600 dark:text-violet-400',
  signature: 'text-sky-700 dark:text-sky-400',
};

/** The token with header, payload and signature in distinct colours. */
export function ColouredToken({ parts }: { parts: string[] }) {
  const [h, p, ...rest] = parts;
  return (
    <div className="space-y-2">
      <p className="break-all rounded-2xl bg-slate-50 p-4 font-mono text-sm leading-relaxed dark:bg-slate-950" aria-label="Token segments">
        <span className={SEGMENT_COLOURS.header}>{h}</span>
        {p !== undefined && <span className="text-slate-500 dark:text-slate-400">.</span>}
        <span className={SEGMENT_COLOURS.payload}>{p}</span>
        {rest.length > 0 && <span className="text-slate-500 dark:text-slate-400">.</span>}
        <span className={SEGMENT_COLOURS.signature}>{rest.join('.')}</span>
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400" aria-label="Colour legend">
        {(['header', 'payload', 'signature'] as const).map((k) => (
          <li key={k} className="flex items-center gap-1.5 capitalize">
            <span aria-hidden="true" className={`text-base leading-none ${SEGMENT_COLOURS[k]}`}>●</span> {k}
          </li>
        ))}
      </ul>
    </div>
  );
}
