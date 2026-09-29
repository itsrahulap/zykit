// "Copy share link" for tools that opt in (`shareable: true`): the page's input and options go
// into the URL fragment, which browsers never send to a server. See useShareState.

import { useEffect, useState } from 'react';
import { buildShareLink } from '../lib/share';
import { useCurrentTool } from './toolContext';
import { Icon } from './ui';

type State = 'idle' | 'copied' | 'too-large' | 'failed';

const TIP = 'Copies a link with your input and options in the URL fragment (after #). The fragment is never sent to a server, but anyone you give the link to can read it.';

export function ShareButton() {
  const ctx = useCurrentTool();
  const [state, setState] = useState<State>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), state === 'too-large' ? 3500 : 1800);
    return () => clearTimeout(t);
  }, [state]);
  if (!ctx) return null;

  const share = async () => {
    const current = ctx.getShareState();
    if (!current) return setState('failed');
    try {
      const base = window.location.href.split('#')[0];
      const link = await buildShareLink(current, base);
      if (!link.ok) return setState('too-large');
      await navigator.clipboard.writeText(link.url);
      window.history.replaceState(window.history.state, '', link.url);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  const text = { idle: 'Share', copied: 'Link copied', 'too-large': 'Too large to share', failed: 'Copy failed' }[state];
  return (
    <button
      type="button"
      onClick={share}
      title={TIP}
      aria-label={state === 'idle' ? 'Copy share link' : undefined}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium ring-1 ring-inset transition-colors pointer-coarse:h-11 motion-reduce:transition-none ${
        state === 'too-large' || state === 'failed'
          ? 'text-amber-800 ring-amber-300 dark:text-amber-300 dark:ring-amber-800'
          : 'text-slate-600 ring-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-white'
      }`}
    >
      <Icon name={state === 'copied' ? 'check' : 'link'} className="h-4 w-4" />
      <span aria-live="polite" className={state === 'idle' ? 'hidden sm:inline' : ''}>
        {text}
      </span>
    </button>
  );
}
