import type { ToolDefinition } from '../types';

const httpHeaders: ToolDefinition = {
  id: 'http-headers',
  name: 'HTTP Headers Inspector',
  tagline: 'Paste response headers and get them explained',
  description:
    'Paste raw HTTP headers to see what each one does, check security and caching headers and spot common mistakes.',
  category: 'Developer',
  icon: 'server',
  tags: ['HTTP', 'Headers', 'Security', 'Cache'],
  status: 'available',
  load: () => import('./HttpHeadersPage'),
};

export default httpHeaders;
