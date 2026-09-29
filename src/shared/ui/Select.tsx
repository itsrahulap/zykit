// Styled dropdown that replaces the native <select>, whose open menu can't be themed.
// Follows the WAI-ARIA "select-only combobox" pattern: focus stays on the button and
// the highlighted option is announced via aria-activedescendant.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './ui';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

export function Select<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  options: SelectOption<T>[];
  /** Omit (with a placeholder) for action menus like "Load an example…". */
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const openAt = (i: number) => {
    setActive(Math.max(0, Math.min(options.length - 1, i)));
    setOpen(true);
  };
  const choose = (i: number) => {
    setOpen(false);
    if (options[i] && options[i].value !== value) onChange(options[i].value);
  };

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Keep the highlighted option visible in long lists.
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const typeAhead = (key: string) => {
    const now = Date.now();
    const t = typed.current;
    t.text = now - t.at > 500 ? key : t.text + key;
    t.at = now;
    const start = open ? active + (t.text.length === 1 ? 1 : 0) : Math.max(selectedIndex, 0);
    for (let n = 0; n < options.length; n++) {
      const i = (start + n) % options.length;
      if (options[i].label.toLowerCase().startsWith(t.text.toLowerCase())) return openAt(i);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const from = open ? active : Math.max(selectedIndex, 0);
    const moves: Record<string, number> = {
      ArrowDown: open ? from + 1 : from,
      ArrowUp: open ? from - 1 : from,
      Home: 0,
      End: options.length - 1,
      PageDown: from + 5,
      PageUp: from - 5,
    };
    if (e.key in moves) {
      e.preventDefault();
      openAt(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) choose(active);
      else openAt(from);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab' && open) {
      choose(active);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typeAhead(e.key);
    }
  };

  return (
    <div ref={root} className={`inline-flex items-center gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}>
      <span id={`${id}-label`} className="text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <span className="relative inline-flex">
        <button
          type="button"
          role="combobox"
          aria-labelledby={`${id}-label`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openAt(Math.max(selectedIndex, 0)))}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false);
          }}
          className={`inline-flex min-w-16 pointer-coarse:min-h-11 items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-left text-slate-900 transition-colors hover:border-slate-300 focus:outline-none focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 ${
            open ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className={selected ? '' : 'text-slate-500 dark:text-slate-400'}>{selected?.label ?? placeholder ?? 'Choose…'}</span>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          hidden={!open}
          className="absolute left-0 top-full z-30 mt-1.5 max-h-72 min-w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
        >
          {options.map((o, i) => {
            const isSelected = i === selectedIndex;
            return (
              <li
                key={String(o.value)}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                // Keep focus on the button so the keyboard keeps working after a click.
                onPointerDown={(e) => e.preventDefault()}
                onPointerMove={() => i !== active && setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-4 whitespace-nowrap rounded-xl px-3 py-2 pointer-coarse:py-3 ${
                  i === active ? 'bg-primary text-primary-ink dark:bg-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                {o.label}
                <Icon name="check" className={`h-4 w-4 ${isSelected ? '' : 'invisible'}`} />
              </li>
            );
          })}
        </ul>
      </span>
    </div>
  );
}
