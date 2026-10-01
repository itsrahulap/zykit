import type { ToolDefinition } from '../types';

const mimeLookup: ToolDefinition = {
  id: 'mime-lookup',
  name: 'MIME Type Lookup',
  tagline: 'File extension ↔ MIME type',
  description:
    'Find the MIME type for a file extension or the extensions for a MIME type, from a built-in list of common types.',
  category: 'Network & HTTP',
  icon: 'file',
  tags: ['MIME', 'Content-Type', 'Extensions'],
  status: 'available',
  load: () => import('./MimeLookupPage'),
  docs: () => import('./docs'),
};

export default mimeLookup;
