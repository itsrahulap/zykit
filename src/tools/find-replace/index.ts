import type { ToolDefinition } from '../types';

const findReplace: ToolDefinition = {
  id: 'find-replace',
  name: 'Find & Replace',
  tagline: 'Find and replace in any text',
  description:
    'Search text with plain words or regular expressions, preview every replacement and apply them all at once.',
  category: 'Text',
  icon: 'regex',
  tags: ['Find', 'Replace', 'Regex'],
  status: 'available',
  load: () => import('./FindReplacePage'),
};

export default findReplace;
