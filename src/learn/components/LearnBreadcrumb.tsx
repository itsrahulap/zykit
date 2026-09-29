import { Link } from 'react-router';
import { LEARN } from '../data';

/** "Learn / JavaScript / Closures". Every item except the last is a link. */
export function LearnBreadcrumb({ trail }: { trail: { label: string; to?: string }[] }) {
  const items = [{ label: 'Learn', to: LEARN }, ...trail];
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last || !item.to ? (
                <span aria-current={last ? 'page' : undefined} className="font-medium text-slate-900 dark:text-slate-100">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-slate-900 hover:underline dark:hover:text-white">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
