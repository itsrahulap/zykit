import type { ToolDefinition } from '../types';

const curlConverter: ToolDefinition = {
  id: 'curl-converter',
  name: 'cURL ↔ Fetch',
  tagline: 'Convert cURL commands to fetch and back',
  description:
    'Turn a cURL command into JavaScript fetch, Node, axios or Python requests code, and convert fetch calls back into cURL.',
  category: 'Developer',
  icon: 'code',
  tags: ['cURL', 'fetch', 'HTTP', 'axios'],
  status: 'available',
  load: () => import('./CurlConverterPage'),
};

export default curlConverter;
