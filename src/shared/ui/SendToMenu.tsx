// "Send to…": opens another tool with this output in its main input. Lists the tools whose
// `accepts` includes the output's kind (see ToolDefinition). Menu-button pattern: arrow keys,
// Home/End, Escape; focus returns to the button when the menu closes.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { toolPath } from '../../tools/registry';
import type { DataKind, ToolDefinition } from '../../tools/types';
import { sendTargets } from '../lib/dataKind';
import { sendText } from '../lib/handoff';
import { useCurrentTool } from './toolContext';
import { Icon } from './ui';

export function SendToMenu({ text, kind, disabled, lang }: { text: string; kind?: DataKind; disabled?: boolean; lang?: string }) {
  const ctx = useCurrentTool();
  const navigate = useNavigate();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  const type = kind ?? ctx?.tool.produces?.[0];
  const targets = type ? sendTargets(type, ctx?.tool.id) : [];

  useEffect(() => {
    if (!open) return;
    items.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  if (!type || targets.length === 0) return null;

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const go = (t: ToolDefinition) => {
    sendText({ to: t.id, text, from: ctx?.tool.id ?? '', kind: type, ...(lang ? { lang } : {}) });
    setOpen(false);
    navigate(toolPath(t));
  };
  const openAt = (i: number) => {
    setActive((i + targets.length) % targets.length);
    setOpen(true);
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAt(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openAt(targets.length - 1);
    }
  };
  const onMenuKey = (e: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: targets.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      openAt(moves[e.key]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={root} className="relative inline-flex">
      <button
        ref={button}
        type="button"
        id={`${id}-button`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        disabled={disabled || !text}
        onClick={() => (open ? close() : openAt(0))}
        onKeyDown={onButtonKey}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 pointer-coarse:min-h-11 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Icon name="arrow" className="h-4 w-4" /> Send to…
      </button>
      <div
        id={`${id}-menu`}
        role="menu"
        aria-labelledby={`${id}-button`}
        hidden={!open}
        onKeyDown={onMenuKey}
        className="absolute right-0 top-full z-30 mt-1.5 max-h-72 w-max max-w-[calc(100vw-2rem)] overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
      >
        {targets.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            role="menuitem"
            tabIndex={i === active ? 0 : -1}
            onPointerMove={() => i !== active && setActive(i)}
            onClick={() => go(t)}
            className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm focus:outline-none pointer-coarse:py-3 ${
              i === active ? 'bg-primary text-primary-ink dark:bg-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <Icon name={t.icon} className="h-4 w-4 shrink-0" /> {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
