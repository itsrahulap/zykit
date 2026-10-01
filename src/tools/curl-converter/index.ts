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
  accepts: ['curl'],
  produces: ['code', 'headers'],
  shareable: false, // cURL commands often carry Authorization headers or cookies
  load: () => import('./CurlConverterPage'),
  docs: () => import('./docs'),
};

export default curlConverter;
