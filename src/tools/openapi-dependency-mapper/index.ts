import type { ToolDefinition } from '../types';

const openapiDependencyMapper: ToolDefinition = {
  id: 'openapi-dependency-mapper',
  name: 'OpenAPI Dependency Mapper',
  tagline: 'Map which API operations use which schemas',
  description:
    'Paste an OpenAPI 3.x document to see operations, tags and component schemas as a graph, with $ref links, filters, unresolved references and a Markdown summary.',
  category: 'Network & HTTP',
  icon: 'network',
  tags: ['openapi', 'swagger', 'dependencies', 'schema', 'ref', 'graph', 'api'],
  status: 'available',
  accepts: ['json', 'yaml'],
  load: () => import('./OpenapiDependencyMapperPage'),
  docs: () => import('./docs'),
};

export default openapiDependencyMapper;
