import { parseBlocks, parseInline, type Inline } from '../features/richText';

function Inlines({ parts }: { parts: Inline[] }) {
  return parts.map((p, i) => {
    if (p.kind === 'bold') return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{p.text}</strong>;
    if (p.kind === 'italic') return <em key={i}>{p.text}</em>;
    if (p.kind === 'code')
      return (
        <code key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {p.text}
        </code>
      );
    return <span key={i}>{p.text}</span>;
  });
}

/** One line of lightly marked-up text (bullets, prompts, answers). */
export function InlineText({ text }: { text: string }) {
  return <Inlines parts={parseInline(text)} />;
}

/** Multi-paragraph lesson text with bullet lists. */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-4 leading-relaxed text-slate-700 dark:text-slate-300 ${className}`}>
      {parseBlocks(text).map((b, i) =>
        b.kind === 'list' ? (
          <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-emerald-600 dark:marker:text-emerald-400">
            {b.items.map((item, j) => (
              <li key={j}>
                <Inlines parts={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inlines parts={b.inlines} />
          </p>
        ),
      )}
    </div>
  );
}
