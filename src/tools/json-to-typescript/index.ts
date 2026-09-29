import type { ToolDefinition } from '../types';

const jsonToTypescript: ToolDefinition = {
  id: 'json-to-typescript',
  name: 'JSON to TypeScript',
  tagline: 'Generate TypeScript types from JSON',
  description:
    'Paste JSON and get TypeScript interfaces or type aliases, with nested types, optional fields and union types inferred from the data.',
  category: 'Data',
  icon: 'braces',
  tags: ['JSON', 'TypeScript', 'Interfaces', 'Types'],
  status: 'available',
  accepts: ['json'],
  produces: ['code'],
  shareable: true,
  load: () => import('./JsonToTypescriptPage'),
};

export default jsonToTypescript;
