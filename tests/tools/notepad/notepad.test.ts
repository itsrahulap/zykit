import { describe, expect, it } from 'vitest';
import {
  fileName,
  initialState,
  newNote,
  parseStored,
  reducer,
  searchNotes,
  serialize,
  sortNotes,
  titleFromFile,
  type NotesState,
} from '../../../src/tools/notepad/features/store';

const base = (): NotesState => initialState('a', 100);

describe('reducer', () => {
  it('creates a note and selects it, newest first', () => {
    const s = reducer(base(), { type: 'create', id: 'b', now: 200 });
    expect(s.notes.map((n) => n.id)).toEqual(['b', 'a']);
    expect(s.activeId).toBe('b');
  });
  it('edits title and body and stamps the edit time', () => {
    const s = reducer(base(), { type: 'edit', id: 'a', patch: { body: 'hello' }, now: 500 });
    expect(s.notes[0]).toMatchObject({ body: 'hello', title: 'Untitled note', updated: 500 });
    expect(reducer(s, { type: 'edit', id: 'a', patch: { title: 'T' }, now: 600 }).notes[0].title).toBe('T');
  });
  it('pins without changing the edit time', () => {
    const s = reducer(base(), { type: 'pin', id: 'a' });
    expect(s.notes[0]).toMatchObject({ pinned: true, updated: 100 });
  });
  it('ignores selecting an unknown note', () => {
    const s = base();
    expect(reducer(s, { type: 'select', id: 'zzz' })).toBe(s);
  });
  it('deletes, moves the selection, and never leaves zero notes', () => {
    let s = reducer(base(), { type: 'create', id: 'b', now: 200 });
    s = reducer(s, { type: 'delete', id: 'b', fallbackId: 'x', now: 300 });
    expect(s).toMatchObject({ activeId: 'a' });
    expect(s.notes).toHaveLength(1);
    s = reducer(s, { type: 'delete', id: 'a', fallbackId: 'x', now: 300 });
    expect(s.notes.map((n) => n.id)).toEqual(['x']);
    expect(s.activeId).toBe('x');
  });
  it('keeps the selection when another note is deleted', () => {
    let s = reducer(base(), { type: 'create', id: 'b', now: 200 });
    s = reducer(s, { type: 'delete', id: 'a', fallbackId: 'x', now: 300 });
    expect(s.activeId).toBe('b');
  });
  it('imports notes and selects the first', () => {
    const s = reducer(base(), { type: 'import', notes: [newNote('i1', 1, 'One', 'x'), newNote('i2', 2)] });
    expect(s.notes.map((n) => n.id)).toEqual(['i1', 'i2', 'a']);
    expect(s.activeId).toBe('i1');
  });
});

describe('sort and search', () => {
  const notes = [newNote('1', 10, 'Old'), newNote('2', 30, 'New', 'groceries: milk'), { ...newNote('3', 20, 'Pinned'), pinned: true }];
  it('lists pinned first, then newest', () => {
    expect(sortNotes(notes).map((n) => n.id)).toEqual(['3', '2', '1']);
  });
  it('searches titles and bodies, ignoring case', () => {
    expect(searchNotes(notes, 'MILK').map((n) => n.id)).toEqual(['2']);
    expect(searchNotes(notes, 'pin').map((n) => n.id)).toEqual(['3']);
    expect(searchNotes(notes, '  ')).toHaveLength(3);
  });
});

describe('storage format', () => {
  it('round-trips', () => {
    const s = reducer(base(), { type: 'edit', id: 'a', patch: { body: 'x' }, now: 5 });
    expect(parseStored(serialize(s))).toEqual(s);
  });
  it('rejects junk and repairs partial data', () => {
    expect(parseStored(null)).toBeNull();
    expect(parseStored('not json')).toBeNull();
    expect(parseStored('{"notes":[]}')).toBeNull();
    const s = parseStored('{"notes":[{"id":"q","body":"b"},{"nope":1}],"activeId":"missing"}');
    expect(s).toEqual({ notes: [{ id: 'q', title: 'Untitled note', body: 'b', pinned: false, updated: 0 }], activeId: 'q' });
  });
});

describe('file names', () => {
  it('strips unsafe characters and handles extensions', () => {
    expect(fileName('a/b:c?', 'md')).toBe('abc.md');
    expect(fileName('  ', 'txt')).toBe('note.txt');
    expect(titleFromFile('Ideas.MD')).toBe('Ideas');
  });
});
