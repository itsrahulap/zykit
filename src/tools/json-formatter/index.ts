import type { ToolDefinition } from '../types';

const jsonFormatter: ToolDefinition = {
  id: 'json-formatter',
  name: 'JSON Formatter',
  tagline: 'Format, validate and minify JSON',
  description:
    'Pretty-print or compact JSON, sort keys, and find the exact line and column of syntax errors.',
  category: 'Developer',
  icon: 'braces',
  tags: ['JSON', 'Validate', 'Minify', 'Pretty print'],
  status: 'available',
  accepts: ['json'],
  produces: ['json'],
  shareable: true,
  load: () => import('./JsonFormatterPage'),
  docs: () => import('./docs'),
};

export default jsonFormatter;
