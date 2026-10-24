import type { ToolDefinition } from '../types';

const mockApiGenerator: ToolDefinition = {
  id: 'mock-api-generator',
  name: 'Mock API Generator',
  tagline: 'Design fake API endpoints and export fixtures, json-server or OpenAPI',
  description:
    'Define mock endpoints with methods, paths, status codes and JSON responses, then export fixture files, a json-server db.json or an OpenAPI 3.1 document that Prism can serve.',
  category: 'Data',
  icon: 'server',
  tags: ['mock', 'api', 'fixtures', 'json-server', 'openapi', 'prism', 'stub'],
  status: 'available',
  load: () => import('./MockApiGeneratorPage'),
  docs: () => import('./docs'),
};

export default mockApiGenerator;
