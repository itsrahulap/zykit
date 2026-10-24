import type { ToolDefinition } from '../types';

const openapiDesigner: ToolDefinition = {
  id: 'openapi-designer',
  name: 'OpenAPI Designer',
  tagline: 'Design OpenAPI 3.1 specs with forms and live YAML',
  description:
    'Build an OpenAPI 3.1 document with forms for paths, operations, parameters, request bodies, responses and reusable schemas, with live YAML and JSON and a docs preview.',
  category: 'Network & HTTP',
  icon: 'globe',
  tags: ['openapi', 'swagger', 'api', 'spec', 'yaml', 'rest', 'design'],
  status: 'available',
  load: () => import('./OpenapiDesignerPage'),
  docs: () => import('./docs'),
};

export default openapiDesigner;
