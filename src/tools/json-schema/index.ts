import type { ToolDefinition } from '../types';

const jsonSchema: ToolDefinition = {
  id: 'json-schema',
  name: 'JSON Schema Validator',
  tagline: 'Validate JSON against a schema, or generate one',
  description:
    'Validate JSON documents against JSON Schema (draft 2020-12 and 7) with clear error paths, or infer a schema from sample data.',
  category: 'Data',
  icon: 'check',
  tags: ['JSON', 'Schema', 'Validate'],
  status: 'available',
  accepts: ['json'],
  produces: ['json'],
  shareable: true,
  load: () => import('./JsonSchemaPage'),
  docs: () => import('./docs'),
};

export default jsonSchema;
