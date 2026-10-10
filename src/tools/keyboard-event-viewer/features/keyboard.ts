// Pure helpers: turn a KeyboardEvent into a plain record and format the history.

export const HISTORY_LIMIT = 50;
export const LOCATIONS = ['standard', 'left', 'right', 'numpad'] as const;

export interface KeyRecord {
  n: number;
  type: 'keydown' | 'keyup';
  key: string;
  code: string;
  /** Deprecated; kept because older code still reads it. */
  keyCode: number;
  which: number;
  location: (typeof LOCATIONS)[number];
  modifiers: string[];
  capsLock: boolean;
  numLock: boolean;
  repeat: boolean;
  isComposing: boolean;
  timeStamp: number;
}

export type KeyLike = Pick<KeyboardEvent, 'type' | 'key' | 'code' | 'keyCode' | 'which' | 'location' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey' | 'repeat' | 'isComposing' | 'timeStamp'> & {
  getModifierState: (k: string) => boolean;
};

export function toRecord(e: KeyLike, n: number): KeyRecord {
  const modifiers = [e.ctrlKey && 'Ctrl', e.shiftKey && 'Shift', e.altKey && 'Alt', e.metaKey && 'Meta'].filter(Boolean) as string[];
  return {
    n,
    type: e.type === 'keyup' ? 'keyup' : 'keydown',
    key: e.key,
    code: e.code,
    keyCode: e.keyCode,
    which: e.which,
    location: LOCATIONS[e.location] ?? 'standard',
    modifiers,
    capsLock: e.getModifierState('CapsLock'),
    numLock: e.getModifierState('NumLock'),
    repeat: e.repeat,
    isComposing: e.isComposing,
    timeStamp: Math.round(e.timeStamp * 10) / 10,
  };
}

/** Readable name: a space and other invisible keys would otherwise look empty. */
export const keyLabel = (key: string) => (key === ' ' ? 'Space' : key === '' ? '(none)' : key === 'Unidentified' ? 'Unidentified' : key);

/** Screen-reader text: only the first keydown of a held key. */
export const announcement = (r: KeyRecord) => (r.type === 'keydown' && !r.repeat ? `Key ${keyLabel(r.key)}, code ${r.code || 'none'}` : '');

export const addToHistory = (history: KeyRecord[], r: KeyRecord) => [r, ...history].slice(0, HISTORY_LIMIT);

export const toJson = (h: KeyRecord[]) => JSON.stringify(h, null, 2);

const cell = (s: string | number | boolean) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function toMarkdown(h: KeyRecord[]): string {
  const head = '| # | Event | key | code | keyCode | Location | Modifiers | Caps | Num | Repeat | Composing | Time (ms) |\n|---|---|---|---|---|---|---|---|---|---|---|---|';
  const rows = h.map((r) =>
    `| ${[r.n, r.type, `\`${cell(keyLabel(r.key))}\``, `\`${cell(r.code)}\``, r.keyCode, r.location, r.modifiers.join('+') || '-', r.capsLock, r.numLock, r.repeat, r.isComposing, r.timeStamp].join(' | ')} |`,
  );
  return [head, ...rows].join('\n');
}
