import type { ToolDefinition } from '../types';

const notepad: ToolDefinition = {
  id: 'notepad',
  name: 'Notepad',
  tagline: 'Quick notes saved in your browser',
  description:
    'Write notes that save automatically in this browser, with search, Markdown preview and export to .txt or .md.',
  category: 'Productivity',
  icon: 'file',
  tags: ['Notes', 'Notepad', 'Markdown'],
  status: 'available',
  shareable: false,
  load: () => import('./NotepadPage'),
  docs: () => import('./docs'),
};

export default notepad;
