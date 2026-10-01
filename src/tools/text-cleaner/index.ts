import type { ToolDefinition } from '../types';

const textCleaner: ToolDefinition = {
  id: 'text-cleaner',
  name: 'Text Cleaner',
  tagline: 'Remove duplicate lines, empty lines and extra spaces',
  description:
    'Clean up text: remove duplicate or empty lines, trim and collapse whitespace, sort, reverse and number lines.',
  category: 'Text',
  icon: 'text',
  tags: ['Lines', 'Duplicates', 'Whitespace', 'Sort'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: true,
  load: () => import('./TextCleanerPage'),
  docs: () => import('./docs'),
};

export default textCleaner;
