// Keyboard shortcut matching shared by tool pages and the global help dialog.
// Combos are written like 'mod+shift+c': 'mod' is ⌘ on Apple devices and Ctrl elsewhere
// (either is accepted, so a Windows keyboard on a Mac still works).

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function matchShortcut(e: KeyLike, combo: string): boolean {
  const parts = combo.toLowerCase().split('+');
  const key = parts.pop()!;
  const want = { mod: parts.includes('mod'), shift: parts.includes('shift'), alt: parts.includes('alt') };
  const mod = e.ctrlKey || e.metaKey;
  if (mod !== want.mod || e.altKey !== want.alt) return false;
  // Shifted punctuation ("?") already reports the shifted character; don't require Shift for it.
  const k = e.key.toLowerCase();
  if (key.length === 1 && !/[a-z0-9]/.test(key)) return k === key;
  if (e.shiftKey !== want.shift) return false;
  return k === key;
}

/** True while the user is typing: plain-key shortcuts ("?", "/") must not fire then. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag !== 'input') return false;
  const type = ((el as HTMLInputElement).type || 'text').toLowerCase();
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(type);
}

const isApple = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Human label for a combo, e.g. "⌘⇧C" or "Ctrl Shift C". */
export function shortcutText(combo: string): string {
  const parts = combo.split('+');
  const key = parts.pop()!;
  const k = key === 'enter' ? (isApple() ? '↩' : 'Enter') : key.length === 1 ? key.toUpperCase() : key;
  if (isApple()) return parts.map((p) => ({ mod: '⌘', shift: '⇧', alt: '⌥' })[p] ?? p).join('') + k;
  return [...parts.map((p) => ({ mod: 'Ctrl', shift: 'Shift', alt: 'Alt' })[p] ?? p), k].join(' ');
}
