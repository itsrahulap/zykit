import type { ToolDefinition } from '../types';

const unicodeInspector: ToolDefinition = {
  id: 'unicode-inspector',
  name: 'Unicode Inspector',
  tagline: 'See every character, code point and hidden symbol',
  description:
    'Inspect text character by character: code points, names, categories, invisible characters, look-alike letters and normalization.',
  category: 'Text',
  icon: 'text',
  tags: ['Unicode', 'UTF-8', 'Emoji', 'Homoglyph'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: true,
  load: () => import('./UnicodeInspectorPage'),
};

export default unicodeInspector;
