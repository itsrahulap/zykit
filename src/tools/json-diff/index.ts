import type { ToolDefinition } from '../types';

const jsonDiff: ToolDefinition = {
  id: 'json-diff',
  name: 'JSON Diff',
  tagline: 'Compare two JSON documents structurally',
  description:
    'See exactly which keys and values were added, removed or changed between two JSON documents, ignoring key order and formatting.',
  category: 'Data',
  icon: 'diff',
  tags: ['JSON', 'Diff', 'Compare'],
  status: 'available',
  accepts: ['json'],
  shareable: true,
  load: () => import('./JsonDiffPage'),
  docs: () => import('./docs'),
};

export default jsonDiff;
