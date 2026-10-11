// Notes store: a pure reducer plus (de)serialisation of what goes into localStorage.
// No DOM here, so it is unit-testable in Node. Ids and timestamps are passed in by the caller.

export const STORAGE_KEY = 'zykit-notepad';
export const MAX_NOTES = 500;
export const MAX_NOTE_CHARS = 1_000_000;
export const UNTITLED = 'Untitled note';

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  /** Last edit, ms since epoch. */
  updated: number;
}

export interface NotesState {
  notes: Note[];
  activeId: string;
}

export type Action =
  | { type: 'create'; id: string; now: number }
  | { type: 'edit'; id: string; patch: Partial<Pick<Note, 'title' | 'body'>>; now: number }
  | { type: 'pin'; id: string }
  | { type: 'select'; id: string }
  /** Deleting the last note leaves a fresh empty one (`fallbackId`) so there is always something to type in. */
  | { type: 'delete'; id: string; fallbackId: string; now: number }
  | { type: 'import'; notes: Note[] }
  | { type: 'replace'; state: NotesState };

export const newNote = (id: string, now: number, title = UNTITLED, body = ''): Note => ({ id, title, body, pinned: false, updated: now });

export function initialState(id: string, now: number): NotesState {
  return { notes: [newNote(id, now)], activeId: id };
}

export function reducer(s: NotesState, a: Action): NotesState {
  switch (a.type) {
    case 'create':
      if (s.notes.length >= MAX_NOTES) return s;
      return { notes: [newNote(a.id, a.now), ...s.notes], activeId: a.id };
    case 'edit':
      return {
        ...s,
        notes: s.notes.map((n) =>
          n.id === a.id
            ? { ...n, ...(a.patch.title !== undefined && { title: a.patch.title.slice(0, 200) }), ...(a.patch.body !== undefined && { body: a.patch.body.slice(0, MAX_NOTE_CHARS) }), updated: a.now }
            : n,
        ),
      };
    case 'pin':
      return { ...s, notes: s.notes.map((n) => (n.id === a.id ? { ...n, pinned: !n.pinned } : n)) };
    case 'select':
      return s.notes.some((n) => n.id === a.id) ? { ...s, activeId: a.id } : s;
    case 'delete': {
      const notes = s.notes.filter((n) => n.id !== a.id);
      if (!notes.length) return initialState(a.fallbackId, a.now);
      // Keep the selection if another note was deleted; otherwise move to the first listed note.
      return { notes, activeId: s.activeId === a.id ? sortNotes(notes)[0].id : s.activeId };
    }
    case 'import': {
      const room = a.notes.slice(0, Math.max(0, MAX_NOTES - s.notes.length));
      return room.length ? { notes: [...room, ...s.notes], activeId: room[0].id } : s;
    }
    case 'replace':
      return a.state;
  }
}

/** Pinned notes first, then most recently edited. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated);
}

/** Case-insensitive match on title or body. */
export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  return q ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) : notes;
}

export function serialize(s: NotesState): string {
  return JSON.stringify({ v: 1, ...s });
}

/** Parses stored JSON defensively (it may be corrupt or written by another version). Null if unusable. */
export function parseStored(raw: string | null): NotesState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !Array.isArray((data as { notes?: unknown }).notes)) return null;
    const notes: Note[] = [];
    for (const n of (data as { notes: unknown[] }).notes) {
      if (typeof n !== 'object' || n === null) continue;
      const r = n as Record<string, unknown>;
      if (typeof r.id !== 'string' || typeof r.body !== 'string') continue;
      notes.push({
        id: r.id,
        title: typeof r.title === 'string' ? r.title : UNTITLED,
        body: r.body,
        pinned: r.pinned === true,
        updated: typeof r.updated === 'number' && Number.isFinite(r.updated) ? r.updated : 0,
      });
    }
    if (!notes.length) return null;
    const activeId = (data as { activeId?: unknown }).activeId;
    return { notes, activeId: typeof activeId === 'string' && notes.some((n) => n.id === activeId) ? activeId : sortNotes(notes)[0].id };
  } catch {
    return null;
  }
}

/** A file-name-safe version of a note title. */
export function fileName(title: string, ext: 'txt' | 'md'): string {
  // oxlint-disable-next-line no-control-regex
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim().slice(0, 80) || 'note';
  return `${base}.${ext}`;
}

/** "notes.md" -> "notes". */
export const titleFromFile = (name: string): string => name.replace(/\.(txt|md|markdown)$/i, '').slice(0, 200) || UNTITLED;
