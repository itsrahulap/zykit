import type { ToolDefinition } from '../types';

const jsonpathQuery: ToolDefinition = {
  id: 'jsonpath-query',
  name: 'JSONPath Query',
  tagline: 'Query JSON with JSONPath expressions',
  description:
    'Run JSONPath expressions against pasted JSON and see the matching values and their paths as you type.',
  category: 'Data',
  icon: 'braces',
  tags: ['JSON', 'JSONPath', 'Query'],
  status: 'available',
  accepts: ['json'],
  produces: ['json'],
  shareable: true,
  load: () => import('./JsonpathQueryPage'),
  docs: () => import('./docs'),
};

export default jsonpathQuery;
