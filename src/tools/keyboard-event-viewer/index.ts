import type { ToolDefinition } from '../types';

const keyboardEventViewer: ToolDefinition = {
  id: 'keyboard-event-viewer',
  name: 'Keyboard Event Viewer',
  tagline: 'See key, code and modifiers for any key press',
  description:
    'Press keys to see KeyboardEvent key, code, location, modifiers and repeat, with a history to copy for bug reports.',
  category: 'Code',
  icon: 'code',
  tags: ['Keyboard', 'KeyboardEvent', 'keycode'],
  status: 'available',
  load: () => import('./KeyboardEventViewerPage'),
  docs: () => import('./docs'),
};

export default keyboardEventViewer;
