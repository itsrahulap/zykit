import { useMemo } from 'react';
import { markedSource, type FunctionMetrics } from '../features/code-complexity-analyzer';
import { useOverflow } from '../../../shared/hooks/useOverflow';

/** The selected function's source with line numbers and each decision point marked. Text only, never HTML. */
export function MarkedSource({ code, fn }: { code: string; fn: FunctionMetrics }) {
  const lines = useMemo(() => markedSource(code, fn), [code, fn]);
  const [ref, overflowing] = useOverflow<HTMLPreElement>(lines);
  const gutter = String(fn.endLine).length;
  return (
    <pre
      ref={ref}
      role="region"
      aria-label={`Source of ${fn.name} with decision points marked`}
      tabIndex={overflowing ? 0 : undefined}
      className="max-h-[32rem] overflow-auto rounded-2xl bg-slate-100 p-4 font-mono text-sm leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-300"
    >
      {lines.map((line) => (
        <div key={line.number}>
          <span aria-hidden="true" className="mr-4 inline-block select-none text-right text-slate-500 dark:text-slate-500" style={{ minWidth: `${gutter}ch` }}>
            {line.number}
          </span>
          {line.parts.map((part, i) =>
            part.decision ? (
              <mark key={i} title={`+1 (${part.decision})`} className="rounded bg-amber-200 px-px font-semibold text-slate-900 dark:bg-amber-700 dark:text-white">
                {part.text}
              </mark>
            ) : (
              part.text
            ),
          )}
        </div>
      ))}
    </pre>
  );
}
