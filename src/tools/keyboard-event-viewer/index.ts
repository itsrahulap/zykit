import type { ToolDefinition } from '../types';

const keyboardEventViewer: ToolDefinition = {
  id: 'keyboard-event-viewer',
  name: 'Keyboard Event Viewer',
  tagline: 'See key, code, keyCode and modifiers for every keypress',
  description:
    'Press keys and inspect each keydown and keyup: key, code, legacy keyCode, location, modifiers, Caps Lock, repeat and composition. Copy the history as JSON or Markdown. Nothing is sent anywhere.',
  category: 'Code',
  icon: 'code',
  tags: ['Keyboard', 'Key code', 'Events', 'Debug'],
  status: 'available',
  shareable: false,
  load: () => import('./KeyboardEventViewerPage'),
  docs: () => import('./docs'),
};

export default keyboardEventViewer;
